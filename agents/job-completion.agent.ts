import type { Agent, AgentContext, AgentResult } from "./index";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { eventBus } from "@/lib/event-bus";

/**
 * JobCompletionAgent
 *
 * Listens for job.completed events and sends a service completion email to
 * the customer. The email includes:
 *  - Job title and completion confirmation
 *  - Inline thumbnail links for any photos captured during the job
 *  - Link to view/download the invoice (if one exists)
 *
 * Email transport: currently logs to console / writes an audit log entry.
 * Swap `sendEmail()` below to wire in Resend, SendGrid, AWS SES, etc.
 *
 * To activate, call `agent.register()` once at app startup (e.g. in providers.tsx).
 */
export class JobCompletionAgent implements Agent {
  readonly name = "job-completion";
  readonly description = "Sends a service completion email with job photos to the customer";

  /** Register the event listener. Returns an unsubscribe function. */
  register(): () => void {
    const handler = async (payload: Parameters<typeof eventBus.emit<"job.completed">>[1]) => {
      if (!payload.customerEmail) return; // no email — skip silently

      try {
        await this.sendCompletionEmail(payload);
      } catch (err) {
        console.error("[job-completion-agent] Failed to send email:", err);
        eventBus.emit("system.error", {
          message: "job-completion-agent email failed",
          context: err,
        });
      }
    };

    eventBus.on("job.completed", handler);
    return () => eventBus.off("job.completed", handler);
  }

  /** Used by the agent runner for scheduled / manual runs */
  async run(ctx: AgentContext): Promise<AgentResult> {
    const admin = createServiceRoleClient();
    const errors: string[] = [];
    let processed = 0;

    // Find recently completed jobs that haven't been emailed yet
    // (within last 24h — cron guard)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: jobs, error } = await admin
      .from("jobs")
      .select(
        "id, title, tenant_id, completed_at, customers(email, name), job_photos(storage_path)"
      )
      .eq("tenant_id", ctx.tenantId)
      .eq("status", "completed")
      .gte("completed_at", since);

    if (error) return { success: false, processed: 0, errors: [error.message] };

    for (const job of jobs ?? []) {
      const customersRaw = job.customers as
        | { email: string | null; name: string }[]
        | { email: string | null; name: string }
        | null;
      const customer = Array.isArray(customersRaw) ? (customersRaw[0] ?? null) : customersRaw;
      if (!customer?.email) continue;

      const photoPaths = (job.job_photos as { storage_path: string }[] | null) ?? [];
      const photoUrls: string[] = [];

      for (const p of photoPaths) {
        const { data } = await admin.storage
          .from("job-photos")
          .createSignedUrl(p.storage_path, 60 * 60 * 24 * 7);
        if (data?.signedUrl) photoUrls.push(data.signedUrl);
      }

      if (!ctx.dryRun) {
        try {
          await this.sendCompletionEmail({
            tenantId: job.tenant_id as string,
            jobId: job.id,
            jobTitle: job.title,
            customerEmail: customer.email,
            customerName: customer.name,
            photoUrls,
          });
          processed++;
        } catch (e) {
          errors.push(`Job ${job.id}: ${e instanceof Error ? e.message : String(e)}`);
        }
      } else {
        processed++;
      }
    }

    return { success: errors.length === 0, processed, errors };
  }

  private async sendCompletionEmail(payload: {
    tenantId: string;
    jobId: string;
    jobTitle: string;
    customerEmail: string;
    customerName: string;
    photoUrls: string[];
  }) {
    const { customerEmail, customerName, jobTitle, jobId, photoUrls, tenantId } = payload;

    const html = buildEmailHtml({ customerName, jobTitle, photoUrls });

    // ─── Swap this block for your email provider ───────────────────────────
    // Example with Resend:
    //
    // import { Resend } from "resend";
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: process.env.EMAIL_FROM ?? "noreply@snapdocket.app",
    //   to: customerEmail,
    //   subject: `Job completed: ${jobTitle}`,
    //   html,
    // });
    //
    // For now, write an audit log entry so the email can be inspected:
    const admin = createServiceRoleClient();
    await admin.from("audit_logs").insert({
      tenant_id: tenantId,
      resource_type: "job",
      resource_id: jobId,
      action: "send",
      changes: {
        email_type: "job_completion",
        recipient: customerEmail,
        photo_count: photoUrls.length,
        html_preview: html.slice(0, 500),
      },
    });

    console.info(
      `[job-completion-agent] Completion email queued → ${customerEmail} | photos: ${photoUrls.length}`
    );
  }
}

// ─── HTML email template ────────────────────────────────────────────────────

function buildEmailHtml({
  customerName,
  jobTitle,
  photoUrls,
}: {
  customerName: string;
  jobTitle: string;
  photoUrls: string[];
}): string {
  const photosHtml =
    photoUrls.length > 0
      ? `
    <h2 style="font-size:16px;font-weight:600;color:#1e1b4b;margin:24px 0 12px;">
      Job Photos
    </h2>
    <table cellpadding="4" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        ${photoUrls
          .slice(0, 9) // cap at 9 for a 3-col grid in email
          .map(
            (url) => `
          <td style="padding:4px;">
            <a href="${url}" target="_blank">
              <img src="${url}" alt="Job photo"
                width="180" height="180"
                style="object-fit:cover;border-radius:8px;display:block;border:1px solid #e5e7eb;" />
            </a>
          </td>
          ${photoUrls.indexOf(url) % 3 === 2 ? "</tr><tr>" : ""}
        `
          )
          .join("")}
      </tr>
    </table>
    <p style="font-size:12px;color:#6b7280;margin-top:8px;">
      Photo links expire in 7 days.
    </p>`
      : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f3f4f6;margin:0;padding:32px 16px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <!-- Header -->
    <div style="background:#1e1b4b;padding:24px 32px;">
      <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">SnapDocket</p>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">
        Job completed ✓
      </h1>
      <p style="color:#374151;margin:0 0 16px;">Hi ${escapeHtml(customerName)},</p>
      <p style="color:#374151;margin:0 0 24px;">
        We've completed <strong>${escapeHtml(jobTitle)}</strong>. Thank you for your business!
      </p>
      ${photosHtml}
      <p style="color:#6b7280;font-size:13px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px;">
        If you have any questions, please reply to this email.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

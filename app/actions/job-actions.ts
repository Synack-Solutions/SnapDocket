"use server";

import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { eventBus } from "@/lib/event-bus";
import type { JobStatus } from "@/types";

export async function updateJobStatus(jobId: string, status: JobStatus) {
  const supabase = await createServerSupabaseClient();

  const updates: Record<string, unknown> = { status };
  if (status === "in_progress") updates.started_at = new Date().toISOString();
  if (status === "completed") updates.completed_at = new Date().toISOString();

  const { error } = await supabase.from("jobs").update(updates).eq("id", jobId);
  if (error) throw new Error(error.message);

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");

  // Emit enriched completion event so the email agent can pick it up
  if (status === "completed") {
    // Use service role to fetch details RLS might block in server action context
    const admin = createServiceRoleClient();
    const { data: job } = await admin
      .from("jobs")
      .select("title, tenant_id, customers(email, name), job_photos(storage_path)")
      .eq("id", jobId)
      .single();

    if (job) {
      const customersRaw = job.customers as
        | { email: string | null; name: string }[]
        | { email: string | null; name: string }
        | null;
      const customer = Array.isArray(customersRaw) ? (customersRaw[0] ?? null) : customersRaw;
      const photoPaths = (job.job_photos as { storage_path: string }[] | null) ?? [];

      // Generate 7-day signed URLs for email embedding
      const photoUrls: string[] = [];
      for (const p of photoPaths) {
        const { data } = await admin.storage
          .from("job-photos")
          .createSignedUrl(p.storage_path, 60 * 60 * 24 * 7);
        if (data?.signedUrl) photoUrls.push(data.signedUrl);
      }

      eventBus.emit("job.completed", {
        tenantId: job.tenant_id as string,
        jobId,
        jobTitle: job.title as string,
        customerEmail: customer?.email ?? null,
        customerName: customer?.name ?? "Customer",
        photoUrls,
      });
    }
  }
}

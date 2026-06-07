import type { Agent, AgentContext, AgentResult } from "./index";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { eventBus } from "@/lib/event-bus";
import { differenceInDays, parseISO } from "date-fns";

// Scans for overdue invoices and emits reminder events.
// Wire this to a cron job (Vercel Cron, pg_cron, or external scheduler).
export class InvoiceReminderAgent implements Agent {
  readonly name = "invoice-reminder";
  readonly description = "Emits overdue invoice events so notification handlers can send reminders";

  async run(ctx: AgentContext): Promise<AgentResult> {
    const supabase = createServiceRoleClient();
    const errors: string[] = [];
    let processed = 0;

    const { data: overdueInvoices, error } = await supabase
      .from("invoices")
      .select("id, tenant_id, due_date, customers(email)")
      .eq("tenant_id", ctx.tenantId)
      .in("status", ["sent", "viewed", "partial"])
      .lt("due_date", new Date().toISOString().split("T")[0]);

    if (error) {
      return { success: false, processed: 0, errors: [error.message] };
    }

    for (const invoice of overdueInvoices ?? []) {
      const daysOverdue = differenceInDays(new Date(), parseISO(invoice.due_date));

      if (!ctx.dryRun) {
        // Mark invoice as overdue
        await supabase.from("invoices").update({ status: "overdue" }).eq("id", invoice.id);

        eventBus.emit("invoice.overdue", {
          tenantId: invoice.tenant_id,
          invoiceId: invoice.id,
          daysOverdue,
        });
      }

      processed++;
    }

    return { success: true, processed, errors };
  }
}

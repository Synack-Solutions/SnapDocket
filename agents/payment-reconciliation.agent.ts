import type { Agent, AgentContext, AgentResult } from "./index";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Reconciles payment records against invoice balances and corrects status mismatches.
export class PaymentReconciliationAgent implements Agent {
  readonly name = "payment-reconciliation";
  readonly description = "Syncs invoice paid amounts with payment records and corrects status";

  async run(ctx: AgentContext): Promise<AgentResult> {
    const supabase = createServiceRoleClient();
    const errors: string[] = [];
    let processed = 0;

    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("id, total, amount_paid, status, payments(amount, status)")
      .eq("tenant_id", ctx.tenantId)
      .not("status", "in", '("paid","void","draft")');

    if (error) {
      return { success: false, processed: 0, errors: [error.message] };
    }

    for (const invoice of invoices ?? []) {
      const payments = (invoice.payments as Array<{ amount: number; status: string }>) ?? [];
      const totalPaid = payments
        .filter((p) => p.status === "completed")
        .reduce((s, p) => s + Number(p.amount), 0);

      const total = Number(invoice.total);
      let newStatus = invoice.status;

      if (totalPaid >= total) newStatus = "paid";
      else if (totalPaid > 0) newStatus = "partial";

      if (newStatus !== invoice.status && !ctx.dryRun) {
        const { error: updateError } = await supabase
          .from("invoices")
          .update({ status: newStatus, amount_paid: totalPaid })
          .eq("id", invoice.id);

        if (updateError) errors.push(`Invoice ${invoice.id}: ${updateError.message}`);
        else processed++;
      }
    }

    return { success: errors.length === 0, processed, errors };
  }
}

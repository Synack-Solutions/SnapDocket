"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendInvoice(invoiceId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "sent" })
    .eq("id", invoiceId)
    .eq("status", "draft");
  if (error) throw new Error(error.message);
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
}

export async function voidInvoice(invoiceId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "void" })
    .eq("id", invoiceId)
    .not("status", "in", '("paid","void")');
  if (error) throw new Error(error.message);
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
}

export async function recordPayment(
  invoiceId: string,
  tenantId: string,
  data: { amount: number; method: string; reference?: string; notes?: string }
) {
  const supabase = await createServerSupabaseClient();

  // Insert payment record
  const { error: paymentError } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    tenant_id: tenantId,
    amount: data.amount,
    method: data.method,
    reference: data.reference || null,
    notes: data.notes || null,
    status: "completed",
    paid_at: new Date().toISOString(),
  });
  if (paymentError) throw new Error(paymentError.message);

  // Fetch current invoice totals
  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("total, amount_paid")
    .eq("id", invoiceId)
    .single();
  if (fetchError || !invoice) throw new Error(fetchError?.message ?? "Invoice not found");

  const newAmountPaid = Number(invoice.amount_paid) + Number(data.amount);
  const newStatus = newAmountPaid >= Number(invoice.total) ? "paid" : "partial";

  const { error: updateError } = await supabase
    .from("invoices")
    .update({ amount_paid: newAmountPaid, status: newStatus })
    .eq("id", invoiceId);
  if (updateError) throw new Error(updateError.message);

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/payments");
}

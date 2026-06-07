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

export async function duplicateInvoice(invoiceId: string): Promise<string> {
  const supabase = await createServerSupabaseClient();

  const { data: src, error: fetchErr } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", invoiceId)
    .single();
  if (fetchErr || !src) throw new Error(fetchErr?.message ?? "Invoice not found");

  const today = new Date().toISOString().split("T")[0];
  const due = new Date(Date.now() + 14 * 86_400_000).toISOString().split("T")[0];

  const { data: newInvoice, error: insertErr } = await supabase
    .from("invoices")
    .insert({
      tenant_id: src.tenant_id,
      customer_id: src.customer_id,
      job_id: src.job_id,
      invoice_number: `DRAFT-${Date.now()}`,
      status: "draft",
      issued_date: today,
      due_date: due,
      subtotal: src.subtotal,
      tax_rate: src.tax_rate,
      tax_amount: src.tax_amount,
      discount_amount: src.discount_amount,
      total: src.total,
      amount_paid: 0,
      notes: src.notes,
      terms: src.terms,
    })
    .select("id")
    .single();
  if (insertErr || !newInvoice) throw new Error(insertErr?.message ?? "Failed to create invoice");

  // Copy line items
  const items =
    (src.invoice_items as Array<{
      description: string;
      quantity: number;
      unit_price: number;
      tax_rate: number;
      sort_order: number;
    }>) ?? [];

  if (items.length > 0) {
    const { error: itemsErr } = await supabase.from("invoice_items").insert(
      items.map((item) => ({
        invoice_id: newInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        sort_order: item.sort_order,
      }))
    );
    if (itemsErr) throw new Error(itemsErr.message);
  }

  revalidatePath("/invoices");
  return newInvoice.id;
}

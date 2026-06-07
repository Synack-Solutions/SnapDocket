import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EditInvoiceForm } from "@/components/invoice/edit-invoice-form";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("invoices").select("invoice_number").eq("id", id).single();
  return { title: data ? `Edit ${data.invoice_number}` : "Edit Invoice" };
}

export default async function EditInvoicePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const [invoiceResult, customersResult, jobsResult] = await Promise.all([
    supabase.from("invoices").select("*, invoice_items(*)").eq("id", id).single(),
    supabase.from("customers").select("id, name").order("name"),
    supabase.from("jobs").select("id, title, customer_id").order("title"),
  ]);

  if (!invoiceResult.data) notFound();

  const invoice = invoiceResult.data;

  // Only draft invoices are editable
  if (invoice.status !== "draft") {
    redirect(`/invoices/${id}`);
  }

  const items = (
    invoice.invoice_items as Array<{
      id: string;
      description: string;
      quantity: number;
      unit_price: number;
      tax_rate: number;
      sort_order: number;
    }>
  )
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      tax_rate: Number(item.tax_rate),
      sort_order: item.sort_order,
    }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit Invoice — {invoice.invoice_number}</h1>
      <EditInvoiceForm
        invoiceId={id}
        customers={customersResult.data ?? []}
        jobs={jobsResult.data ?? []}
        defaultValues={{
          customer_id: invoice.customer_id,
          job_id: invoice.job_id ?? "",
          due_date: invoice.due_date,
          notes: invoice.notes ?? "",
          terms: invoice.terms ?? "",
          items:
            items.length > 0
              ? items
              : [{ description: "", quantity: 1, unit_price: 0, tax_rate: 10, sort_order: 0 }],
        }}
      />
    </div>
  );
}

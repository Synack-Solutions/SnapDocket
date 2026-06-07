import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CreateInvoiceForm } from "@/components/invoice/invoice-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Invoice" };

export default async function CreateInvoicePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileResult, customersResult, jobsResult] = await Promise.all([
    supabase.from("profiles").select("tenant_id, tenants(settings)").eq("id", user!.id).single(),
    supabase.from("customers").select("id, name").eq("status", "active").order("name"),
    supabase
      .from("jobs")
      .select("id, title, customer_id")
      .in("status", ["pending", "scheduled", "in_progress"])
      .order("title"),
  ]);

  const profile = profileResult.data;
  const settings = (profile?.tenants as { settings?: { invoice_prefix?: string } } | null)
    ?.settings;
  const invoicePrefix = settings?.invoice_prefix ?? "INV-";

  // Get next invoice sequence
  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", profile!.tenant_id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New Invoice</h1>
      <CreateInvoiceForm
        customers={customersResult.data ?? []}
        jobs={jobsResult.data ?? []}
        tenantId={profile!.tenant_id}
        invoicePrefix={invoicePrefix}
        nextSequence={(count ?? 0) + 1}
      />
    </div>
  );
}

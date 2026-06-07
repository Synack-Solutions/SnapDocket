import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PaymentsTable } from "@/components/ui/payments-table";
import type { Metadata } from "next";
import type { Payment } from "@/types";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: payments, error } = await supabase
    .from("payments")
    .select("*, invoices(invoice_number, customers(name))")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Payments</h1>

      <PaymentsTable
        data={
          (payments ?? []) as (Payment & {
            invoices: { invoice_number: string; customers: { name: string } | null } | null;
          })[]
        }
      />
    </div>
  );
}

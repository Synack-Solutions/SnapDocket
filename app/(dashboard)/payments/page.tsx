import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/ui/data-table";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
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
      <h1 className="text-2xl font-bold">Payments</h1>

      <DataTable<
        Payment & {
          invoices: { invoice_number: string; customers: { name: string } | null } | null;
        }
      >
        data={
          (payments ?? []) as (Payment & {
            invoices: { invoice_number: string; customers: { name: string } | null } | null;
          })[]
        }
        columns={[
          {
            key: "invoices",
            header: "Invoice",
            cell: (row) => row.invoices?.invoice_number ?? "—",
          },
          {
            key: "customer",
            header: "Customer",
            className: "hidden sm:table-cell",
            cell: (row) => row.invoices?.customers?.name ?? "—",
          },
          {
            key: "amount",
            header: "Amount",
            cell: (row) => formatCurrency(Number(row.amount)),
          },
          { key: "method", header: "Method", className: "hidden md:table-cell" },
          {
            key: "paid_at",
            header: "Date",
            className: "hidden md:table-cell",
            cell: (row) => (row.paid_at ? formatDate(row.paid_at) : "—"),
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => <Badge variant={statusToBadgeVariant(row.status)}>{row.status}</Badge>,
          },
        ]}
        emptyMessage="No payments recorded yet."
      />
    </div>
  );
}

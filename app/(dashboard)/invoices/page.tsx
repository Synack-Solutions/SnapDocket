import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/ui/data-table";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import type { Invoice } from "@/types";

export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("*, customers(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Link href="/invoices/create">
          <Button size="sm">+ New Invoice</Button>
        </Link>
      </div>

      <DataTable<Invoice & { customers: { name: string } | null }>
        data={(invoices ?? []) as (Invoice & { customers: { name: string } | null })[]}
        columns={[
          { key: "invoice_number", header: "Invoice #" },
          {
            key: "customers",
            header: "Customer",
            className: "hidden sm:table-cell",
            cell: (row) => row.customers?.name ?? "—",
          },
          {
            key: "issued_date",
            header: "Date",
            className: "hidden md:table-cell",
            cell: (row) => formatDate(row.issued_date),
          },
          {
            key: "due_date",
            header: "Due",
            className: "hidden md:table-cell",
            cell: (row) => formatDate(row.due_date),
          },
          {
            key: "total",
            header: "Total",
            cell: (row) => formatCurrency(Number(row.total)),
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => <Badge variant={statusToBadgeVariant(row.status)}>{row.status}</Badge>,
          },
        ]}
        rowHref="/invoices"
        emptyMessage="No invoices yet. Create your first invoice."
      />
    </div>
  );
}

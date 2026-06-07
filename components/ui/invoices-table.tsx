"use client";

import { DataTable } from "@/components/ui/data-table";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice } from "@/types";

type InvoiceRow = Invoice & { customers: { name: string } | null };

interface Props {
  data: InvoiceRow[];
}

export function InvoicesTable({ data }: Props) {
  return (
    <DataTable<InvoiceRow>
      data={data}
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
  );
}

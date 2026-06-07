"use client";

import { DataTable } from "@/components/ui/data-table";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Payment } from "@/types";

type PaymentRow = Payment & {
  invoices: { invoice_number: string; customers: { name: string } | null } | null;
};

interface Props {
  data: PaymentRow[];
}

export function PaymentsTable({ data }: Props) {
  return (
    <DataTable<PaymentRow>
      data={data}
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
  );
}

"use client";

import { DataTable } from "@/components/ui/data-table";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Payment } from "@/types";

type PaymentRow = Payment & {
  invoices: { invoice_number: string; customers: { name: string } | null } | null;
};

const METHOD_LABELS: Record<string, string> = {
  cash: "💵 Cash",
  card: "💳 Card",
  bank_transfer: "🏦 Bank",
  cheque: "📝 Cheque",
  online: "🌐 Online",
};

interface Props {
  data: PaymentRow[];
}

export function PaymentsTable({ data }: Props) {
  const total = data.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="space-y-3">
      {data.length > 0 && (
        <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
          <span>
            {data.length} payment{data.length !== 1 ? "s" : ""}
          </span>
          <span>·</span>
          <span className="font-semibold text-foreground">{formatCurrency(total)} total</span>
        </div>
      )}
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
            cell: (row) => (
              <span className="tabular-nums font-medium">{formatCurrency(Number(row.amount))}</span>
            ),
          },
          {
            key: "method",
            header: "Method",
            className: "hidden md:table-cell",
            cell: (row) =>
              row.method ? (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  {METHOD_LABELS[row.method] ?? row.method}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          },
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

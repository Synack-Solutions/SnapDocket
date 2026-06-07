"use client";

import { DataTable } from "@/components/ui/data-table";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Invoice } from "@/types";

type InvoiceRow = Invoice & { customers: { name: string } | null };

interface Props {
  data: InvoiceRow[];
}

const today = new Date().toISOString().split("T")[0];

function isOverdue(row: InvoiceRow) {
  return row.due_date < today && !["paid", "void", "draft"].includes(row.status);
}

export function InvoicesTable({ data }: Props) {
  return (
    <DataTable<InvoiceRow>
      data={data}
      rowClassName={(row) =>
        isOverdue(row) ? "bg-destructive/5 hover:bg-destructive/10" : undefined
      }
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
          cell: (row) => (
            <span className={cn(isOverdue(row) && "font-semibold text-destructive")}>
              {formatDate(row.due_date)}
            </span>
          ),
        },
        {
          key: "amount_due",
          header: "Amount Due",
          cell: (row) => (
            <span
              className={cn("tabular-nums", isOverdue(row) && "font-semibold text-destructive")}
            >
              {formatCurrency(Number(row.amount_due ?? row.total))}
            </span>
          ),
        },
        {
          key: "status",
          header: "Status",
          cell: (row) => (
            <Badge variant={isOverdue(row) ? "destructive" : statusToBadgeVariant(row.status)}>
              {isOverdue(row) ? "overdue" : row.status}
            </Badge>
          ),
        },
      ]}
      rowHref="/invoices"
      emptyMessage="No invoices yet. Create your first invoice."
    />
  );
}

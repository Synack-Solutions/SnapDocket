"use client";

import { DataTable } from "@/components/ui/data-table";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import type { Customer } from "@/types";

interface Props {
  data: Customer[];
}

export function CustomersTable({ data }: Props) {
  return (
    <DataTable<Customer>
      data={data}
      columns={[
        { key: "name", header: "Name" },
        { key: "email", header: "Email", className: "hidden sm:table-cell" },
        { key: "phone", header: "Phone", className: "hidden md:table-cell" },
        { key: "city", header: "City", className: "hidden lg:table-cell" },
        {
          key: "status",
          header: "Status",
          cell: (row) => <Badge variant={statusToBadgeVariant(row.status)}>{row.status}</Badge>,
        },
      ]}
      rowHref="/customers"
      emptyMessage="No customers yet. Add your first customer."
    />
  );
}

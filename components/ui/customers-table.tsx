"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types";

interface Props {
  data: Customer[];
}

export function CustomersTable({ data }: Props) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? data.filter((c) => {
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q)
        );
      })
    : data;

  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Search by name, email, phone or city…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search customers"
        className={cn(
          "h-9 w-full max-w-sm rounded-lg border border-border bg-background px-3 text-sm",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        )}
      />
      <DataTable<Customer>
        data={filtered}
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
        emptyMessage={
          search ? `No customers match "${search}".` : "No customers yet. Add your first customer."
        }
      />
    </div>
  );
}

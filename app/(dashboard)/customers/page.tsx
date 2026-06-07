import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/ui/data-table";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";
import type { Customer } from "@/types";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: customers, error } = await supabase.from("customers").select("*").order("name");

  if (error) throw error;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Link href="/customers/create">
          <Button size="sm">+ New Customer</Button>
        </Link>
      </div>

      <DataTable<Customer>
        data={customers ?? []}
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
    </div>
  );
}

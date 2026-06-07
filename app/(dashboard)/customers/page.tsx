import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CustomersTable } from "@/components/ui/customers-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: customers, error } = await supabase.from("customers").select("*").order("name");

  if (error) throw error;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Customers</h1>
        <Link href="/customers/create">
          <Button size="sm">+ New Customer</Button>
        </Link>
      </div>

      <CustomersTable data={customers ?? []} />
    </div>
  );
}

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { InvoicesTable } from "@/components/ui/invoices-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
        <h1 className="text-xl font-semibold">Invoices</h1>
        <Link href="/invoices/create">
          <Button size="sm">+ New Invoice</Button>
        </Link>
      </div>

      <InvoicesTable
        data={(invoices ?? []) as (Invoice & { customers: { name: string } | null })[]}
      />
    </div>
  );
}

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { JobsTable } from "@/components/ui/jobs-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";
import type { Job } from "@/types";

export const metadata: Metadata = { title: "Jobs" };

export default async function JobsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*, customers(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Jobs</h1>
        <Link href="/jobs/create">
          <Button size="sm">+ New Job</Button>
        </Link>
      </div>

      <JobsTable data={(jobs ?? []) as (Job & { customers: { name: string } | null })[]} />
    </div>
  );
}

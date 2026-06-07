import { createServerSupabaseClient } from "@/lib/supabase/server";
import { JobsFilter } from "@/components/jobs/jobs-filter";
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
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Jobs</h1>
        <div className="flex gap-2">
          <Link href="/jobs/quick">
            <Button size="sm">⚡ Quick</Button>
          </Link>
          <Link href="/jobs/create">
            <Button size="sm" variant="outline">
              + New Job
            </Button>
          </Link>
        </div>
      </div>

      <JobsFilter data={(jobs ?? []) as (Job & { customers: { name: string } | null })[]} />
    </div>
  );
}

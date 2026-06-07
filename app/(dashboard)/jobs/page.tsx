import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/ui/data-table";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
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
        <h1 className="text-2xl font-bold">Jobs</h1>
        <Link href="/jobs/create">
          <Button size="sm">+ New Job</Button>
        </Link>
      </div>

      <DataTable<Job & { customers: { name: string } | null }>
        data={(jobs ?? []) as (Job & { customers: { name: string } | null })[]}
        columns={[
          { key: "title", header: "Title" },
          {
            key: "customers",
            header: "Customer",
            className: "hidden sm:table-cell",
            cell: (row) => row.customers?.name ?? "—",
          },
          {
            key: "priority",
            header: "Priority",
            className: "hidden md:table-cell",
            cell: (row) => (
              <Badge
                variant={
                  row.priority === "urgent"
                    ? "destructive"
                    : row.priority === "high"
                      ? "warning"
                      : "muted"
                }
              >
                {row.priority}
              </Badge>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => (
              <Badge variant={statusToBadgeVariant(row.status)}>
                {row.status.replace("_", " ")}
              </Badge>
            ),
          },
          {
            key: "scheduled_at",
            header: "Scheduled",
            className: "hidden lg:table-cell",
            cell: (row) => (row.scheduled_at ? formatDate(row.scheduled_at) : "—"),
          },
        ]}
        rowHref="/jobs"
        emptyMessage="No jobs yet. Create your first job."
      />
    </div>
  );
}

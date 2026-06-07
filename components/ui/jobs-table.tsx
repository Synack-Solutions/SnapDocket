"use client";

import { DataTable } from "@/components/ui/data-table";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Job } from "@/types";

type JobRow = Job & { customers: { name: string } | null };

interface Props {
  data: JobRow[];
}

export function JobsTable({ data }: Props) {
  return (
    <DataTable<JobRow>
      data={data}
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
            <Badge variant={statusToBadgeVariant(row.status)}>{row.status.replace("_", " ")}</Badge>
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
  );
}

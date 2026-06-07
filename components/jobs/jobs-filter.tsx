"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Job } from "@/types";

type JobRow = Job & { customers: { name: string } | null };

const FILTERS = [
  { label: "All", value: "all" },
  { label: "In Progress", value: "in_progress" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

interface Props {
  data: JobRow[];
}

export function JobsFilter({ data }: Props) {
  const [filter, setFilter] = useState<FilterValue>("all");

  const filtered = filter === "all" ? data : data.filter((j) => j.status === filter);

  const countFor = (v: FilterValue) =>
    v === "all" ? data.length : data.filter((j) => j.status === v).length;

  return (
    <div className="space-y-3">
      {/* Tab pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((f) => {
          const count = countFor(f.value);
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums leading-none",
                  active ? "bg-white/20 text-white" : "bg-border text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <DataTable<JobRow>
        data={filtered}
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
            cell: (row) => {
              if (!row.scheduled_at) return "—";
              const rel = formatRelativeDate(row.scheduled_at);
              const isToday = rel === "Today";
              const isTomorrow = rel === "Tomorrow";
              return (
                <span
                  className={
                    isToday
                      ? "font-semibold text-accent"
                      : isTomorrow
                        ? "font-medium text-foreground"
                        : undefined
                  }
                >
                  {rel}
                </span>
              );
            },
          },
        ]}
        rowHref="/jobs"
        emptyMessage={
          filter === "all"
            ? "No jobs yet. Create your first job."
            : `No ${filter.replace("_", " ")} jobs.`
        }
      />
    </div>
  );
}

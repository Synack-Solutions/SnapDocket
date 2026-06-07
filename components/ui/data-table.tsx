"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T | string;
  header: string;
  className?: string;
  cell?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  /** Base path for row navigation, e.g. "/customers". Navigates to `${rowHref}/${row.id}`. */
  rowHref?: string;
  className?: string;
}

export function DataTable<T extends { id?: string }>({
  data,
  columns,
  isLoading,
  emptyMessage = "No records found.",
  rowHref,
  className,
}: DataTableProps<T>) {
  const router = useRouter();
  return (
    <div className={cn("w-full overflow-x-auto rounded-lg border border-border", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  "px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-muted" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row.id ?? rowIndex}
                onClick={() => rowHref && row.id && router.push(`${rowHref}/${row.id}`)}
                className={cn(
                  "border-b border-border transition-colors last:border-0",
                  rowHref && "cursor-pointer hover:bg-muted/50"
                )}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className={cn("px-4 py-3", col.className)}>
                    {col.cell
                      ? col.cell(row)
                      : String((row as Record<string, unknown>)[String(col.key)] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

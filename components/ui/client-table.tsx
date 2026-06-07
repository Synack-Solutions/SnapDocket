"use client";

import { useTable } from "@refinedev/react-table";
import { flexRender, type ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ClientTableProps<T extends object> {
  resource: string;
  columns: ColumnDef<T>[];
  /** Supabase-style select expression, e.g. "*, customers(name)" */
  select?: string;
  pageSize?: number;
  className?: string;
}

/**
 * Client-side paginated, sortable table backed by the Refine data provider.
 * Use this when you need interactive filtering/sorting/pagination on the client.
 * For static server-rendered lists, the RSC + DataTable pattern is preferred.
 */
export function ClientTable<T extends object>({
  resource,
  columns,
  select,
  pageSize = 20,
  className,
}: ClientTableProps<T>) {
  const {
    getHeaderGroups,
    getRowModel,
    refineCore: {
      tableQueryResult: { isLoading },
      pageCount,
    },
    getCanPreviousPage,
    getCanNextPage,
    previousPage,
    nextPage,
    getState,
  } = useTable<T>({
    columns,
    refineCoreProps: {
      resource,
      ...(select ? { meta: { select } } : {}),
      pagination: { mode: "server", pageSize },
      sorters: { mode: "server" },
    },
  });

  return (
    <div className={cn("space-y-3", className)}>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            {getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground",
                      header.column.getCanSort() ? "cursor-pointer" : "cursor-default"
                    )}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" && " ↑"}
                    {header.column.getIsSorted() === "desc" && " ↓"}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ) : getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No records found.
                </td>
              </tr>
            ) : (
              getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {getState().pagination.pageIndex + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousPage}
              disabled={!getCanPreviousPage()}
            >
              ← Prev
            </Button>
            <Button variant="outline" size="sm" onClick={nextPage} disabled={!getCanNextPage()}>
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

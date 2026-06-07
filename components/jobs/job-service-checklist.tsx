"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  toggleServiceChecklistItem,
  toggleServiceSubtaskChecklistItem,
} from "@/app/actions/job-checklist-actions";

type SubtaskRow = {
  id: string;
  subtask_label: string;
  is_completed: boolean;
  sort_order: number;
};

type ServiceCheckRow = {
  id: string;
  service_label: string;
  is_completed: boolean;
  sort_order: number;
  job_service_subtask_checks?: SubtaskRow[];
};

export function JobServiceChecklist({ items }: { items: ServiceCheckRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onToggleService = (id: string, next: boolean) => {
    setError(null);
    startTransition(async () => {
      try {
        await toggleServiceChecklistItem(id, next);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update checklist");
      }
    });
  };

  const onToggleSubtask = (id: string, next: boolean) => {
    setError(null);
    startTransition(async () => {
      try {
        await toggleServiceSubtaskChecklistItem(id, next);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update subtask");
      }
    });
  };

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No checklist items yet for this job.</p>;
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}
      <ul className="space-y-2">
        {items.map((item) => {
          const subtasks = (item.job_service_subtask_checks ?? []).sort(
            (a, b) => a.sort_order - b.sort_order
          );
          return (
            <li key={item.id} className="rounded-md border border-border bg-white p-3">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={item.is_completed}
                  disabled={isPending}
                  onChange={(e) => onToggleService(item.id, e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                <span
                  className={
                    item.is_completed
                      ? "text-sm line-through text-muted-foreground"
                      : "text-sm font-medium text-foreground"
                  }
                >
                  {item.service_label}
                </span>
              </label>

              {subtasks.length > 0 && (
                <ul className="mt-2 space-y-1 border-l border-border pl-6">
                  {subtasks.map((st) => (
                    <li key={st.id}>
                      <label className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={st.is_completed}
                          disabled={isPending}
                          onChange={(e) => onToggleSubtask(st.id, e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent"
                        />
                        <span
                          className={
                            st.is_completed
                              ? "text-xs line-through text-muted-foreground"
                              : "text-xs text-foreground"
                          }
                        >
                          {st.subtask_label}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

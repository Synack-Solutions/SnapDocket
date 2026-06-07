"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { updateJobStatus } from "@/app/actions/job-actions";
import type { JobStatus } from "@/types";

interface Transition {
  label: string;
  nextStatus: JobStatus;
  variant?: "primary" | "outline" | "destructive";
}

const STATUS_TRANSITIONS: Record<string, Transition[]> = {
  pending: [
    { label: "Start Job", nextStatus: "in_progress", variant: "primary" },
    { label: "Schedule", nextStatus: "scheduled", variant: "outline" },
  ],
  scheduled: [
    { label: "Start Job", nextStatus: "in_progress", variant: "primary" },
    { label: "Cancel", nextStatus: "cancelled", variant: "outline" },
  ],
  in_progress: [
    { label: "Mark Completed", nextStatus: "completed", variant: "primary" },
    { label: "Cancel", nextStatus: "cancelled", variant: "outline" },
  ],
  completed: [],
  cancelled: [],
};

interface JobStatusActionsProps {
  jobId: string;
  status: JobStatus;
}

export function JobStatusActions({ jobId, status }: JobStatusActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const transitions = STATUS_TRANSITIONS[status] ?? [];
  if (transitions.length === 0) return null;

  const run = (nextStatus: JobStatus) => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await updateJobStatus(jobId, nextStatus);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Failed to update status");
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {transitions.map((t) => (
          <Button
            key={t.nextStatus}
            size="sm"
            variant={t.variant ?? "primary"}
            disabled={isPending}
            onClick={() => run(t.nextStatus)}
          >
            {t.label}
          </Button>
        ))}
      </div>
      {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
    </div>
  );
}

"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { JobStatus } from "@/types";

export async function updateJobStatus(jobId: string, status: JobStatus) {
  const supabase = await createServerSupabaseClient();

  const updates: Record<string, unknown> = { status };
  if (status === "in_progress") updates.started_at = new Date().toISOString();
  if (status === "completed") updates.completed_at = new Date().toISOString();

  const { error } = await supabase.from("jobs").update(updates).eq("id", jobId);
  if (error) throw new Error(error.message);

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
}

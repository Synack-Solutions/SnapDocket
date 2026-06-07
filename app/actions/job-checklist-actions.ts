"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getUserContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.tenant_id) throw new Error("Profile not found");

  return { supabase, userId: user.id, tenantId: profile.tenant_id as string };
}

export async function toggleServiceChecklistItem(checkId: string, isCompleted: boolean) {
  const { supabase, userId, tenantId } = await getUserContext();

  const { data: row, error: fetchError } = await supabase
    .from("job_service_checks")
    .select("job_id")
    .eq("id", checkId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!row) throw new Error("Checklist item not found");

  const { error } = await supabase
    .from("job_service_checks")
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      completed_by: isCompleted ? userId : null,
    })
    .eq("id", checkId)
    .eq("tenant_id", tenantId);
  if (error) throw new Error(error.message);

  if (!isCompleted) {
    await supabase
      .from("job_service_subtask_checks")
      .update({ is_completed: false, completed_at: null, completed_by: null })
      .eq("job_service_check_id", checkId)
      .eq("tenant_id", tenantId);
  }

  revalidatePath(`/jobs/${row.job_id}`);
}

export async function toggleServiceSubtaskChecklistItem(subtaskId: string, isCompleted: boolean) {
  const { supabase, userId, tenantId } = await getUserContext();

  const { data: subtask, error: fetchError } = await supabase
    .from("job_service_subtask_checks")
    .select("job_service_check_id")
    .eq("id", subtaskId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!subtask) throw new Error("Subtask item not found");

  const { error } = await supabase
    .from("job_service_subtask_checks")
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      completed_by: isCompleted ? userId : null,
    })
    .eq("id", subtaskId)
    .eq("tenant_id", tenantId);
  if (error) throw new Error(error.message);

  const { data: allSubtasks, error: subtasksErr } = await supabase
    .from("job_service_subtask_checks")
    .select("is_completed")
    .eq("job_service_check_id", subtask.job_service_check_id)
    .eq("tenant_id", tenantId);
  if (subtasksErr) throw new Error(subtasksErr.message);

  const allComplete =
    (allSubtasks ?? []).length > 0 && (allSubtasks ?? []).every((s) => s.is_completed);

  const { data: parent, error: parentErr } = await supabase
    .from("job_service_checks")
    .select("job_id")
    .eq("id", subtask.job_service_check_id)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (parentErr) throw new Error(parentErr.message);

  await supabase
    .from("job_service_checks")
    .update({
      is_completed: allComplete,
      completed_at: allComplete ? new Date().toISOString() : null,
      completed_by: allComplete ? userId : null,
    })
    .eq("id", subtask.job_service_check_id)
    .eq("tenant_id", tenantId);

  if (parent?.job_id) revalidatePath(`/jobs/${parent.job_id}`);
}

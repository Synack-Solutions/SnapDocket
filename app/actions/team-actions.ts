"use server";

import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getCallerProfile() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.tenant_id) throw new Error("Profile not found");
  if (!["owner", "admin"].includes(profile.role)) throw new Error("Insufficient permissions");

  return { tenantId: profile.tenant_id as string, role: profile.role as string };
}

export async function inviteTeamMember(email: string, role: "admin" | "technician" | "viewer") {
  const { tenantId } = await getCallerProfile();
  const admin = createServiceRoleClient();

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { tenant_id: tenantId, role },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/team");
}

export async function updateMemberRole(memberId: string, role: "admin" | "technician" | "viewer") {
  const supabase = await createServerSupabaseClient();
  const { tenantId } = await getCallerProfile();

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", memberId)
    .eq("tenant_id", tenantId);
  if (error) throw new Error(error.message);

  revalidatePath("/team");
}

export async function removeMember(memberId: string) {
  const supabase = await createServerSupabaseClient();
  const { tenantId } = await getCallerProfile();

  // Soft-deactivate rather than hard delete to preserve audit trail
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("id", memberId)
    .eq("tenant_id", tenantId);
  if (error) throw new Error(error.message);

  revalidatePath("/team");
}

"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

type AccessRole = "admin" | "technician" | "viewer";

async function getManagerContext() {
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

  return { userId: user.id, tenantId: profile.tenant_id as string };
}

export async function submitAccessRequest(input: {
  workspaceSlug: string;
  email: string;
  fullName?: string;
  phone?: string;
  message?: string;
}) {
  const slug = input.workspaceSlug.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();

  if (!slug) throw new Error("Workspace slug is required");
  if (!email) throw new Error("Email is required");

  const admin = createServiceRoleClient();

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (tenantError) throw new Error(tenantError.message);
  if (!tenant?.id) throw new Error("Workspace not found");

  const { error: insertError } = await admin.from("access_requests").insert({
    tenant_id: tenant.id,
    email,
    full_name: input.fullName?.trim() || null,
    phone: input.phone?.trim() || null,
    message: input.message?.trim() || null,
    requested_role: "technician",
    status: "pending",
  });

  if (insertError) {
    const duplicate =
      insertError.code === "23505" ||
      insertError.message.toLowerCase().includes("access_requests_pending_unique");
    if (duplicate) throw new Error("A pending request already exists for this email");
    throw new Error(insertError.message);
  }
}

export async function approveAccessRequest(requestId: string, role: AccessRole) {
  const { tenantId, userId } = await getManagerContext();
  const admin = createServiceRoleClient();

  const { data: request, error: reqError } = await admin
    .from("access_requests")
    .select("id, tenant_id, email, full_name, status")
    .eq("id", requestId)
    .maybeSingle();

  if (reqError) throw new Error(reqError.message);
  if (!request) throw new Error("Request not found");
  if (request.tenant_id !== tenantId) throw new Error("Request does not belong to your workspace");
  if (request.status !== "pending") throw new Error("Request already processed");

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`;
  const invite = await admin.auth.admin.inviteUserByEmail(request.email, {
    data: {
      tenant_id: tenantId,
      role,
      full_name: request.full_name,
    },
    redirectTo,
  });

  if (invite.error) throw new Error(invite.error.message);

  const { error: updError } = await admin
    .from("access_requests")
    .update({
      status: "approved",
      requested_role: role,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
      created_auth_user_id: invite.data.user?.id ?? null,
    })
    .eq("id", requestId)
    .eq("tenant_id", tenantId);

  if (updError) throw new Error(updError.message);

  revalidatePath("/team");
}

export async function rejectAccessRequest(requestId: string) {
  const { tenantId, userId } = await getManagerContext();
  const admin = createServiceRoleClient();

  const { error } = await admin
    .from("access_requests")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    })
    .eq("id", requestId)
    .eq("tenant_id", tenantId)
    .eq("status", "pending");

  if (error) throw new Error(error.message);

  revalidatePath("/team");
}

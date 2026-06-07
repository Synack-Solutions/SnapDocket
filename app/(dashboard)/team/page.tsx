import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TeamManager } from "@/components/team/team-manager";
import type { Metadata } from "next";
import type { Profile } from "@/types";

export const metadata: Metadata = { title: "Team" };

type AccessRequest = {
  id: string;
  email: string;
  full_name: string | null;
  message: string | null;
  requested_role: "admin" | "technician" | "viewer";
  requested_at: string;
};

export default async function TeamPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user!.id)
    .maybeSingle();

  const tenantId = profile?.tenant_id;
  const canManage = ["owner", "admin"].includes(profile?.role ?? "");

  let members: Pick<Profile, "id" | "email" | "full_name" | "role" | "is_active">[] = [];
  let requests: AccessRequest[] = [];
  if (tenantId) {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, is_active")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("role")
      .order("full_name");
    members = (data ?? []) as typeof members;

    if (canManage) {
      const { data: reqRows } = await supabase
        .from("access_requests")
        .select("id, email, full_name, message, requested_role, requested_at")
        .eq("tenant_id", tenantId)
        .eq("status", "pending")
        .order("requested_at", { ascending: true });
      requests = (reqRows ?? []) as AccessRequest[];
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Team</h1>
        <p className="text-sm text-muted-foreground">
          Manage staff access. Invited members receive an email to set up their account.
        </p>
      </div>
      <TeamManager
        members={members}
        requests={requests}
        currentUserId={user!.id}
        canManage={canManage}
      />
    </div>
  );
}

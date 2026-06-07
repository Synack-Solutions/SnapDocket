import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TeamManager } from "@/components/team/team-manager";
import type { Metadata } from "next";
import type { Profile } from "@/types";

export const metadata: Metadata = { title: "Team" };

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
  if (tenantId) {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, is_active")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("role")
      .order("full_name");
    members = (data ?? []) as typeof members;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Team</h1>
        <p className="text-sm text-muted-foreground">
          Manage staff access. Invited members receive an email to set up their account.
        </p>
      </div>
      <TeamManager members={members} currentUserId={user!.id} canManage={canManage} />
    </div>
  );
}

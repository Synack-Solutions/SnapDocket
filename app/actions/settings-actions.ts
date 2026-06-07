"use server";

import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Returns the tenant_id for the authenticated user.
 * If no profile exists yet (e.g. user signed up before the DB trigger was added),
 * bootstraps a tenant + profile via the service-role client so subsequent calls succeed.
 */
async function getTenantId(): Promise<string> {
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

  if (profile?.tenant_id) return profile.tenant_id as string;

  // Bootstrap: create tenant + profile for users created before the trigger
  const admin = createServiceRoleClient();
  const name = user.email?.split("@")[1]?.replace(/\./g, " ") ?? "My Company";
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.floor(Date.now() / 1000);

  const { data: tenant, error: tenantErr } = await admin
    .from("tenants")
    .insert({ name, slug, status: "trial" })
    .select("id")
    .single();
  if (tenantErr) throw new Error(tenantErr.message);

  await admin.from("profiles").insert({
    id: user.id,
    tenant_id: tenant.id,
    email: user.email,
    full_name: user.email?.split("@")[0] ?? null,
    role: "owner",
  });

  return tenant.id as string;
}

export async function upsertService(service: {
  id: string;
  label: string;
  description?: string;
  unitPrice: number;
  category: "core" | "addon";
}) {
  const supabase = await createServerSupabaseClient();
  const tenantId = await getTenantId();

  const { error } = await supabase.from("services").upsert(
    {
      id: service.id,
      tenant_id: tenantId,
      label: service.label,
      description: service.description ?? null,
      unit_price: service.unitPrice,
      category: service.category,
    },
    { onConflict: "id" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/services");
  revalidatePath("/jobs/quick");
}

export async function deleteService(serviceId: string) {
  const supabase = await createServerSupabaseClient();
  // ensure tenant scoping — RLS enforces this but being explicit
  await getTenantId();

  const { error } = await supabase.from("services").delete().eq("id", serviceId);
  if (error) throw new Error(error.message);

  revalidatePath("/services");
  revalidatePath("/jobs/quick");
}

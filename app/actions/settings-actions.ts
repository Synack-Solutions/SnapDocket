"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TenantSettings } from "@/types";

async function getTenantId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (error || !profile) throw new Error("Profile not found");

  return profile.tenant_id as string;
}

export async function upsertService(service: {
  id: string;
  label: string;
  description?: string;
  unitPrice: number;
  category: "core" | "addon";
}) {
  const supabase = await createServerSupabaseClient();
  const tenantId = await getTenantId(supabase);

  const { data: tenant, error: fetchError } = await supabase
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const settings: TenantSettings = (tenant?.settings as TenantSettings) ?? {
    currency: "AUD",
    timezone: "Australia/Sydney",
    invoice_prefix: "INV-",
    tax_rate: 10,
    payment_terms_days: 14,
    services: [],
  };

  const existing = settings.services ?? [];
  const idx = existing.findIndex((s) => s.id === service.id);
  if (idx >= 0) {
    existing[idx] = service;
  } else {
    existing.push(service);
  }

  const { error } = await supabase
    .from("tenants")
    .update({ settings: { ...settings, services: existing } })
    .eq("id", tenantId);
  if (error) throw new Error(error.message);

  revalidatePath("/settings/services");
  revalidatePath("/jobs/quick");
}

export async function deleteService(serviceId: string) {
  const supabase = await createServerSupabaseClient();
  const tenantId = await getTenantId(supabase);

  const { data: tenant, error: fetchError } = await supabase
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const settings: TenantSettings = (tenant?.settings as TenantSettings) ?? {};
  const services = (settings.services ?? []).filter((s) => s.id !== serviceId);

  const { error } = await supabase
    .from("tenants")
    .update({ settings: { ...settings, services } })
    .eq("id", tenantId);
  if (error) throw new Error(error.message);

  revalidatePath("/settings/services");
  revalidatePath("/jobs/quick");
}

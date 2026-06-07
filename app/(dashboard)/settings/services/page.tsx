import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ServicesForm } from "@/components/settings/services-form";
import type { Metadata } from "next";
import type { TenantSettings } from "@/types";
import type { ServiceOption } from "@/components/jobs/service-picker";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesSettingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, tenants(settings)")
    .eq("id", user!.id)
    .single();

  const settings = (profile?.tenants as { settings?: TenantSettings } | null)?.settings;
  const services: ServiceOption[] = settings?.services ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Services</h1>
        <p className="text-sm text-muted-foreground">
          Define your service catalogue. These appear in Quick Job and on invoices.
        </p>
      </div>
      <ServicesForm initial={services} />
    </div>
  );
}

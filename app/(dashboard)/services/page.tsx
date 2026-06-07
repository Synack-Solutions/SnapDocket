import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ServicesForm } from "@/components/settings/services-form";
import type { Metadata } from "next";
import type { ServiceOption } from "@/components/jobs/service-picker";

export const metadata: Metadata = { title: "Services" };

function isServicesTableMissing(error: { code?: string; message?: string } | null): boolean {
  return Boolean(
    error &&
    (error.code === "PGRST205" ||
      error.message?.includes("Could not find the table 'public.services' in the schema cache"))
  );
}

export default async function ServicesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user!.id)
    .maybeSingle();

  let services: ServiceOption[] = [];
  let servicesUnavailable = false;
  if (profile?.tenant_id) {
    const { data, error } = await supabase
      .from("services")
      .select(
        "id, label, description, unit_price, category, service_subtasks(label, sort_order, is_active)"
      )
      .eq("tenant_id", profile.tenant_id)
      .eq("is_active", true)
      .order("sort_order")
      .order("created_at");

    if (isServicesTableMissing(error)) {
      servicesUnavailable = true;
    } else if (error) {
      throw new Error(error.message);
    }

    services = (data ?? []).map((s) => ({
      id: s.id,
      label: s.label,
      description: s.description ?? undefined,
      unitPrice: Number(s.unit_price),
      category: s.category as "core" | "addon",
      subtasks: (
        (
          s as {
            service_subtasks?: Array<{ label: string; is_active?: boolean; sort_order?: number }>;
          }
        ).service_subtasks ?? []
      )
        .filter((st) => st.is_active !== false)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((st) => st.label),
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Services</h1>
        <p className="text-sm text-muted-foreground">
          Define your service catalogue. Services appear in Quick Job and become invoice line items.
        </p>
        {servicesUnavailable && (
          <p className="mt-2 rounded border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
            Services table is not initialized in this environment. Apply migration
            <span className="font-medium"> 003_services_and_profile_trigger.sql</span> in Supabase,
            then refresh this page.
          </p>
        )}
      </div>
      <ServicesForm initial={services} />
    </div>
  );
}

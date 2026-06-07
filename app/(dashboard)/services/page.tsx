import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ServicesForm } from "@/components/settings/services-form";
import type { Metadata } from "next";
import type { ServiceOption } from "@/components/jobs/service-picker";

export const metadata: Metadata = { title: "Services" };

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
  if (profile?.tenant_id) {
    const { data } = await supabase
      .from("services")
      .select("id, label, description, unit_price, category")
      .eq("tenant_id", profile.tenant_id)
      .eq("is_active", true)
      .order("sort_order")
      .order("created_at");

    services = (data ?? []).map((s) => ({
      id: s.id,
      label: s.label,
      description: s.description ?? undefined,
      unitPrice: Number(s.unit_price),
      category: s.category as "core" | "addon",
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Services</h1>
        <p className="text-sm text-muted-foreground">
          Define your service catalogue. Services appear in Quick Job and become invoice line items.
        </p>
      </div>
      <ServicesForm initial={services} />
    </div>
  );
}

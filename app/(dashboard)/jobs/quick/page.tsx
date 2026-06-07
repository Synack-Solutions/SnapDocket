import { createServerSupabaseClient } from "@/lib/supabase/server";
import { QuickJobForm } from "@/components/jobs/quick-job-form";
import type { ServiceOption } from "@/components/jobs/service-picker";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quick Job" };

export default async function QuickJobPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user!.id)
    .maybeSingle();

  const [servicesResult, customersResult] = await Promise.all([
    profile?.tenant_id
      ? supabase
          .from("services")
          .select(
            "id, label, description, unit_price, category, service_subtasks(label, sort_order, is_active)"
          )
          .eq("tenant_id", profile.tenant_id)
          .eq("is_active", true)
          .order("sort_order")
          .order("created_at")
      : Promise.resolve({ data: [] }),
    supabase.from("customers").select("id, name, phone").eq("status", "active").order("name"),
  ]);

  const services: ServiceOption[] = (servicesResult.data ?? []).map((s) => ({
    id: s.id,
    label: s.label,
    description: (s as { description?: string }).description ?? undefined,
    unitPrice: Number(s.unit_price),
    category: (s as { category: string }).category as "core" | "addon",
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

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold">Quick Job</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Select a customer and services — a job and draft invoice are created instantly.
        </p>
      </div>
      <QuickJobForm services={services} customers={customersResult.data ?? []} />
    </div>
  );
}

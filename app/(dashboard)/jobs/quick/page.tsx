import { createServerSupabaseClient } from "@/lib/supabase/server";
import { QuickJobForm } from "@/components/jobs/quick-job-form";
import type { ServiceOption } from "@/components/jobs/service-picker";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quick Job" };

// Default service catalogue — tenants override this in their settings (services array)
const DEFAULT_SERVICES: ServiceOption[] = [
  { id: "ext-wash", label: "Exterior Wash", unitPrice: 30, category: "core" },
  { id: "int-clean", label: "Interior Clean", unitPrice: 40, category: "core" },
  { id: "full-detail", label: "Full Detail", unitPrice: 120, category: "core" },
  { id: "wax-polish", label: "Wax & Polish", unitPrice: 60, category: "addon" },
  { id: "engine-bay", label: "Engine Bay Clean", unitPrice: 45, category: "addon" },
  { id: "odour-treat", label: "Odour Treatment", unitPrice: 25, category: "addon" },
  { id: "headlight", label: "Headlight Restore", unitPrice: 35, category: "addon" },
  { id: "leather-cond", label: "Leather Condition", unitPrice: 30, category: "addon" },
  { id: "paint-seal", label: "Paint Sealant", unitPrice: 50, category: "addon" },
];

export default async function QuickJobPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileResult, customersResult] = await Promise.all([
    supabase.from("profiles").select("tenant_id, tenants(settings)").eq("id", user!.id).single(),
    supabase.from("customers").select("id, name, phone").eq("status", "active").order("name"),
  ]);

  // Allow tenants to define their own services via settings.services
  const tenantSettings = (
    profileResult.data?.tenants as { settings?: { services?: ServiceOption[] } } | null
  )?.settings;
  const services = tenantSettings?.services ?? DEFAULT_SERVICES;

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

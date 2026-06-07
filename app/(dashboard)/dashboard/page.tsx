import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user!.id)
    .single();

  const tenantId = profile?.tenant_id;

  const [customersResult, jobsResult, invoicesResult, paymentsResult, activityResult] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId!),
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId!)
        .eq("status", "in_progress"),
      supabase.from("invoices").select("total").eq("tenant_id", tenantId!).eq("status", "sent"),
      supabase
        .from("payments")
        .select("amount")
        .eq("tenant_id", tenantId!)
        .gte(
          "created_at",
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        ),
      supabase
        .from("audit_logs")
        .select("id, resource_type, resource_id, action, created_at")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false })
        .limit(15),
    ]);

  const totalOutstanding = invoicesResult.data?.reduce((s, i) => s + Number(i.total), 0) ?? 0;
  const monthlyRevenue = paymentsResult.data?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const activities = activityResult.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Customers" value={String(customersResult.count ?? 0)} />
        <StatCard title="Active Jobs" value={String(jobsResult.count ?? 0)} />
        <StatCard title="Outstanding" value={formatCurrency(totalOutstanding)} />
        <StatCard title="This Month" value={formatCurrency(monthlyRevenue)} />
      </div>

      {/* TODO: Add charts (recharts / chart.js) for revenue trend and job pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {activities.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-4 text-sm">
                  <span>
                    <span className="capitalize font-medium">{entry.resource_type}</span>{" "}
                    <span className="text-muted-foreground">{entry.action}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(entry.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

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
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your business at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard title="Total Customers" value={String(customersResult.count ?? 0)} />
        <StatCard title="Active Jobs" value={String(jobsResult.count ?? 0)} />
        <StatCard title="Outstanding" value={formatCurrency(totalOutstanding)} />
        <StatCard title="This Month" value={formatCurrency(monthlyRevenue)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {activities.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-4 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                    <span>
                      <span className="capitalize font-medium text-foreground">
                        {entry.resource_type}
                      </span>
                      <span className="text-muted-foreground"> {entry.action}</span>
                    </span>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
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
    <Card className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{value}</p>
    </Card>
  );
}

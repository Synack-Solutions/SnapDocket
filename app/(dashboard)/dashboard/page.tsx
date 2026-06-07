import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, full_name")
    .eq("id", user!.id)
    .single();

  const tenantId = profile?.tenant_id;
  const today = new Date().toISOString().split("T")[0];

  const [
    customersResult,
    activeJobsResult,
    scheduledTodayResult,
    outstandingResult,
    overdueResult,
    paymentsResult,
    recentJobsResult,
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId!),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId!)
      .eq("status", "in_progress"),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId!)
      .eq("status", "scheduled")
      .gte("scheduled_at", today)
      .lt("scheduled_at", today + "T23:59:59"),
    supabase
      .from("invoices")
      .select("amount_due")
      .eq("tenant_id", tenantId!)
      .in("status", ["sent", "partial", "viewed"]),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId!)
      .in("status", ["sent", "partial", "viewed"])
      .lt("due_date", today),
    supabase
      .from("payments")
      .select("amount")
      .eq("tenant_id", tenantId!)
      .gte(
        "created_at",
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      ),
    supabase
      .from("jobs")
      .select("id, title, status, priority, scheduled_at, customers(name)")
      .eq("tenant_id", tenantId!)
      .in("status", ["in_progress", "scheduled", "pending"])
      .order("scheduled_at", { ascending: true, nullsFirst: false })
      .limit(8),
  ]);

  const totalOutstanding =
    outstandingResult.data?.reduce((s, i) => s + Number(i.amount_due), 0) ?? 0;
  const monthlyRevenue = paymentsResult.data?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const overdueCount = overdueResult.count ?? 0;
  const recentJobs = recentJobsResult.data ?? [];
  const firstName = profile?.full_name?.split(" ")[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {firstName ? `Hey, ${firstName} 👋` : "Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">Your business at a glance</p>
        </div>
        {/* Quick actions */}
        <div className="hidden gap-2 sm:flex">
          <Link href="/jobs/quick">
            <Button size="sm">⚡ Quick Job</Button>
          </Link>
          <Link href="/customers/create">
            <Button size="sm" variant="outline">
              + Customer
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile quick actions */}
      <div className="flex gap-2 sm:hidden">
        <Link href="/jobs/quick" className="flex-1">
          <Button size="sm" className="w-full">
            ⚡ Quick Job
          </Button>
        </Link>
        <Link href="/customers/create" className="flex-1">
          <Button size="sm" variant="outline" className="w-full">
            + Customer
          </Button>
        </Link>
      </div>

      {overdueCount > 0 && (
        <Link href="/invoices">
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors">
            <span className="font-medium">
              ⚠️ {overdueCount} overdue invoice{overdueCount !== 1 ? "s" : ""}
            </span>
            <span className="text-xs underline">View →</span>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard title="Customers" value={String(customersResult.count ?? 0)} href="/customers" />
        <StatCard
          title="Active Jobs"
          value={String(activeJobsResult.count ?? 0)}
          href="/jobs"
          highlight={Number(activeJobsResult.count) > 0}
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(totalOutstanding)}
          href="/invoices"
          highlight={totalOutstanding > 0}
        />
        <StatCard title="This Month" value={formatCurrency(monthlyRevenue)} href="/payments" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming / active jobs */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">
              Open Jobs
              {scheduledTodayResult.count! > 0 && (
                <Badge variant="default" className="ml-2 text-xs">
                  {scheduledTodayResult.count} today
                </Badge>
              )}
            </CardTitle>
            <Link href="/jobs" className="text-xs text-accent hover:underline">
              All jobs →
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {recentJobs.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No open jobs.</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentJobs.map((job) => {
                  const customer = job.customers as { name: string } | null;
                  return (
                    <li key={job.id}>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-muted/40 -mx-2 px-2 rounded transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{job.title}</p>
                          {customer?.name && (
                            <p className="truncate text-xs text-muted-foreground">
                              {customer.name}
                              {job.scheduled_at && ` · ${formatDate(job.scheduled_at)}`}
                            </p>
                          )}
                        </div>
                        <Badge variant={statusToBadgeVariant(job.status)} className="shrink-0">
                          {job.status.replace("_", " ")}
                        </Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Overdue / outstanding invoices summary */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Revenue Summary</CardTitle>
            <Link href="/invoices" className="text-xs text-accent hover:underline">
              All invoices →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex justify-between rounded-lg bg-muted/40 px-4 py-3 text-sm">
              <span className="text-muted-foreground">Outstanding (unpaid)</span>
              <span className="font-semibold tabular-nums">{formatCurrency(totalOutstanding)}</span>
            </div>
            {overdueCount > 0 && (
              <div className="flex justify-between rounded-lg bg-destructive/5 px-4 py-3 text-sm">
                <span className="text-destructive">
                  Overdue ({overdueCount} invoice{overdueCount !== 1 ? "s" : ""})
                </span>
                <Link href="/invoices" className="text-xs font-medium text-destructive underline">
                  Review
                </Link>
              </div>
            )}
            <div className="flex justify-between rounded-lg bg-success/5 px-4 py-3 text-sm">
              <span className="text-muted-foreground">Collected this month</span>
              <span className="font-semibold tabular-nums text-success">
                {formatCurrency(monthlyRevenue)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  href,
  highlight,
}: {
  title: string;
  value: string;
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <Card className={`p-4 transition-colors ${href ? "hover:bg-muted/40 cursor-pointer" : ""}`}>
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p
        className={`mt-1.5 text-2xl font-bold tracking-tight ${highlight ? "text-accent" : "text-foreground"}`}
      >
        {value}
      </p>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

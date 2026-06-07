import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("customers").select("name").eq("id", id).single();
  return { title: data?.name ?? "Customer" };
}

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const [customerResult, jobsResult, invoicesResult, serviceHistoryResult] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).single(),
    supabase
      .from("jobs")
      .select("id, title, status, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("invoices")
      .select("id, invoice_number, total, status, issued_date")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    // Service history: last 5 invoices with their line items, for "what they usually get"
    supabase
      .from("invoices")
      .select("id, issued_date, total, invoice_items(description, quantity, unit_price)")
      .eq("customer_id", id)
      .not("status", "in", '("void")')
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (!customerResult.data) notFound();
  const customer = customerResult.data;

  // Build a frequency map of services for the "usually gets" section
  type ServiceFreq = { description: string; count: number; lastPrice: number };
  const serviceFreq = new Map<string, ServiceFreq>();
  for (const inv of serviceHistoryResult.data ?? []) {
    for (const item of (inv.invoice_items as Array<{
      description: string;
      quantity: number;
      unit_price: number;
    }>) ?? []) {
      const key = item.description.toLowerCase();
      const existing = serviceFreq.get(key);
      if (existing) {
        existing.count += 1;
        existing.lastPrice = Number(item.unit_price);
      } else {
        serviceFreq.set(key, {
          description: item.description,
          count: 1,
          lastPrice: Number(item.unit_price),
        });
      }
    }
  }
  const topServices = [...serviceFreq.values()].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/customers" className="text-sm text-muted-foreground hover:text-foreground">
            ← Customers
          </Link>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">{customer.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/jobs/quick?customerId=${id}`}>
            <Button size="sm">Quick Job</Button>
          </Link>
          <Link href={`/invoices/create?customerId=${id}`}>
            <Button variant="outline" size="sm">
              New Invoice
            </Button>
          </Link>
          <Link href={`/customers/${id}/edit`}>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {customer.email && (
              <p>
                <span className="text-muted-foreground">Email:</span> {customer.email}
              </p>
            )}
            {customer.phone && (
              <p>
                <span className="text-muted-foreground">Phone:</span> {customer.phone}
              </p>
            )}
            {customer.address_line1 && (
              <p>
                <span className="text-muted-foreground">Address:</span>{" "}
                {[
                  customer.address_line1,
                  customer.address_line2,
                  customer.city,
                  customer.state,
                  customer.postcode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            <div className="pt-1">
              <Badge variant={statusToBadgeVariant(customer.status)}>{customer.status}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {jobsResult.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs yet.</p>
            ) : (
              <ul className="space-y-2">
                {jobsResult.data?.map((job) => (
                  <li key={job.id} className="flex items-center justify-between text-sm">
                    <Link href={`/jobs/${job.id}`} className="hover:underline">
                      {job.title}
                    </Link>
                    <Badge variant={statusToBadgeVariant(job.status)}>
                      {job.status.replace("_", " ")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {topServices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Usually Gets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {topServices.map((s) => (
                  <span
                    key={s.description}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs"
                  >
                    {s.description}
                    {s.count > 1 && (
                      <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        ×{s.count}
                      </span>
                    )}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Based on last {Math.min(serviceHistoryResult.data?.length ?? 0, 5)} visits
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            {invoicesResult.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {invoicesResult.data?.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <Link href={`/invoices/${inv.id}`} className="font-medium hover:underline">
                        {inv.invoice_number}
                      </Link>
                      <p className="text-xs text-muted-foreground">{formatDate(inv.issued_date)}</p>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <span className="font-medium">{formatCurrency(Number(inv.total))}</span>
                      <Badge variant={statusToBadgeVariant(inv.status)}>{inv.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

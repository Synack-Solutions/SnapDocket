import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JobStatusActions } from "@/components/jobs/job-status-actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import type { JobStatus } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("jobs").select("title").eq("id", id).single();
  return { title: data?.title ?? "Job" };
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*, customers(*), assigned_profile:profiles!assigned_to(full_name)")
    .eq("id", id)
    .single();

  if (!job) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/jobs" className="text-sm text-muted-foreground hover:text-foreground">
            ← Jobs
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold sm:text-2xl">{job.title}</h1>
            <Badge variant={statusToBadgeVariant(job.status)}>{job.status.replace("_", " ")}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/invoices/create?customerId=${job.customer_id}&jobId=${id}`}>
            <Button size="sm">Create Invoice</Button>
          </Link>
          <Link href={`/jobs/${id}/edit`}>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </Link>
          <JobStatusActions jobId={id} status={job.status as JobStatus} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Customer:</span>{" "}
              <Link href={`/customers/${job.customer_id}`} className="hover:underline">
                {(job.customers as { name: string })?.name}
              </Link>
            </p>
            <p>
              <span className="text-muted-foreground">Priority:</span>{" "}
              <Badge
                variant={
                  job.priority === "urgent"
                    ? "destructive"
                    : job.priority === "high"
                      ? "warning"
                      : "muted"
                }
              >
                {job.priority}
              </Badge>
            </p>
            {job.scheduled_at && (
              <p>
                <span className="text-muted-foreground">Scheduled:</span>{" "}
                {formatDate(job.scheduled_at)}
              </p>
            )}
            {job.site_address && (
              <p>
                <span className="text-muted-foreground">Site:</span> {job.site_address}
              </p>
            )}
            {(job.assigned_profile as { full_name?: string } | null)?.full_name && (
              <p>
                <span className="text-muted-foreground">Assigned to:</span>{" "}
                {(job.assigned_profile as { full_name: string }).full_name}
              </p>
            )}
          </CardContent>
        </Card>

        {job.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{job.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

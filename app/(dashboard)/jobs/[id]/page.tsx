import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JobStatusActions } from "@/components/jobs/job-status-actions";
import { JobPhotoGallery } from "@/components/jobs/job-photo-gallery";
import { JobServiceChecklist } from "@/components/jobs/job-service-checklist";
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user!.id)
    .maybeSingle();

  const tenantId = profile?.tenant_id as string | undefined;

  const [{ data: job }, { data: photoRows }, { data: linkedInvoice }, { data: checklistRows }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select("*, customers(*), assigned_profile:profiles!assigned_to(full_name)")
        .eq("id", id)
        .single(),
      tenantId
        ? supabase
            .from("job_photos")
            .select("id, storage_path, file_name, caption, taken_at")
            .eq("job_id", id)
            .order("taken_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase
        .from("invoices")
        .select("id, invoice_number, status")
        .eq("job_id", id)
        .limit(1)
        .maybeSingle(),
      tenantId
        ? supabase
            .from("job_service_checks")
            .select(
              "id, service_label, is_completed, sort_order, job_service_subtask_checks(id, subtask_label, is_completed, sort_order)"
            )
            .eq("job_id", id)
            .order("sort_order")
        : Promise.resolve({ data: [] }),
    ]);

  if (!job) notFound();

  type CustomerShape = { name?: string; phone?: string | null; email?: string | null };
  const customer = (
    Array.isArray(job.customers) ? job.customers[0] : job.customers
  ) as CustomerShape | null;
  const assignedProfile = (
    Array.isArray(job.assigned_profile) ? job.assigned_profile[0] : job.assigned_profile
  ) as { full_name?: string } | null;

  // Generate signed URLs for all photos (1-hour expiry)
  const photos = await Promise.all(
    (photoRows ?? []).map(async (row) => {
      const { data: signed } = await supabase.storage
        .from("job-photos")
        .createSignedUrl(row.storage_path, 3600);
      return { ...row, url: signed?.signedUrl ?? "" };
    })
  );

  const canUpload =
    ["in_progress", "completed", "scheduled"].includes(job.status) &&
    ["owner", "admin", "technician"].includes(profile?.role ?? "");

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
          {customer?.phone && (
            <a href={`tel:${customer.phone}`}>
              <Button size="sm" variant="outline">
                📞 Call
              </Button>
            </a>
          )}
          {!linkedInvoice && (
            <Link href={`/invoices/create?customerId=${job.customer_id}&jobId=${id}`}>
              <Button size="sm">Create Invoice</Button>
            </Link>
          )}
          <Link href={`/jobs/${id}/edit`}>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </Link>
          <JobStatusActions jobId={id} status={job.status as JobStatus} />
        </div>
      </div>

      {/* Invoice hint — show when job is complete/in-progress but no invoice exists yet */}
      {job.status === "completed" && !linkedInvoice && (
        <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
          <span className="text-foreground">
            Job complete — <span className="text-muted-foreground">no invoice created yet.</span>
          </span>
          <Link
            href={`/invoices/create?customerId=${job.customer_id}&jobId=${id}`}
            className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90"
          >
            Create Invoice →
          </Link>
        </div>
      )}
      {linkedInvoice && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Invoice:</span>
          <Link href={`/invoices/${linkedInvoice.id}`} className="font-medium hover:underline">
            {linkedInvoice.invoice_number}
            <Badge variant={statusToBadgeVariant(linkedInvoice.status)} className="ml-2">
              {linkedInvoice.status}
            </Badge>
          </Link>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Customer:</span>{" "}
              <Link href={`/customers/${job.customer_id}`} className="hover:underline font-medium">
                {customer?.name}
              </Link>
            </p>
            {customer?.phone && (
              <p>
                <span className="text-muted-foreground">Phone:</span>{" "}
                <a
                  href={`tel:${customer.phone}`}
                  className="font-medium text-accent hover:underline"
                >
                  {customer.phone}
                </a>
              </p>
            )}
            {customer?.email && (
              <p>
                <span className="text-muted-foreground">Email:</span>{" "}
                <a href={`mailto:${customer.email}`} className="hover:underline truncate">
                  {customer.email}
                </a>
              </p>
            )}
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
                <span className="text-muted-foreground">Site:</span>{" "}
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(job.site_address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {job.site_address}
                </a>
              </p>
            )}
            {assignedProfile?.full_name && (
              <p>
                <span className="text-muted-foreground">Assigned to:</span>{" "}
                {assignedProfile.full_name}
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

      <Card>
        <CardHeader>
          <CardTitle>Service Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <JobServiceChecklist
            items={
              (checklistRows ?? []) as Array<{
                id: string;
                service_label: string;
                is_completed: boolean;
                sort_order: number;
                job_service_subtask_checks?: Array<{
                  id: string;
                  subtask_label: string;
                  is_completed: boolean;
                  sort_order: number;
                }>;
              }>
            }
          />
        </CardContent>
      </Card>

      {/* Photos section — always show when there are photos, show uploader if canUpload */}
      {(canUpload || photos.length > 0) && tenantId && (
        <Card>
          <CardHeader>
            <CardTitle>
              Photos
              {photos.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({photos.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <JobPhotoGallery
              jobId={id}
              tenantId={tenantId}
              initialPhotos={photos}
              canUpload={canUpload}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

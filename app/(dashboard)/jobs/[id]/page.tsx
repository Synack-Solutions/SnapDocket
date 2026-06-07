import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusToBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JobStatusActions } from "@/components/jobs/job-status-actions";
import { JobPhotoGallery } from "@/components/jobs/job-photo-gallery";
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

  const [{ data: job }, { data: photoRows }] = await Promise.all([
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
  ]);

  if (!job) notFound();

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
          {(job.customers as { phone?: string | null })?.phone && (
            <a href={`tel:${(job.customers as { phone: string }).phone}`}>
              <Button size="sm" variant="outline">
                📞 Call
              </Button>
            </a>
          )}
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
              <Link href={`/customers/${job.customer_id}`} className="hover:underline font-medium">
                {(job.customers as { name: string })?.name}
              </Link>
            </p>
            {(job.customers as { phone?: string | null })?.phone && (
              <p>
                <span className="text-muted-foreground">Phone:</span>{" "}
                <a
                  href={`tel:${(job.customers as { phone: string }).phone}`}
                  className="font-medium text-accent hover:underline"
                >
                  {(job.customers as { phone: string }).phone}
                </a>
              </p>
            )}
            {(job.customers as { email?: string | null })?.email && (
              <p>
                <span className="text-muted-foreground">Email:</span>{" "}
                <a
                  href={`mailto:${(job.customers as { email: string }).email}`}
                  className="hover:underline truncate"
                >
                  {(job.customers as { email: string }).email}
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

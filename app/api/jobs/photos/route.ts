import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

const MAX_FILE_MB = 10;

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const jobId = String(formData.get("jobId") ?? "");
  const tenantId = String(formData.get("tenantId") ?? "");
  const file = formData.get("file");

  if (!jobId || !tenantId || !(file instanceof File)) {
    return NextResponse.json({ error: "Invalid upload payload" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are allowed" }, { status: 400 });
  }

  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `File exceeds ${MAX_FILE_MB} MB` }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.tenant_id || profile.tenant_id !== tenantId) {
    return NextResponse.json({ error: "Tenant mismatch" }, { status: 403 });
  }

  const admin = createServiceRoleClient();
  const photoId = crypto.randomUUID();
  const storagePath = `${tenantId}/${jobId}/${photoId}.jpg`;

  const { error: uploadError } = await admin.storage
    .from("job-photos")
    .upload(storagePath, file, { contentType: "image/jpeg", upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data: photoRow, error: dbError } = await admin
    .from("job_photos")
    .insert({
      id: photoId,
      job_id: jobId,
      tenant_id: tenantId,
      uploaded_by: user.id,
      storage_path: storagePath,
      file_name: file.name,
    })
    .select("id, storage_path, file_name")
    .single();

  if (dbError || !photoRow) {
    return NextResponse.json(
      { error: dbError?.message ?? "Failed to save photo metadata" },
      { status: 400 }
    );
  }

  const { data: signed } = await admin.storage
    .from("job-photos")
    .createSignedUrl(storagePath, 3600);

  return NextResponse.json({
    photo: {
      id: photoRow.id,
      storage_path: photoRow.storage_path,
      file_name: photoRow.file_name,
      url: signed?.signedUrl ?? "",
    },
  });
}

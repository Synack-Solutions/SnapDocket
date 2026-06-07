-- Migration: 004_job_photos.sql

-- ─────────────────────────────────────────
-- JOB PHOTOS
-- Photos captured on-site during / after a job.
-- Stored in Supabase Storage bucket 'job-photos'.
-- Path convention: {tenant_id}/{job_id}/{photo_id}
-- ─────────────────────────────────────────
create table if not exists public.job_photos (
  id            uuid primary key default uuid_generate_v4(),
  job_id        uuid not null references public.jobs(id) on delete cascade,
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  uploaded_by   uuid references public.profiles(id) on delete set null,
  storage_path  text not null,           -- e.g. tenant_id/job_id/photo_id.jpg
  file_name     text not null,
  caption       text,
  taken_at      timestamptz default now(),
  created_at    timestamptz not null default now()
);

create index if not exists job_photos_job_idx    on public.job_photos(job_id);
create index if not exists job_photos_tenant_idx on public.job_photos(tenant_id);

alter table public.job_photos enable row level security;

create policy "job_photos_select" on public.job_photos
  for select using (tenant_id = public.current_tenant_id());

create policy "job_photos_insert" on public.job_photos
  for insert with check (tenant_id = public.current_tenant_id());

create policy "job_photos_delete" on public.job_photos
  for delete using (
    tenant_id = public.current_tenant_id()
    and (uploaded_by = auth.uid() or public.is_at_least_admin())
  );

comment on table public.job_photos is
  'On-site photos attached to a job. Blobs live in the job-photos storage bucket.';

-- ─────────────────────────────────────────
-- STORAGE BUCKET + POLICIES
-- Run via Supabase dashboard or supabase CLI:
--   supabase storage create job-photos
-- Then apply these policies in the SQL editor / migration.
-- ─────────────────────────────────────────

-- Storage bucket policies use storage.objects which is in the storage schema.
-- These statements are no-ops if the bucket doesn't exist yet — create it first
-- via the Supabase dashboard (Storage → New bucket → "job-photos", private).

do $$
begin
  -- Allow authenticated users to upload to their own tenant folder
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'job_photos_insert'
  ) then
    execute $pol$
      create policy "job_photos_insert" on storage.objects
        for insert to authenticated
        with check (
          bucket_id = 'job-photos'
          and (storage.foldername(name))[1] = (
            select tenant_id::text from public.profiles where id = auth.uid() limit 1
          )
        )
    $pol$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'job_photos_select'
  ) then
    execute $pol$
      create policy "job_photos_select" on storage.objects
        for select to authenticated
        using (
          bucket_id = 'job-photos'
          and (storage.foldername(name))[1] = (
            select tenant_id::text from public.profiles where id = auth.uid() limit 1
          )
        )
    $pol$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'job_photos_delete'
  ) then
    execute $pol$
      create policy "job_photos_delete" on storage.objects
        for delete to authenticated
        using (
          bucket_id = 'job-photos'
          and (storage.foldername(name))[1] = (
            select tenant_id::text from public.profiles where id = auth.uid() limit 1
          )
        )
    $pol$;
  end if;
end;
$$;

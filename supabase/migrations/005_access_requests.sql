-- Migration: 005_access_requests.sql

create table if not exists public.access_requests (
  id                  uuid primary key default uuid_generate_v4(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  email               text not null,
  full_name           text,
  phone               text,
  message             text,
  requested_role      text not null default 'technician'
                        check (requested_role in ('admin', 'technician', 'viewer')),
  status              text not null default 'pending'
                        check (status in ('pending', 'approved', 'rejected')),
  requested_at        timestamptz not null default now(),
  reviewed_at         timestamptz,
  reviewed_by         uuid references public.profiles(id) on delete set null,
  created_auth_user_id uuid references auth.users(id) on delete set null
);

create index if not exists access_requests_tenant_idx
  on public.access_requests(tenant_id, status, requested_at desc);

create unique index if not exists access_requests_pending_unique
  on public.access_requests(tenant_id, lower(email))
  where status = 'pending';

alter table public.access_requests enable row level security;

create policy "access_requests_select" on public.access_requests
  for select using (
    tenant_id = public.current_tenant_id()
    and public.is_at_least_admin()
  );

create policy "access_requests_update" on public.access_requests
  for update using (
    tenant_id = public.current_tenant_id()
    and public.is_at_least_admin()
  );

comment on table public.access_requests is
  'Inbound requests from login page; owners/admins can approve to invite user into auth.';

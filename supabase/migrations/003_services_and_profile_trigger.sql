-- Migration: 003_services_and_profile_trigger.sql

-- ─────────────────────────────────────────
-- AUTO-CREATE PROFILE + TENANT ON SIGN-UP
-- Fires after every insert into auth.users.
-- If raw_user_meta_data carries tenant_id + role the user is being
-- invited into an existing tenant. Otherwise a fresh trial tenant is
-- provisioned and the user becomes the owner.
-- ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_tenant_id uuid;
  v_role      text;
  v_name      text;
  v_slug      text;
begin
  v_tenant_id := (new.raw_user_meta_data->>'tenant_id')::uuid;
  v_role      := coalesce(new.raw_user_meta_data->>'role', 'owner');

  if v_tenant_id is null then
    -- New sign-up: provision a fresh trial tenant
    v_name := coalesce(
      new.raw_user_meta_data->>'company_name',
      split_part(new.email, '@', 1)
    );
    v_slug := lower(regexp_replace(v_name, '[^a-z0-9]+', '-', 'g'))
              || '-' || floor(extract(epoch from now()))::text;

    insert into public.tenants (name, slug, status)
    values (v_name, v_slug, 'trial')
    returning id into v_tenant_id;

    v_role := 'owner';
  end if;

  insert into public.profiles (id, tenant_id, email, full_name, role)
  values (
    new.id,
    v_tenant_id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Drop trigger first in case migration is re-run locally
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- SERVICES catalogue (first-class table)
-- Replaces tenants.settings.services[] JSONB blob.
-- ─────────────────────────────────────────
create table if not exists public.services (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  label       text not null,
  description text,
  unit_price  numeric(12,2) not null default 0,
  category    text not null default 'core'
                check (category in ('core', 'addon')),
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists services_tenant_idx on public.services(tenant_id);

alter table public.services enable row level security;

create policy "services_select" on public.services
  for select using (tenant_id = public.current_tenant_id());

create policy "services_insert" on public.services
  for insert with check (
    tenant_id = public.current_tenant_id() and public.is_at_least_admin()
  );

create policy "services_update" on public.services
  for update using (
    tenant_id = public.current_tenant_id() and public.is_at_least_admin()
  );

create policy "services_delete" on public.services
  for delete using (
    tenant_id = public.current_tenant_id() and public.is_at_least_admin()
  );

comment on table public.services is 'Per-tenant service catalogue; feeds Quick Job and invoice line items.';

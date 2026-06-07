-- Migration: 001_init.sql
-- Core domain tables for SnapDocket

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- TENANTS (white-label organisations)
-- ─────────────────────────────────────────
create table public.tenants (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  status      text not null default 'trial' check (status in ('active', 'suspended', 'trial')),
  branding    jsonb,           -- TenantBranding JSON
  settings    jsonb,           -- TenantSettings JSON
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.tenants is 'Top-level white-label tenant organisations';

-- ─────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'technician'
                check (role in ('owner', 'admin', 'technician', 'viewer')),
  avatar_url  text,
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index profiles_tenant_idx on public.profiles(tenant_id);

-- ─────────────────────────────────────────
-- CUSTOMERS
-- ─────────────────────────────────────────
create table public.customers (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  name          text not null,
  email         text,
  phone         text,
  address_line1 text,
  address_line2 text,
  city          text,
  state         text,
  postcode      text,
  country       text not null default 'AU',
  status        text not null default 'active'
                  check (status in ('active', 'inactive', 'prospect')),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index customers_tenant_idx on public.customers(tenant_id);
create index customers_email_idx on public.customers(tenant_id, email);

-- ─────────────────────────────────────────
-- JOBS
-- ─────────────────────────────────────────
create table public.jobs (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  customer_id   uuid not null references public.customers(id) on delete restrict,
  assigned_to   uuid references public.profiles(id) on delete set null,
  title         text not null,
  description   text,
  status        text not null default 'pending'
                  check (status in ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  priority      text not null default 'medium'
                  check (priority in ('low', 'medium', 'high', 'urgent')),
  scheduled_at  timestamptz,
  started_at    timestamptz,
  completed_at  timestamptz,
  site_address  text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index jobs_tenant_idx on public.jobs(tenant_id);
create index jobs_customer_idx on public.jobs(customer_id);
create index jobs_assigned_idx on public.jobs(assigned_to);
create index jobs_status_idx on public.jobs(tenant_id, status);

-- ─────────────────────────────────────────
-- INVOICES
-- ─────────────────────────────────────────
create table public.invoices (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  customer_id     uuid not null references public.customers(id) on delete restrict,
  job_id          uuid references public.jobs(id) on delete set null,
  invoice_number  text not null,
  status          text not null default 'draft'
                    check (status in ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'void')),
  issued_date     date not null default current_date,
  due_date        date not null,
  subtotal        numeric(12,2) not null default 0,
  tax_rate        numeric(5,2) not null default 0,
  tax_amount      numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total           numeric(12,2) not null default 0,
  amount_paid     numeric(12,2) not null default 0,
  amount_due      numeric(12,2) generated always as (total - amount_paid) stored,
  notes           text,
  terms           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, invoice_number)
);

create index invoices_tenant_idx on public.invoices(tenant_id);
create index invoices_customer_idx on public.invoices(customer_id);
create index invoices_status_idx on public.invoices(tenant_id, status);
create index invoices_due_idx on public.invoices(due_date) where status not in ('paid', 'void');

-- ─────────────────────────────────────────
-- INVOICE ITEMS
-- ─────────────────────────────────────────
create table public.invoice_items (
  id          uuid primary key default uuid_generate_v4(),
  invoice_id  uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity    numeric(10,2) not null default 1,
  unit_price  numeric(12,2) not null,
  tax_rate    numeric(5,2) not null default 0,
  total       numeric(12,2) generated always as (quantity * unit_price) stored,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index invoice_items_invoice_idx on public.invoice_items(invoice_id);

-- ─────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────
create table public.payments (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  invoice_id  uuid not null references public.invoices(id) on delete restrict,
  amount      numeric(12,2) not null,
  method      text not null default 'cash'
                check (method in ('cash', 'card', 'bank_transfer', 'cheque', 'other')),
  status      text not null default 'completed'
                check (status in ('pending', 'completed', 'failed', 'refunded')),
  reference   text,
  paid_at     timestamptz default now(),
  notes       text,
  created_at  timestamptz not null default now()
);

create index payments_tenant_idx on public.payments(tenant_id);
create index payments_invoice_idx on public.payments(invoice_id);

-- ─────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────
create table public.audit_logs (
  id            uuid not null default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete set null,
  resource_type text not null,
  resource_id   uuid,
  action        text not null
                  check (action in ('create', 'update', 'delete', 'login', 'logout', 'view', 'export', 'send')),
  changes       jsonb,
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz not null default now(),
  primary key (id, created_at)
) partition by range (created_at);

-- Default partition — add monthly partitions as needed
create table public.audit_logs_default partition of public.audit_logs default;

create index audit_logs_tenant_idx on public.audit_logs(tenant_id, created_at desc);
create index audit_logs_user_idx on public.audit_logs(user_id, created_at desc);
create index audit_logs_resource_idx on public.audit_logs(resource_type, resource_id);

-- ─────────────────────────────────────────
-- UPDATED_AT trigger helper
-- ─────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_updated_at    before update on public.tenants    for each row execute function public.set_updated_at();
create trigger profiles_updated_at   before update on public.profiles   for each row execute function public.set_updated_at();
create trigger customers_updated_at  before update on public.customers  for each row execute function public.set_updated_at();
create trigger jobs_updated_at       before update on public.jobs       for each row execute function public.set_updated_at();
create trigger invoices_updated_at   before update on public.invoices   for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────
-- Auto-create profile on user sign-up
-- ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _tenant_id uuid;
begin
  -- If tenant_id metadata was passed during sign-up, use it; otherwise create a new tenant
  _tenant_id := (new.raw_user_meta_data->>'tenant_id')::uuid;

  if _tenant_id is null then
    insert into public.tenants (name, slug)
    values (
      coalesce(new.raw_user_meta_data->>'company_name', split_part(new.email, '@', 2)),
      lower(regexp_replace(coalesce(new.raw_user_meta_data->>'company_name', split_part(new.email, '@', 1)), '[^a-z0-9]', '-', 'g'))
    )
    returning id into _tenant_id;
  end if;

  insert into public.profiles (id, tenant_id, email, full_name, role)
  values (
    new.id,
    _tenant_id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'owner')
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

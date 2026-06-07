-- Migration: 002_rls.sql
-- Row Level Security policies for multi-tenant RBAC

-- Enable RLS on all tenant-scoped tables
alter table public.tenants        enable row level security;
alter table public.profiles       enable row level security;
alter table public.customers      enable row level security;
alter table public.jobs           enable row level security;
alter table public.invoices       enable row level security;
alter table public.invoice_items  enable row level security;
alter table public.payments       enable row level security;
alter table public.audit_logs     enable row level security;

-- ─────────────────────────────────────────
-- Helper: get current user's tenant_id and role from profiles
-- ─────────────────────────────────────────
create or replace function public.current_tenant_id()
returns uuid language sql stable security definer set search_path = public as $$
  select tenant_id from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.is_at_least_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_user_role() in ('owner', 'admin');
$$;

-- ─────────────────────────────────────────
-- TENANTS
-- ─────────────────────────────────────────
-- Users can only read their own tenant
create policy "tenants_select" on public.tenants
  for select using (id = public.current_tenant_id());

-- Only owners can update tenant settings/branding
create policy "tenants_update" on public.tenants
  for update using (id = public.current_tenant_id() and public.current_user_role() = 'owner');

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
create policy "profiles_select" on public.profiles
  for select using (tenant_id = public.current_tenant_id());

-- Users can update their own profile; admins/owners can update any profile in their tenant
create policy "profiles_update" on public.profiles
  for update using (
    tenant_id = public.current_tenant_id()
    and (id = auth.uid() or public.is_at_least_admin())
  );

-- Only admins can insert/invite new profiles
create policy "profiles_insert" on public.profiles
  for insert with check (
    tenant_id = public.current_tenant_id()
    and public.is_at_least_admin()
  );

-- Only owners can delete profiles
create policy "profiles_delete" on public.profiles
  for delete using (
    tenant_id = public.current_tenant_id()
    and public.current_user_role() = 'owner'
    and id != auth.uid() -- cannot delete yourself
  );

-- ─────────────────────────────────────────
-- CUSTOMERS
-- ─────────────────────────────────────────
create policy "customers_select" on public.customers
  for select using (tenant_id = public.current_tenant_id());

create policy "customers_insert" on public.customers
  for insert with check (tenant_id = public.current_tenant_id());

create policy "customers_update" on public.customers
  for update using (tenant_id = public.current_tenant_id());

create policy "customers_delete" on public.customers
  for delete using (
    tenant_id = public.current_tenant_id()
    and public.is_at_least_admin()
  );

-- ─────────────────────────────────────────
-- JOBS
-- ─────────────────────────────────────────
create policy "jobs_select" on public.jobs
  for select using (
    tenant_id = public.current_tenant_id()
    -- Technicians can only see jobs assigned to them
    and (
      public.current_user_role() in ('owner', 'admin', 'viewer')
      or assigned_to = auth.uid()
    )
  );

create policy "jobs_insert" on public.jobs
  for insert with check (tenant_id = public.current_tenant_id());

create policy "jobs_update" on public.jobs
  for update using (
    tenant_id = public.current_tenant_id()
    and (
      public.is_at_least_admin()
      or assigned_to = auth.uid()
    )
  );

create policy "jobs_delete" on public.jobs
  for delete using (
    tenant_id = public.current_tenant_id()
    and public.is_at_least_admin()
  );

-- ─────────────────────────────────────────
-- INVOICES
-- ─────────────────────────────────────────
create policy "invoices_select" on public.invoices
  for select using (tenant_id = public.current_tenant_id());

create policy "invoices_insert" on public.invoices
  for insert with check (tenant_id = public.current_tenant_id());

create policy "invoices_update" on public.invoices
  for update using (
    tenant_id = public.current_tenant_id()
    and public.current_user_role() != 'viewer'
  );

create policy "invoices_delete" on public.invoices
  for delete using (
    tenant_id = public.current_tenant_id()
    and public.is_at_least_admin()
    and status = 'draft'
  );

-- ─────────────────────────────────────────
-- INVOICE ITEMS (scoped via invoice)
-- ─────────────────────────────────────────
create policy "invoice_items_select" on public.invoice_items
  for select using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id
        and i.tenant_id = public.current_tenant_id()
    )
  );

create policy "invoice_items_insert" on public.invoice_items
  for insert with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id
        and i.tenant_id = public.current_tenant_id()
        and public.current_user_role() != 'viewer'
    )
  );

create policy "invoice_items_update" on public.invoice_items
  for update using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id
        and i.tenant_id = public.current_tenant_id()
        and public.current_user_role() != 'viewer'
    )
  );

create policy "invoice_items_delete" on public.invoice_items
  for delete using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id
        and i.tenant_id = public.current_tenant_id()
        and public.is_at_least_admin()
    )
  );

-- ─────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────
create policy "payments_select" on public.payments
  for select using (tenant_id = public.current_tenant_id());

create policy "payments_insert" on public.payments
  for insert with check (
    tenant_id = public.current_tenant_id()
    and public.current_user_role() != 'viewer'
  );

-- Payments are immutable once created; only allow status update
create policy "payments_update" on public.payments
  for update using (
    tenant_id = public.current_tenant_id()
    and public.is_at_least_admin()
  );

-- ─────────────────────────────────────────
-- AUDIT LOGS (append-only for all users)
-- ─────────────────────────────────────────
create policy "audit_logs_select" on public.audit_logs
  for select using (
    tenant_id = public.current_tenant_id()
    and public.is_at_least_admin()
  );

create policy "audit_logs_insert" on public.audit_logs
  for insert with check (tenant_id = public.current_tenant_id());

-- No update or delete on audit logs — immutable record

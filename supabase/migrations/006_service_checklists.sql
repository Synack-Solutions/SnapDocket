-- Migration: 006_service_checklists.sql

-- Service-level default subtasks
create table if not exists public.service_subtasks (
  id          uuid primary key default uuid_generate_v4(),
  service_id  uuid not null references public.services(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  label       text not null,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists service_subtasks_service_idx on public.service_subtasks(service_id, sort_order);
create index if not exists service_subtasks_tenant_idx on public.service_subtasks(tenant_id);

alter table public.service_subtasks enable row level security;

create policy "service_subtasks_select" on public.service_subtasks
  for select using (tenant_id = public.current_tenant_id());

create policy "service_subtasks_insert" on public.service_subtasks
  for insert with check (
    tenant_id = public.current_tenant_id()
    and public.is_at_least_admin()
  );

create policy "service_subtasks_update" on public.service_subtasks
  for update using (
    tenant_id = public.current_tenant_id()
    and public.is_at_least_admin()
  );

create policy "service_subtasks_delete" on public.service_subtasks
  for delete using (
    tenant_id = public.current_tenant_id()
    and public.is_at_least_admin()
  );

-- Job checklist rows (one per selected service)
create table if not exists public.job_service_checks (
  id            uuid primary key default uuid_generate_v4(),
  job_id         uuid not null references public.jobs(id) on delete cascade,
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  service_id     uuid references public.services(id) on delete set null,
  service_label  text not null,
  sort_order     int not null default 0,
  is_completed   boolean not null default false,
  completed_at   timestamptz,
  completed_by   uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);

create index if not exists job_service_checks_job_idx on public.job_service_checks(job_id, sort_order);
create index if not exists job_service_checks_tenant_idx on public.job_service_checks(tenant_id);

alter table public.job_service_checks enable row level security;

create policy "job_service_checks_select" on public.job_service_checks
  for select using (tenant_id = public.current_tenant_id());

create policy "job_service_checks_insert" on public.job_service_checks
  for insert with check (tenant_id = public.current_tenant_id());

create policy "job_service_checks_update" on public.job_service_checks
  for update using (
    tenant_id = public.current_tenant_id()
    and public.current_user_role() != 'viewer'
  );

create policy "job_service_checks_delete" on public.job_service_checks
  for delete using (
    tenant_id = public.current_tenant_id()
    and public.is_at_least_admin()
  );

-- Job checklist subtasks
create table if not exists public.job_service_subtask_checks (
  id                     uuid primary key default uuid_generate_v4(),
  job_service_check_id   uuid not null references public.job_service_checks(id) on delete cascade,
  tenant_id              uuid not null references public.tenants(id) on delete cascade,
  service_subtask_id     uuid references public.service_subtasks(id) on delete set null,
  subtask_label          text not null,
  sort_order             int not null default 0,
  is_completed           boolean not null default false,
  completed_at           timestamptz,
  completed_by           uuid references public.profiles(id) on delete set null,
  created_at             timestamptz not null default now()
);

create index if not exists job_service_subtasks_parent_idx
  on public.job_service_subtask_checks(job_service_check_id, sort_order);
create index if not exists job_service_subtasks_tenant_idx
  on public.job_service_subtask_checks(tenant_id);

alter table public.job_service_subtask_checks enable row level security;

create policy "job_service_subtasks_select" on public.job_service_subtask_checks
  for select using (tenant_id = public.current_tenant_id());

create policy "job_service_subtasks_insert" on public.job_service_subtask_checks
  for insert with check (tenant_id = public.current_tenant_id());

create policy "job_service_subtasks_update" on public.job_service_subtask_checks
  for update using (
    tenant_id = public.current_tenant_id()
    and public.current_user_role() != 'viewer'
  );

create policy "job_service_subtasks_delete" on public.job_service_subtask_checks
  for delete using (
    tenant_id = public.current_tenant_id()
    and public.is_at_least_admin()
  );

comment on table public.service_subtasks is 'Default subtasks configured on a service template.';
comment on table public.job_service_checks is 'Per-job checklist items derived from selected services.';
comment on table public.job_service_subtask_checks is 'Per-job completion subtasks derived from service defaults.';

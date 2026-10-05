-- Supabase schema for School Employee Evidence Portal
-- Run once in Supabase SQL Editor before using the app.

create extension if not exists pgcrypto;

create table if not exists public.employees (
  id text primary key,
  civil_id text not null unique,
  password text not null,
  full_name text not null,
  role text not null check (role in ('admin','employee')),
  form_type text,
  job_title text,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.evidence (
  id text primary key,
  employee_id text not null references public.employees(id) on delete cascade,
  criterion_id text not null,
  file_name text not null,
  file_type text not null check (file_type in ('pdf','image')),
  file_size bigint not null default 0,
  file_url text not null,
  storage_path text,
  description text,
  uploaded_at timestamptz not null default now()
);
create index if not exists evidence_employee_idx on public.evidence(employee_id);
create index if not exists evidence_employee_criterion_idx on public.evidence(employee_id, criterion_id);

create table if not exists public.evaluations (
  id text primary key,
  employee_id text not null references public.employees(id) on delete cascade,
  period text not null check (period in ('midyear','final')),
  status text not null default 'draft' check (status in ('draft','submitted','approved')),
  general_notes text not null default '',
  total_score numeric(7,2) not null default 0,
  rating_label text not null default '',
  scores jsonb not null default '[]'::jsonb,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, period)
);
create index if not exists evaluations_employee_idx on public.evaluations(employee_id);

create table if not exists public.school_settings (
  id text primary key default 'default',
  school_name text not null default '',
  education_department text,
  school_year text,
  updated_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('employee-evidence', 'employee-evidence', true, 10485760, array['application/pdf','image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- This app currently uses its own employee login instead of Supabase Auth.
-- These policies therefore allow the anon client to access app data.
-- For a production public deployment, migrate login to Supabase Auth and tighten these policies per user/role.
alter table public.employees enable row level security;
alter table public.evidence enable row level security;
alter table public.evaluations enable row level security;
alter table public.school_settings enable row level security;

do $$ begin
  create policy "app employees access" on public.employees for all to anon, authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "app evidence access" on public.evidence for all to anon, authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "app evaluations access" on public.evaluations for all to anon, authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "app school settings access" on public.school_settings for all to anon, authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "employee evidence storage read" on storage.objects for select to anon, authenticated using (bucket_id = 'employee-evidence');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "employee evidence storage insert" on storage.objects for insert to anon, authenticated with check (bucket_id = 'employee-evidence');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "employee evidence storage update" on storage.objects for update to anon, authenticated using (bucket_id = 'employee-evidence') with check (bucket_id = 'employee-evidence');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "employee evidence storage delete" on storage.objects for delete to anon, authenticated using (bucket_id = 'employee-evidence');
exception when duplicate_object then null; end $$;

insert into public.employees (id, civil_id, password, full_name, role, must_change_password)
values ('admin-default', 'admin', 'admin123', 'مدير المدرسة', 'admin', false)
on conflict (civil_id) do nothing;

insert into public.school_settings (id, school_name)
values ('default', '')
on conflict (id) do nothing;

-- PresseSjekk v1 database schema
-- Enkel første versjon for innlogging, Min Side og lagrede saker

create extension if not exists "pgcrypto";

-- Oppdaterer updated_at automatisk
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. Brukerprofiler
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user', 'pro', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Opprett profil automatisk når ny bruker registreres
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- 2. Saker
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null default 'Ny PresseSjekk-sak',
  status text not null default 'draft' check (
    status in ('draft', 'in_progress', 'report_ready', 'closed')
  ),

  media_name text,
  article_url text,
  article_title text,
  published_date date,

  short_description text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cases_user_id_idx on public.cases(user_id);
create index if not exists cases_status_idx on public.cases(status);
create index if not exists cases_created_at_idx on public.cases(created_at desc);

create trigger cases_set_updated_at
before update on public.cases
for each row
execute function public.set_updated_at();

-- 3. Innhold brukeren legger inn
create table if not exists public.case_inputs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references public.cases(id) on delete cascade,

  article_text text,
  what_happened text,
  your_role text,

  reply_sent boolean default false,
  reply_text text,
  editor_response text,

  legal_status text,
  legal_status_details text,

  documentation_summary text,
  desired_outcome text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists case_inputs_case_id_idx on public.case_inputs(case_id);

create trigger case_inputs_set_updated_at
before update on public.case_inputs
for each row
execute function public.set_updated_at();

-- 4. Rapporter og rapportversjoner
create table if not exists public.case_reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,

  version integer not null default 1,
  report_type text not null default 'free_check' check (
    report_type in ('free_check', 'full_report', 'pfu_draft')
  ),

  summary text,
  findings jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  pfu_draft text,

  status text not null default 'draft' check (
    status in ('draft', 'ready', 'archived')
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(case_id, version)
);

create index if not exists case_reports_case_id_idx on public.case_reports(case_id);
create index if not exists case_reports_created_at_idx on public.case_reports(created_at desc);

create trigger case_reports_set_updated_at
before update on public.case_reports
for each row
execute function public.set_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.case_inputs enable row level security;
alter table public.case_reports enable row level security;

-- RLS: profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- RLS: cases
drop policy if exists "Users can view own cases" on public.cases;
create policy "Users can view own cases"
on public.cases
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can create own cases" on public.cases;
create policy "Users can create own cases"
on public.cases
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own cases" on public.cases;
create policy "Users can update own cases"
on public.cases
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own cases" on public.cases;
create policy "Users can delete own cases"
on public.cases
for delete
to authenticated
using (user_id = auth.uid());

-- RLS: case_inputs
drop policy if exists "Users can view inputs for own cases" on public.case_inputs;
create policy "Users can view inputs for own cases"
on public.case_inputs
for select
to authenticated
using (
  exists (
    select 1 from public.cases
    where cases.id = case_inputs.case_id
    and cases.user_id = auth.uid()
  )
);

drop policy if exists "Users can create inputs for own cases" on public.case_inputs;
create policy "Users can create inputs for own cases"
on public.case_inputs
for insert
to authenticated
with check (
  exists (
    select 1 from public.cases
    where cases.id = case_inputs.case_id
    and cases.user_id = auth.uid()
  )
);

drop policy if exists "Users can update inputs for own cases" on public.case_inputs;
create policy "Users can update inputs for own cases"
on public.case_inputs
for update
to authenticated
using (
  exists (
    select 1 from public.cases
    where cases.id = case_inputs.case_id
    and cases.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.cases
    where cases.id = case_inputs.case_id
    and cases.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete inputs for own cases" on public.case_inputs;
create policy "Users can delete inputs for own cases"
on public.case_inputs
for delete
to authenticated
using (
  exists (
    select 1 from public.cases
    where cases.id = case_inputs.case_id
    and cases.user_id = auth.uid()
  )
);

-- RLS: case_reports
drop policy if exists "Users can view reports for own cases" on public.case_reports;
create policy "Users can view reports for own cases"
on public.case_reports
for select
to authenticated
using (
  exists (
    select 1 from public.cases
    where cases.id = case_reports.case_id
    and cases.user_id = auth.uid()
  )
);

drop policy if exists "Users can create reports for own cases" on public.case_reports;
create policy "Users can create reports for own cases"
on public.case_reports
for insert
to authenticated
with check (
  exists (
    select 1 from public.cases
    where cases.id = case_reports.case_id
    and cases.user_id = auth.uid()
  )
);

drop policy if exists "Users can update reports for own cases" on public.case_reports;
create policy "Users can update reports for own cases"
on public.case_reports
for update
to authenticated
using (
  exists (
    select 1 from public.cases
    where cases.id = case_reports.case_id
    and cases.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.cases
    where cases.id = case_reports.case_id
    and cases.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete reports for own cases" on public.case_reports;
create policy "Users can delete reports for own cases"
on public.case_reports
for delete
to authenticated
using (
  exists (
    select 1 from public.cases
    where cases.id = case_reports.case_id
    and cases.user_id = auth.uid()
  )
);

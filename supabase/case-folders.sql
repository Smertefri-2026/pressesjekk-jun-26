-- PresseSjekk case folders / saksmapper

create table if not exists public.case_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  folder_type text default 'media_case',
  client_name text,
  organization_name text,
  description text,
  status text default 'active',

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint case_folders_status_check
    check (status in ('active', 'archived', 'closed')),

  constraint case_folders_folder_type_check
    check (
      folder_type in (
        'media_case',
        'client_case',
        'publication_case',
        'organization_case'
      )
    )
);

alter table public.cases
add column if not exists folder_id uuid references public.case_folders(id) on delete set null;

create index if not exists case_folders_user_id_idx
on public.case_folders(user_id);

create index if not exists cases_folder_id_idx
on public.cases(folder_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.case_folders to authenticated;

alter table public.case_folders enable row level security;

drop policy if exists "Users can read own case folders" on public.case_folders;
create policy "Users can read own case folders"
on public.case_folders
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own case folders" on public.case_folders;
create policy "Users can insert own case folders"
on public.case_folders
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own case folders" on public.case_folders;
create policy "Users can update own case folders"
on public.case_folders
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own case folders" on public.case_folders;
create policy "Users can delete own case folders"
on public.case_folders
for delete
to authenticated
using (user_id = auth.uid());

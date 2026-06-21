-- PresseSjekk nested folders and trash support

alter table public.case_folders
add column if not exists parent_folder_id uuid references public.case_folders(id) on delete set null;

alter table public.case_folders
add column if not exists deleted_at timestamptz;

alter table public.cases
add column if not exists deleted_at timestamptz;

create index if not exists case_folders_parent_folder_id_idx
on public.case_folders(parent_folder_id);

create index if not exists case_folders_deleted_at_idx
on public.case_folders(deleted_at);

create index if not exists cases_deleted_at_idx
on public.cases(deleted_at);

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'case_folders'
      and constraint_name = 'case_folders_status_check'
  ) then
    alter table public.case_folders
    drop constraint case_folders_status_check;
  end if;
end $$;

alter table public.case_folders
add constraint case_folders_status_check
check (status in ('active', 'archived', 'closed', 'trashed'));

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'case_folders'
      and constraint_name = 'case_folders_no_self_parent_check'
  ) then
    alter table public.case_folders
    add constraint case_folders_no_self_parent_check
    check (parent_folder_id is null or parent_folder_id <> id);
  end if;
end $$;

-- PresseSjekk PFU decisions and file upload support

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'case-documents',
  'case-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ];

create table if not exists public.pfu_decisions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  pfu_complaint_sent boolean default false,
  pfu_sent_date date,
  pfu_case_number text,
  pfu_case_url text,

  decision_received boolean default false,
  decision_date date,
  decision_result text,
  decision_summary text,
  decision_text text,

  uploaded_file_path text,
  uploaded_file_name text,
  uploaded_file_type text,

  next_step_interest text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(case_id)
);

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.pfu_decisions to authenticated;

alter table public.pfu_decisions enable row level security;

drop policy if exists "Users can read own PFU decisions" on public.pfu_decisions;
create policy "Users can read own PFU decisions"
on public.pfu_decisions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own PFU decisions" on public.pfu_decisions;
create policy "Users can insert own PFU decisions"
on public.pfu_decisions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.cases
    where cases.id = pfu_decisions.case_id
    and cases.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own PFU decisions" on public.pfu_decisions;
create policy "Users can update own PFU decisions"
on public.pfu_decisions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own PFU decisions" on public.pfu_decisions;
create policy "Users can delete own PFU decisions"
on public.pfu_decisions
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can upload own case documents" on storage.objects;
create policy "Users can upload own case documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'case-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can read own case documents" on storage.objects;
create policy "Users can read own case documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'case-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own case documents" on storage.objects;
create policy "Users can update own case documents"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'case-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'case-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own case documents" on storage.objects;
create policy "Users can delete own case documents"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'case-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

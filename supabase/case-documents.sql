create table if not exists public.case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  document_type text not null default 'other',
  description text,

  file_name text not null,
  file_path text not null,
  file_size bigint,
  mime_type text,

  created_at timestamptz not null default now(),

  constraint case_documents_document_type_check
    check (
      document_type in (
        'article',
        'journalist_email',
        'reply_sent',
        'editor_response',
        'pfu_document',
        'legal_document',
        'other'
      )
    )
);

create index if not exists case_documents_case_id_idx
  on public.case_documents(case_id);

create index if not exists case_documents_user_id_idx
  on public.case_documents(user_id);

alter table public.case_documents enable row level security;

drop policy if exists "Users can read own case documents" on public.case_documents;
create policy "Users can read own case documents"
  on public.case_documents
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own case documents" on public.case_documents;
create policy "Users can insert own case documents"
  on public.case_documents
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own case documents" on public.case_documents;
create policy "Users can update own case documents"
  on public.case_documents
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own case documents" on public.case_documents;
create policy "Users can delete own case documents"
  on public.case_documents
  for delete
  using (auth.uid() = user_id);

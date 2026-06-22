alter table public.case_documents
add column if not exists deleted_at timestamptz;

create index if not exists case_documents_deleted_at_idx
  on public.case_documents(deleted_at);

create index if not exists case_documents_case_active_idx
  on public.case_documents(case_id, deleted_at);

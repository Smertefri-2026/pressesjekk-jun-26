alter table public.case_documents
  add column if not exists extracted_text text,
  add column if not exists extraction_status text not null default 'pending',
  add column if not exists extraction_error text,
  add column if not exists extracted_at timestamptz,
  add column if not exists page_count integer;

alter table public.case_documents
  drop constraint if exists case_documents_extraction_status_check;

alter table public.case_documents
  add constraint case_documents_extraction_status_check
  check (
    extraction_status in (
      'pending',
      'processing',
      'completed',
      'failed',
      'unsupported'
    )
  );

create index if not exists case_documents_extraction_status_idx
  on public.case_documents(extraction_status);

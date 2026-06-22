insert into storage.buckets (id, name, public)
values ('case-documents', 'case-documents', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload own case documents" on storage.objects;
create policy "Users can upload own case documents"
  on storage.objects
  for insert
  with check (
    bucket_id = 'case-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can read own case documents" on storage.objects;
create policy "Users can read own case documents"
  on storage.objects
  for select
  using (
    bucket_id = 'case-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update own case documents" on storage.objects;
create policy "Users can update own case documents"
  on storage.objects
  for update
  using (
    bucket_id = 'case-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'case-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own case documents" on storage.objects;
create policy "Users can delete own case documents"
  on storage.objects
  for delete
  using (
    bucket_id = 'case-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

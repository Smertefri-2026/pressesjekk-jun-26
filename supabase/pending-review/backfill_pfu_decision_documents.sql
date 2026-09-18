-- IKKE KJØRT ENNÅ - venter på eksplisitt godkjenning (se rapport).
--
-- Bakgrunn: før dette arbeidet skrev PFU-avgjørelse-siden opplastede filer
-- direkte til pfu_decisions.uploaded_file_path/uploaded_file_name/uploaded_file_type
-- i stedet for case_documents. Appen skriver ikke lenger dit (ny opplasting
-- går via CaseAttachmentPanel -> case_documents), men eksisterende rader i
-- pfu_decisions kan fortsatt ha en fil registrert kun der.
--
-- Denne migrasjonen kopierer (ikke flytter) referansen inn i case_documents,
-- slik at PFU-avgjørelsesfiler dukker opp i det vanlige vedleggspanelet på
-- linje med alt annet i saken.
--
-- Sikkerhet / idempotens:
-- - Ren INSERT ... SELECT. Rører ALDRI pfu_decisions eller Storage-objekter.
-- - "where not exists (... file_path ...)" gjør den trygg å kjøre flere
--   ganger uten å lage duplikater.
-- - Ingen DELETE, ingen UPDATE av eksisterende data, ingen sletting av filer.
--   Verste utfall ved en feil er en duplisert rad, ikke tap av data.
--
-- Anbefalt fremgangsmåte før kjøring mot live Supabase:
--   1. Kjør SELECT-varianten nedenfor (kommentert ut) for å se hvor mange
--      rader som faktisk vil bli satt inn, og se over resultatet.
--   2. Ta en Supabase-backup/snapshot (rutine, men gjør det).
--   3. Kjør selve INSERT-en.
--
-- select pd.id, pd.case_id, pd.user_id, pd.uploaded_file_name, pd.uploaded_file_path
-- from public.pfu_decisions pd
-- where pd.uploaded_file_path is not null
--   and not exists (
--     select 1 from public.case_documents cd
--     where cd.file_path = pd.uploaded_file_path
--   );

insert into public.case_documents (
  case_id,
  user_id,
  title,
  document_type,
  description,
  file_name,
  file_path,
  file_size,
  mime_type
)
select
  pd.case_id,
  pd.user_id,
  coalesce(nullif(pd.uploaded_file_name, ''), 'PFU-avgjørelse'),
  'pfu_document',
  'Automatisk overført fra pfu_decisions ved innføring av samlet vedleggspanel.',
  coalesce(nullif(pd.uploaded_file_name, ''), 'pfu-avgjorelse'),
  pd.uploaded_file_path,
  null,
  pd.uploaded_file_type
from public.pfu_decisions pd
where pd.uploaded_file_path is not null
  and not exists (
    select 1 from public.case_documents cd
    where cd.file_path = pd.uploaded_file_path
  );

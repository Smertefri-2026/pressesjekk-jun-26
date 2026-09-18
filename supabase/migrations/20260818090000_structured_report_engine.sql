-- Remøy AI Evidence Engine — fase 4: strukturert rapportgenerator
--
-- Additivt over case_reports (eksisterende, ikke-sporet base-tabell). Ingen
-- eksisterende rader eller kolonner røres eller migreres bort - gamle
-- rapporter (report_kind IS NULL) fortsetter å vises og lastes ned som før.
--
-- Nye kolonner:
--   sections     jsonb  -- typet array av rapportseksjoner (se src/lib/report/types.ts).
--                           Struktur og fakta kommer fra kode/Evidence Engine-data,
--                           ikke fra fri KI-tekst - se ReportSection-typen.
--   built_from   jsonb  -- liten snapshot/referanse: hvilken Evidence Engine-tilstand
--                           (antall claims/gaps/vitner, siste case_summary-id, dokument-
--                           nummerering brukt i denne rapportversjonen, tidspunkt) rapporten
--                           ble bygget fra - slik at en eldre rapportversjon senere kan
--                           forklares, uten å lagre en full datadump.
--   report_kind  text   -- 'structured' for nye rapporter bygget av fase 4-motoren.
--                           NULL for alle eksisterende rader (behandles som "legacy" av
--                           både UI og PDF-generatoren).
--
-- GRANT-fix: case_reports har aldri hatt et eksplisitt GRANT for authenticated
-- eller service_role (kun en admin-SELECT-RLS-policy fra 20260813120000).
-- Samme brist-klasse som ble funnet og fikset for profiles i samme migrasjon,
-- og som fase 1/2A måtte rettes for i etterkant - rettes her fra start.

alter table public.case_reports
add column if not exists sections jsonb;

alter table public.case_reports
add column if not exists built_from jsonb;

alter table public.case_reports
add column if not exists report_kind text;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.case_reports to authenticated;
grant select, insert, update, delete on public.case_reports to service_role;

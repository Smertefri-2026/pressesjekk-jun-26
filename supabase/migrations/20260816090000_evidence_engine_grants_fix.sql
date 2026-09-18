-- Remøy AI Evidence Engine — retting: manglende GRANT-setninger
--
-- Oppdaget under verifisering: fase 1- og fase 2A-migrasjonene opprettet
-- riktige RLS-policyer, men manglet de eksplisitte GRANT-setningene til
-- "authenticated" (og "service_role") som resten av prosjektet konsekvent
-- bruker i egne *-grants.sql-filer (se case-documents-grants.sql,
-- api-grants-v1.sql). RLS-policyer alene er ikke nok i dette prosjektet -
-- uten grunnleggende GRANT nektes tilgang før RLS i det hele tatt vurderes.
-- Bekreftet i praksis: "permission denied for table claims" osv. mot en
-- ekte innlogget testbruker før denne filen.
--
-- Rent additivt. Endrer ingen data, ingen policyer, ingen tabellstruktur -
-- kun grunnleggende tilgangsrettigheter som matcher det RLS-policyene fra
-- 20260814120000_evidence_engine.sql og 20260815120000_evidence_engine_events.sql
-- allerede forutsetter.

grant usage on schema public to authenticated;

-- claims: full CRUD for eier, matcher select/insert/update/delete-policyene.
grant select, insert, update, delete on public.claims to authenticated;

-- claim_evidence_links: ingen update-policy finnes (koblinger opprettes/slettes, redigeres ikke).
grant select, insert, delete on public.claim_evidence_links to authenticated;

-- claim_assessments: append-only med vilje - ingen update/delete-policy for authenticated.
grant select, insert on public.claim_assessments to authenticated;

-- events: full CRUD for eier.
grant select, insert, update, delete on public.events to authenticated;

-- event_claim_links / event_document_links: ingen update-policy.
grant select, insert, delete on public.event_claim_links to authenticated;
grant select, insert, delete on public.event_document_links to authenticated;

-- document_facts: ingen delete-policy for authenticated (rader lever så
-- lenge dokumentet gjør, håndteres via case_documents sin cascade).
grant select, insert, update on public.document_facts to authenticated;

-- service_role: full tilgang, samme forsvarlige standard som
-- case_access/user_purchases/user_case_entitlements allerede har - unngår
-- at et fremtidig admin-/bakgrunnsverktøy treffer samme overraskelse som
-- profiles gjorde i fase 1.
grant select, insert, update, delete on public.claims to service_role;
grant select, insert, update, delete on public.claim_evidence_links to service_role;
grant select, insert, update, delete on public.claim_assessments to service_role;
grant select, insert, update, delete on public.events to service_role;
grant select, insert, update, delete on public.event_claim_links to service_role;
grant select, insert, update, delete on public.event_document_links to service_role;
grant select, insert, update, delete on public.document_facts to service_role;

-- Oppdaget i samme runde, urelatert til Evidence Engine men samme
-- feilklasse: case_documents manglet GRANT for service_role (ingen
-- eksisterende rute bruker service-role mot denne tabellen i dag, men
-- fikses nå for å unngå samme overraskelse senere).
grant select, insert, update, delete on public.case_documents to service_role;

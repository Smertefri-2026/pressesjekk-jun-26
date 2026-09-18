-- Remøy AI Evidence Engine — fase 5: Evidence Workspace
--
-- Additivt. Rører ingen eksisterende rader, tabeller eller GRANT-er (begge
-- tabellene har allerede fungerende grants fra tidligere faser - kun nye
-- kolonner legges til, ingen ny GRANT nødvendig).
--
-- case_documents.user_intent_note:
--   Brukerens egen hensikt/hypotese ved opplasting - "hva ønsker du at vi
--   særlig skal se etter i dette dokumentet?". Dette er ALDRI et faktum,
--   kun brukerens forventning - holdes strukturelt atskilt fra
--   document_facts (som er KI-ekstrahert) og fra claim-tekst (som er
--   brukerens påstand om saken, ikke om ETT dokument).
--
-- document_facts.user_confirmed / user_corrections:
--   KI-ekstraherte fakta forblir alltid urørt i sine opprinnelige felt -
--   brukerens bekreftelse/korrigering lagres i EGNE felt (user_confirmed,
--   user_corrections) i stedet for å overskrive KI sin opprinnelige
--   ekstraksjon. Dette bevarer historikk/kilde: man kan alltid se hva KI
--   faktisk fant, og hva brukeren eventuelt rettet det til.

alter table public.case_documents
add column if not exists user_intent_note text;

alter table public.document_facts
add column if not exists user_confirmed boolean not null default false;

alter table public.document_facts
add column if not exists user_corrections jsonb not null default '{}'::jsonb;

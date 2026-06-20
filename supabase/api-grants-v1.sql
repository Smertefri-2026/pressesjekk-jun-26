-- PresseSjekk v1 API grants
-- Gir innloggede brukere tilgang til tabellene via Supabase-klienten.
-- RLS-policyene bestemmer fortsatt hvilke rader brukeren får lese/skrive.

grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.cases to authenticated;
grant select, insert, update, delete on table public.case_inputs to authenticated;
grant select, insert, update, delete on table public.case_reports to authenticated;

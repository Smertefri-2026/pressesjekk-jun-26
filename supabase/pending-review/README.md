# Venter på godkjenning

SQL-filer her er **bevisst plassert utenfor** `supabase/migrations/` slik at
de ikke kjøres automatisk av `supabase db push`. De er klare til bruk, men
gjelder eksisterende data og skal kjøres manuelt først etter at noen har
lest gjennom planen og bekreftet at det er greit.

Flytt filen til `supabase/migrations/` (med et tidsstempel-prefiks) når den
er godkjent og skal kjøres.

## backfill_pfu_decision_documents.sql

Kopierer filreferanser fra `pfu_decisions.uploaded_file_path` inn i
`case_documents`, slik at PFU-avgjørelsesfiler lastet opp *før* det samlede
vedleggspanelet ble innført også dukker opp der. Ren, idempotent `INSERT …
SELECT … WHERE NOT EXISTS` - rører aldri `pfu_decisions` eller
Storage-objekter, kan kjøres flere ganger uten å duplisere.

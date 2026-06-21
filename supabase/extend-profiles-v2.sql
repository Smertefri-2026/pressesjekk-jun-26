alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text,
  add column if not exists address_line_1 text,
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists country text default 'Norge',
  add column if not exists organization_name text,
  add column if not exists organization_number text,
  add column if not exists contact_person_name text,
  add column if not exists contact_person_email text,
  add column if not exists contact_person_phone text,
  add column if not exists billing_email text,
  add column if not exists delivery_address_line_1 text,
  add column if not exists delivery_postal_code text,
  add column if not exists delivery_city text,
  add column if not exists delivery_country text default 'Norge';

comment on column public.profiles.first_name is 'Fornavn for privatperson eller kontaktperson.';
comment on column public.profiles.last_name is 'Etternavn for privatperson eller kontaktperson.';
comment on column public.profiles.phone is 'Mobilnummer for brukeren.';
comment on column public.profiles.address_line_1 is 'Adresse for bruker eller virksomhet.';
comment on column public.profiles.postal_code is 'Postnummer.';
comment on column public.profiles.city is 'Poststed.';
comment on column public.profiles.country is 'Land.';
comment on column public.profiles.organization_name is 'Firmanavn eller organisasjonsnavn for proffbrukere.';
comment on column public.profiles.organization_number is 'Organisasjonsnummer for firma, advokatfirma, redaksjon eller organisasjon.';
comment on column public.profiles.contact_person_name is 'Kontaktperson for proffkonto.';
comment on column public.profiles.contact_person_email is 'E-post til kontaktperson for proffkonto.';
comment on column public.profiles.contact_person_phone is 'Mobil til kontaktperson for proffkonto.';
comment on column public.profiles.billing_email is 'Fakturaepost dersom annen enn innlogget e-post.';
comment on column public.profiles.delivery_address_line_1 is 'Leveringsadresse dersom annen enn profiladresse.';
comment on column public.profiles.delivery_postal_code is 'Postnummer for leveringsadresse.';
comment on column public.profiles.delivery_city is 'Poststed for leveringsadresse.';
comment on column public.profiles.delivery_country is 'Land for leveringsadresse.';

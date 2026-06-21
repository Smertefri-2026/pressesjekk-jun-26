"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";

type ProfileRow = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role_type: string | null;
  address_line_1: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  organization_name: string | null;
  organization_number: string | null;
  contact_person_name: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
  billing_email: string | null;
  delivery_address_line_1: string | null;
  delivery_postal_code: string | null;
  delivery_city: string | null;
  delivery_country: string | null;
  created_at: string;
  updated_at: string;
};

const profileSelect = `
  id,
  full_name,
  first_name,
  last_name,
  email,
  phone,
  role_type,
  address_line_1,
  postal_code,
  city,
  country,
  organization_name,
  organization_number,
  contact_person_name,
  contact_person_email,
  contact_person_phone,
  billing_email,
  delivery_address_line_1,
  delivery_postal_code,
  delivery_city,
  delivery_country,
  created_at,
  updated_at
`;

function roleLabel(roleType: string) {
  if (roleType === "advisor") return "Rådgiver";
  if (roleType === "lawyer") return "Advokat";
  if (roleType === "journalist") return "Journalist/redaksjon";
  if (roleType === "organization") return "Organisasjon/bedrift";
  return "Privatperson";
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleType, setRoleType] = useState("private_person");

  const [addressLine1, setAddressLine1] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Norge");

  const [organizationName, setOrganizationName] = useState("");
  const [organizationNumber, setOrganizationNumber] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [contactPersonEmail, setContactPersonEmail] = useState("");
  const [contactPersonPhone, setContactPersonPhone] = useState("");

  const [billingEmail, setBillingEmail] = useState("");
  const [deliveryAddressLine1, setDeliveryAddressLine1] = useState("");
  const [deliveryPostalCode, setDeliveryPostalCode] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryCountry, setDeliveryCountry] = useState("Norge");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isProfessionalRole = roleType !== "private_person";

  const fullName = useMemo(() => {
    return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
  }, [firstName, lastName]);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("profiles")
        .select(profileSelect)
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (data) {
        const profileData = data as ProfileRow;
        setProfile(profileData);

        const existingFullName = profileData.full_name ?? "";
        const fallbackNames = existingFullName.trim().split(" ");
        const fallbackFirstName = fallbackNames[0] ?? "";
        const fallbackLastName = fallbackNames.slice(1).join(" ");

        setFirstName(profileData.first_name ?? fallbackFirstName);
        setLastName(profileData.last_name ?? fallbackLastName);
        setPhone(profileData.phone ?? "");
        setRoleType(profileData.role_type ?? "private_person");

        setAddressLine1(profileData.address_line_1 ?? "");
        setPostalCode(profileData.postal_code ?? "");
        setCity(profileData.city ?? "");
        setCountry(profileData.country ?? "Norge");

        setOrganizationName(profileData.organization_name ?? "");
        setOrganizationNumber(profileData.organization_number ?? "");
        setContactPersonName(profileData.contact_person_name ?? "");
        setContactPersonEmail(profileData.contact_person_email ?? "");
        setContactPersonPhone(profileData.contact_person_phone ?? "");

        setBillingEmail(profileData.billing_email ?? "");
        setDeliveryAddressLine1(profileData.delivery_address_line_1 ?? "");
        setDeliveryPostalCode(profileData.delivery_postal_code ?? "");
        setDeliveryCity(profileData.delivery_city ?? "");
        setDeliveryCountry(profileData.delivery_country ?? "Norge");
      } else {
        const metadataName =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : "";

        const nameParts = metadataName.trim().split(" ");
        const metadataFirstName = nameParts[0] ?? "";
        const metadataLastName = nameParts.slice(1).join(" ");

        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            full_name: metadataName || null,
            first_name: metadataFirstName || null,
            last_name: metadataLastName || null,
            email: user.email ?? null,
            role_type: "private_person",
            country: "Norge",
            delivery_country: "Norge",
          })
          .select(profileSelect)
          .single();

        if (createError) {
          setErrorMessage(createError.message);
          setIsLoading(false);
          return;
        }

        const profileData = createdProfile as ProfileRow;
        setProfile(profileData);
        setFirstName(profileData.first_name ?? "");
        setLastName(profileData.last_name ?? "");
        setRoleType(profileData.role_type ?? "private_person");
      }

      setIsLoading(false);
    }

    loadProfile();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setErrorMessage("Du må være innlogget for å oppdatere profilen.");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Legg inn både fornavn og etternavn.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      id: user.id,
      full_name: fullName || null,
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      email: user.email ?? null,
      phone: phone.trim() || null,
      role_type: roleType,
      address_line_1: addressLine1.trim() || null,
      postal_code: postalCode.trim() || null,
      city: city.trim() || null,
      country: country.trim() || "Norge",
      organization_name: organizationName.trim() || null,
      organization_number: organizationNumber.trim() || null,
      contact_person_name: contactPersonName.trim() || null,
      contact_person_email: contactPersonEmail.trim() || null,
      contact_person_phone: contactPersonPhone.trim() || null,
      billing_email: billingEmail.trim() || null,
      delivery_address_line_1: deliveryAddressLine1.trim() || null,
      delivery_postal_code: deliveryPostalCode.trim() || null,
      delivery_city: deliveryCity.trim() || null,
      delivery_country: deliveryCountry.trim() || "Norge",
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload)
      .select(profileSelect)
      .single();

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    setProfile(data as ProfileRow);
    setSuccessMessage("Profilen er lagret.");
    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              Laster profil...
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/min-side"
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          ← Tilbake til Min Side
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_390px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Profil
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Din PresseSjekk-profil
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Profilen brukes til rapporter, PFU-utkast, kontaktinformasjon,
              betaling og eventuell bestilling av full utredning. For
              profesjonelle brukere kan profilen også brukes til
              firmaopplysninger, klientarbeid og fakturering.
            </p>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Konto og dokumentasjon
            </p>

            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Brukes i utkast og rapporter
            </h2>

            <p className="mt-4 leading-8 text-slate-700">
              Opplysningene du legger inn her kan brukes automatisk i rapporter,
              klageutkast, fakturaer og senere bestillinger av trykte
              utredninger. Du kan starte enkelt og fylle ut mer senere.
            </p>
          </aside>
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_390px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Kontoinformasjon
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Profilopplysninger
            </h2>

            <div className="mt-8 grid gap-8">
              <section className="grid gap-5">
                <div>
                  <h3 className="text-xl font-black text-slate-950">
                    Person og rolle
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Navn og rolle brukes for å tilpasse rapporter, maler og
                    senere profftilgang.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="text-sm font-bold text-slate-800"
                    >
                      Fornavn
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="Fornavn"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="text-sm font-bold text-slate-800"
                    >
                      Etternavn
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Etternavn"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="email"
                      className="text-sm font-bold text-slate-800"
                    >
                      E-post
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={user?.email ?? profile?.email ?? ""}
                      disabled
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-4 text-slate-500"
                    />
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      E-post kan ikke endres. For å endre e-post, kontakt PresseSjekk eller registrer en ny konto.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="text-sm font-bold text-slate-800"
                    >
                      Mobil
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+47 00 00 00 00"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="roleType"
                    className="text-sm font-bold text-slate-800"
                  >
                    Rolle
                  </label>
                  <select
                    id="roleType"
                    value={roleType}
                    onChange={(event) => setRoleType(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                  >
                    <option value="private_person">Privatperson</option>
                    <option value="advisor">Rådgiver</option>
                    <option value="lawyer">Advokat</option>
                    <option value="journalist">Journalist/redaksjon</option>
                    <option value="organization">Organisasjon/bedrift</option>
                  </select>
                </div>
              </section>

              <section className="grid gap-5 border-t border-slate-200 pt-8">
                <div>
                  <h3 className="text-xl font-black text-slate-950">
                    Adresse
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Adressen kan senere brukes ved bestilling av trykt utredning
                    eller annen dokumentasjon.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="addressLine1"
                    className="text-sm font-bold text-slate-800"
                  >
                    Adresse
                  </label>
                  <input
                    id="addressLine1"
                    type="text"
                    value={addressLine1}
                    onChange={(event) => setAddressLine1(event.target.value)}
                    placeholder="Gateadresse"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-[160px_1fr]">
                  <div>
                    <label
                      htmlFor="postalCode"
                      className="text-sm font-bold text-slate-800"
                    >
                      Postnummer
                    </label>
                    <input
                      id="postalCode"
                      type="text"
                      value={postalCode}
                      onChange={(event) => setPostalCode(event.target.value)}
                      placeholder="0000"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="city"
                      className="text-sm font-bold text-slate-800"
                    >
                      Sted
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder="Sted"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="country"
                    className="text-sm font-bold text-slate-800"
                  >
                    Land
                  </label>
                  <input
                    id="country"
                    type="text"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    placeholder="Norge"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
              </section>

              {isProfessionalRole ? (
                <section className="grid gap-5 border-t border-slate-200 pt-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-950">
                      Firma / organisasjon
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Disse feltene brukes for proffbrukere, firmaopplysninger,
                      fakturering og kontaktperson.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="organizationName"
                        className="text-sm font-bold text-slate-800"
                      >
                        Firmanavn
                      </label>
                      <input
                        id="organizationName"
                        type="text"
                        value={organizationName}
                        onChange={(event) =>
                          setOrganizationName(event.target.value)
                        }
                        placeholder="Firmanavn"
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="organizationNumber"
                        className="text-sm font-bold text-slate-800"
                      >
                        Organisasjonsnummer
                      </label>
                      <input
                        id="organizationNumber"
                        type="text"
                        value={organizationNumber}
                        onChange={(event) =>
                          setOrganizationNumber(event.target.value)
                        }
                        placeholder="000 000 000"
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contactPersonName"
                      className="text-sm font-bold text-slate-800"
                    >
                      Kontaktperson
                    </label>
                    <input
                      id="contactPersonName"
                      type="text"
                      value={contactPersonName}
                      onChange={(event) =>
                        setContactPersonName(event.target.value)
                      }
                      placeholder="Navn på kontaktperson"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="contactPersonEmail"
                        className="text-sm font-bold text-slate-800"
                      >
                        E-post kontaktperson
                      </label>
                      <input
                        id="contactPersonEmail"
                        type="email"
                        value={contactPersonEmail}
                        onChange={(event) =>
                          setContactPersonEmail(event.target.value)
                        }
                        placeholder="kontakt@firma.no"
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contactPersonPhone"
                        className="text-sm font-bold text-slate-800"
                      >
                        Mobil kontaktperson
                      </label>
                      <input
                        id="contactPersonPhone"
                        type="tel"
                        value={contactPersonPhone}
                        onChange={(event) =>
                          setContactPersonPhone(event.target.value)
                        }
                        placeholder="+47 00 00 00 00"
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="grid gap-5 border-t border-slate-200 pt-8">
                <div>
                  <h3 className="text-xl font-black text-slate-950">
                    Faktura og levering
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Valgfritt. Brukes senere hvis faktura eller trykket
                    utredning skal sendes til en annen adresse.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="billingEmail"
                    className="text-sm font-bold text-slate-800"
                  >
                    Faktura-e-post
                  </label>
                  <input
                    id="billingEmail"
                    type="email"
                    value={billingEmail}
                    onChange={(event) => setBillingEmail(event.target.value)}
                    placeholder="Samme som konto hvis tom"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="deliveryAddressLine1"
                    className="text-sm font-bold text-slate-800"
                  >
                    Leveringsadresse
                  </label>
                  <input
                    id="deliveryAddressLine1"
                    type="text"
                    value={deliveryAddressLine1}
                    onChange={(event) =>
                      setDeliveryAddressLine1(event.target.value)
                    }
                    placeholder="Samme som adresse hvis tom"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-[160px_1fr]">
                  <div>
                    <label
                      htmlFor="deliveryPostalCode"
                      className="text-sm font-bold text-slate-800"
                    >
                      Postnummer
                    </label>
                    <input
                      id="deliveryPostalCode"
                      type="text"
                      value={deliveryPostalCode}
                      onChange={(event) =>
                        setDeliveryPostalCode(event.target.value)
                      }
                      placeholder="0000"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="deliveryCity"
                      className="text-sm font-bold text-slate-800"
                    >
                      Sted
                    </label>
                    <input
                      id="deliveryCity"
                      type="text"
                      value={deliveryCity}
                      onChange={(event) => setDeliveryCity(event.target.value)}
                      placeholder="Sted"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="deliveryCountry"
                    className="text-sm font-bold text-slate-800"
                  >
                    Land
                  </label>
                  <input
                    id="deliveryCountry"
                    type="text"
                    value={deliveryCountry}
                    onChange={(event) => setDeliveryCountry(event.target.value)}
                    placeholder="Norge"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
              </section>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800">
                  {successMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Lagrer..." : "Lagre profil"}
              </button>
            </div>
          </form>

          <aside className="grid gap-6">
            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Konto
              </p>

              <h2 className="mt-3 text-3xl font-black">
                {fullName || profile?.full_name || "Navn ikke satt"}
              </h2>

              <p className="mt-4 break-words leading-8 text-slate-300">
                {user?.email}
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-bold text-cyan-200">Rolle</p>
                <p className="mt-1 text-lg font-black">
                  {roleLabel(roleType)}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Profilstatus
              </p>

              <h2 className="mt-3 text-3xl font-black text-slate-950">
                {firstName && lastName ? "Klar til bruk" : "Mangler navn"}
              </h2>

              <p className="mt-4 leading-8 text-slate-700">
                Legg inn fornavn og etternavn for at navn skal kunne brukes
                automatisk i rapporter og klageutkast.
              </p>
            </div>
          </aside>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}

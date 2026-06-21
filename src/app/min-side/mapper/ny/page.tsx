"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role_type: string | null;
};

function getFolderConfig(roleType: string | null) {
  if (roleType === "lawyer" || roleType === "advisor") {
    return {
      label: "Ny klientmappe",
      titleLabel: "Mappenavn",
      titlePlaceholder: "F.eks. Ola Nordmann / Mediesak 2026",
      clientLabel: "Klientnavn",
      showClient: true,
      showOrganization: false,
      folderType: "client_case",
      helpText:
        "En klientmappe kan samle flere mediesaker, artikler, PFU-spor og dokumentasjon for samme klient.",
    };
  }

  if (roleType === "journalist") {
    return {
      label: "Ny publiseringsmappe",
      titleLabel: "Publiseringsmappe",
      titlePlaceholder: "F.eks. Undersøkelse om boligpriser",
      clientLabel: "",
      showClient: false,
      showOrganization: false,
      folderType: "publication_case",
      helpText:
        "En publiseringsmappe kan samle kilder, tilsvar, dokumentasjon og vurderinger knyttet til en publisering.",
    };
  }

  if (roleType === "organization") {
    return {
      label: "Ny mediemappe",
      titleLabel: "Mappenavn",
      titlePlaceholder: "F.eks. Omdømmesak / presseomtale juni 2026",
      clientLabel: "",
      showClient: false,
      showOrganization: true,
      folderType: "organization_case",
      helpText:
        "En mediemappe kan samle omtaler, artikler, tilsvar og oppfølging for en organisasjon eller bedrift.",
    };
  }

  return {
    label: "Ny saksmappe",
    titleLabel: "Mappenavn",
    titlePlaceholder: "F.eks. Mediesaken min",
    clientLabel: "",
    showClient: false,
    showOrganization: false,
    folderType: "media_case",
    helpText:
      "En saksmappe kan samle flere artikler, medier eller omtaler som hører til samme sak.",
  };
}

export default function NewFolderPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [description, setDescription] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
        .select("id,full_name,email,role_type")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      setProfile((data as ProfileRow | null) ?? null);
      setIsLoading(false);
    }

    loadProfile();
  }, []);

  const config = getFolderConfig(profile?.role_type ?? null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setErrorMessage("Du må være innlogget for å opprette mappe.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Skriv inn navn på mappen.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    const { error } = await supabase.from("case_folders").insert({
      user_id: user.id,
      title: title.trim(),
      folder_type: config.folderType,
      client_name: clientName.trim() || null,
      organization_name: organizationName.trim() || null,
      description: description.trim() || null,
      status: "active",
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    window.location.href = "/min-side/mapper";
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              Laster ny mappe...
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
          href="/min-side/mapper"
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          ← Tilbake til mapper
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_390px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Mapper
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              {config.label}
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              {config.helpText}
            </p>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Neste
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Koble saker til mappe
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Etter at mappen er opprettet, blir neste steg å la nye saker
              plasseres i en mappe.
            </p>
          </aside>
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_390px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Ny mappe
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Opprett struktur
            </h2>

            <div className="mt-8 grid gap-5">
              <div>
                <label
                  htmlFor="title"
                  className="text-sm font-bold text-slate-800"
                >
                  {config.titleLabel}
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={config.titlePlaceholder}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              {config.showClient ? (
                <div>
                  <label
                    htmlFor="clientName"
                    className="text-sm font-bold text-slate-800"
                  >
                    {config.clientLabel}
                  </label>
                  <input
                    id="clientName"
                    type="text"
                    value={clientName}
                    onChange={(event) => setClientName(event.target.value)}
                    placeholder="F.eks. Ola Nordmann"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
              ) : null}

              {config.showOrganization ? (
                <div>
                  <label
                    htmlFor="organizationName"
                    className="text-sm font-bold text-slate-800"
                  >
                    Organisasjon / bedrift
                  </label>
                  <input
                    id="organizationName"
                    type="text"
                    value={organizationName}
                    onChange={(event) =>
                      setOrganizationName(event.target.value)
                    }
                    placeholder="F.eks. Firmanavn AS"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
              ) : null}

              <div>
                <label
                  htmlFor="description"
                  className="text-sm font-bold text-slate-800"
                >
                  Beskrivelse
                </label>
                <textarea
                  id="description"
                  rows={5}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Kort beskrivelse av hva mappen skal samle..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Oppretter..." : "Opprett mappe"}
                </button>

                <Link
                  href="/min-side/mapper"
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-4 font-black text-slate-950 hover:bg-slate-100"
                >
                  Avbryt
                </Link>
              </div>
            </div>
          </form>

          <aside className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
              Felles struktur
            </p>
            <h2 className="mt-3 text-3xl font-black">Én løsning</h2>
            <p className="mt-4 leading-8 text-slate-300">
              Teknisk bruker alle samme mappestruktur. Språket tilpasses etter
              profilrollen din, slik at systemet fungerer for privatpersoner,
              advokater, journalister og organisasjoner.
            </p>
          </aside>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role_type: string | null;
};

type CaseFolderRow = {
  id: string;
  title: string;
  folder_type: string | null;
  client_name: string | null;
  organization_name: string | null;
  description: string | null;
  status: "active" | "archived" | "closed";
  created_at: string;
};

type CaseRow = {
  id: string;
  folder_id: string | null;
};

function getFolderLabels(roleType: string | null) {
  if (roleType === "lawyer" || roleType === "advisor") {
    return {
      title: "Klientmapper",
      singular: "klientmappe",
      newButton: "+ Ny klientmappe",
      intro:
        "Her kan advokater og rådgivere samle flere mediesaker under samme klient eller prosjekt.",
    };
  }

  if (roleType === "journalist") {
    return {
      title: "Publiseringsmapper",
      singular: "publiseringsmappe",
      newButton: "+ Ny publiseringsmappe",
      intro:
        "Her kan redaksjoner og journalister samle saker, kilder, tilsvar og vurderinger knyttet til en publisering.",
    };
  }

  if (roleType === "organization") {
    return {
      title: "Mediemapper",
      singular: "mediemappe",
      newButton: "+ Ny mediemappe",
      intro:
        "Her kan organisasjoner og bedrifter samle medieomtale, dokumentasjon og oppfølging på ett sted.",
    };
  }

  return {
    title: "Saksmapper",
    singular: "saksmappe",
    newButton: "+ Ny saksmappe",
    intro:
      "Her kan du samle flere mediesaker, artikler eller omtaler i samme mappe.",
  };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export default function FoldersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [folders, setFolders] = useState<CaseFolderRow[]>([]);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadFolders() {
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

      const [profileResult, foldersResult, casesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,full_name,email,role_type")
          .eq("id", user.id)
          .maybeSingle(),

        supabase
          .from("case_folders")
          .select(
            "id,title,folder_type,client_name,organization_name,description,status,created_at"
          )
          .order("created_at", { ascending: false }),

        supabase.from("cases").select("id,folder_id"),
      ]);

      if (profileResult.error) {
        setErrorMessage(profileResult.error.message);
        setIsLoading(false);
        return;
      }

      if (foldersResult.error) {
        setErrorMessage(foldersResult.error.message);
        setIsLoading(false);
        return;
      }

      if (casesResult.error) {
        setErrorMessage(casesResult.error.message);
        setIsLoading(false);
        return;
      }

      setProfile((profileResult.data as ProfileRow | null) ?? null);
      setFolders((foldersResult.data ?? []) as CaseFolderRow[]);
      setCases((casesResult.data ?? []) as CaseRow[]);
      setIsLoading(false);
    }

    loadFolders();
  }, []);

  const labels = getFolderLabels(profile?.role_type ?? null);

  const caseCountByFolder = useMemo(() => {
    const counts = new Map<string, number>();

    cases.forEach((caseItem) => {
      if (!caseItem.folder_id) return;
      counts.set(caseItem.folder_id, (counts.get(caseItem.folder_id) ?? 0) + 1);
    });

    return counts;
  }, [cases]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              Laster mapper...
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
              Mapper
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              {labels.title}
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              {labels.intro}
            </p>

            {user?.email ? (
              <p className="mt-5 text-sm font-semibold text-slate-500">
                Innlogget som:{" "}
                <span className="text-slate-950">{user.email}</span>
              </p>
            ) : null}

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href="/min-side/mapper/ny"
                className="w-full rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white hover:bg-slate-800 sm:w-auto"
              >
                {labels.newButton}
              </Link>

              <Link
                href="/min-side/saker/ny"
                className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-bold text-slate-950 hover:bg-slate-100 sm:w-auto"
              >
                + Opprett ny sak
              </Link>

              <SignOutButton />
            </div>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Struktur
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Mapper → saker
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Første versjon lar deg opprette mapper. Neste steg blir å knytte
              nye og eksisterende saker til en mappe.
            </p>
          </aside>
        </div>

        <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Oversikt
              </p>
              <h2 className="mt-3 text-4xl font-black text-slate-950">
                Lagrede mapper
              </h2>
            </div>

            <Link
              href="/min-side/mapper/ny"
              className="rounded-xl bg-slate-950 px-5 py-4 text-center text-sm font-black text-white hover:bg-slate-800"
            >
              {labels.newButton}
            </Link>
          </div>

          {errorMessage ? (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              {errorMessage}
            </div>
          ) : null}

          {folders.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8">
              <h3 className="text-2xl font-black text-slate-950">
                Ingen mapper opprettet ennå
              </h3>
              <p className="mt-4 max-w-2xl leading-8 text-slate-700">
                Du kan fortsatt bruke PresseSjekk med enkeltsaker. Mapper blir
                nyttig når du har flere saker, flere medier eller jobber
                profesjonelt med klienter/prosjekter.
              </p>

              <Link
                href="/min-side/mapper/ny"
                className="mt-6 inline-flex rounded-xl bg-cyan-500 px-5 py-4 text-sm font-black text-slate-950 hover:bg-cyan-400"
              >
                Opprett første {labels.singular}
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-4">
              {folders.map((folder) => (
                <article
                  key={folder.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">
                        {folder.status === "active"
                          ? "Aktiv"
                          : folder.status === "closed"
                            ? "Lukket"
                            : "Arkivert"}{" "}
                        · Opprettet {formatDate(folder.created_at)}
                      </p>
                      <h3 className="mt-3 text-2xl font-black text-slate-950">
                        {folder.title}
                      </h3>

                      {folder.client_name ? (
                        <p className="mt-2 font-semibold text-slate-700">
                          Klient: {folder.client_name}
                        </p>
                      ) : null}

                      {folder.organization_name ? (
                        <p className="mt-2 font-semibold text-slate-700">
                          Organisasjon: {folder.organization_name}
                        </p>
                      ) : null}

                      {folder.description ? (
                        <p className="mt-3 max-w-2xl leading-8 text-slate-700">
                          {folder.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center">
                      <p className="text-3xl font-black text-slate-950">
                        {caseCountByFolder.get(folder.id) ?? 0}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        saker
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}

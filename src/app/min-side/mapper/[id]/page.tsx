"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";

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
  title: string;
  status: "draft" | "in_progress" | "report_ready" | "closed";
  media_name: string | null;
  article_title: string | null;
  published_date: string | null;
  created_at: string;
};

type ArchiveItem = {
  id: string;
  icon: string;
  name: string;
  subtitle: string;
  type: "Sak";
  status: string;
  date: string;
  href: string;
};

type SortKey = "name" | "type" | "status" | "date";

function statusLabel(status: CaseRow["status"]) {
  if (status === "draft") return "Utkast";
  if (status === "in_progress") return "Under arbeid";
  if (status === "report_ready") return "Rapport klar";
  if (status === "closed") return "Lukket";
  return status;
}

function folderStatusLabel(status: CaseFolderRow["status"]) {
  if (status === "active") return "Aktiv";
  if (status === "archived") return "Arkivert";
  if (status === "closed") return "Lukket";
  return status;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export default function FolderDetailPage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [folder, setFolder] = useState<CaseFolderRow | null>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadFolder() {
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

      const [folderResult, casesResult] = await Promise.all([
        supabase
          .from("case_folders")
          .select(
            "id,title,folder_type,client_name,organization_name,description,status,created_at"
          )
          .eq("id", params.id)
          .maybeSingle(),

        supabase
          .from("cases")
          .select(
            "id,title,status,media_name,article_title,published_date,created_at"
          )
          .eq("folder_id", params.id)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (folderResult.error) {
        setErrorMessage(folderResult.error.message);
        setIsLoading(false);
        return;
      }

      if (casesResult.error) {
        setErrorMessage(casesResult.error.message);
        setIsLoading(false);
        return;
      }

      setFolder((folderResult.data as CaseFolderRow | null) ?? null);
      setCases((casesResult.data ?? []) as CaseRow[]);
      setIsLoading(false);
    }

    loadFolder();
  }, [params.id]);

  const archiveItems = useMemo<ArchiveItem[]>(() => {
    return cases
      .map((caseItem) => ({
        id: caseItem.id,
        icon: "📄",
        name: caseItem.title,
        subtitle: caseItem.media_name ?? "Ukjent medie",
        type: "Sak" as const,
        status: statusLabel(caseItem.status),
        date: caseItem.published_date ?? formatDate(caseItem.created_at),
        href: `/min-side/saker/${caseItem.id}`,
      }))
      .sort((a, b) => {
        const valueA = a[sortKey].toLowerCase();
        const valueB = b[sortKey].toLowerCase();

        if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
        if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [cases, sortDirection, sortKey]);

  function handleSort(nextSortKey: SortKey) {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(nextSortKey === "date" ? "desc" : "asc");
  }

  function sortLabel(key: SortKey) {
    if (sortKey !== key) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              Laster mappe...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!folder) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
            <h1 className="text-3xl font-black text-red-900">
              Fant ikke mappen
            </h1>
            <p className="mt-4 text-red-800">
              Mappen finnes ikke, eller du har ikke tilgang.
            </p>
            <Link
              href="/min-side"
              className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800"
            >
              Tilbake til Min Side
            </Link>
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
          ← Tilbake til Saksarkiv
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_390px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Mappe
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              {folder.title}
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Dette er en mappevisning. Her vises sakene som er koblet til
              denne mappen.
            </p>

            {user?.email ? (
              <p className="mt-5 text-sm font-semibold text-slate-500">
                Innlogget som:{" "}
                <span className="text-slate-950">{user.email}</span>
              </p>
            ) : null}

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href="/min-side/saker/ny"
                className="w-full rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white hover:bg-slate-800 sm:w-auto"
              >
                + Ny sak
              </Link>

              <Link
                href="/min-side/mapper"
                className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-bold text-slate-950 hover:bg-slate-100 sm:w-auto"
              >
                Alle mapper
              </Link>

              <SignOutButton />
            </div>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Mappeinfo
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              {cases.length} saker
            </h2>
            <div className="mt-4 space-y-3 leading-8 text-slate-700">
              <p>Status: {folderStatusLabel(folder.status)}</p>
              <p>Opprettet: {formatDate(folder.created_at)}</p>
              {folder.client_name ? <p>Klient: {folder.client_name}</p> : null}
              {folder.organization_name ? (
                <p>Organisasjon: {folder.organization_name}</p>
              ) : null}
            </div>
          </aside>
        </div>

        <section id="mappeinnhold" className="mt-10 grid gap-8 lg:grid-cols-[1fr_390px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-0 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                  Innhold
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  Saker i mappen
                </h2>
              </div>

              <Link
                href="/min-side/saker/ny"
                className="rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-black text-white hover:bg-slate-800"
              >
                + Ny sak
              </Link>
            </div>

            {errorMessage ? (
              <div className="m-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                {errorMessage}
              </div>
            ) : null}

            {archiveItems.length === 0 ? (
              <div className="p-6 sm:p-8">
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8">
                  <h3 className="text-2xl font-black text-slate-950">
                    Mappen er tom
                  </h3>
                  <p className="mt-4 max-w-2xl leading-8 text-slate-700">
                    Neste steg blir å la nye saker opprettes direkte i denne
                    mappen, eller flytte eksisterende saker hit.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <div className="hidden grid-cols-[1fr_130px_140px_130px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500 md:grid">
                  <button
                    type="button"
                    onClick={() => handleSort("name")}
                    className="text-left hover:text-cyan-700"
                  >
                    Navn{sortLabel("name")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSort("type")}
                    className="text-left hover:text-cyan-700"
                  >
                    Type{sortLabel("type")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSort("status")}
                    className="text-left hover:text-cyan-700"
                  >
                    Status{sortLabel("status")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSort("date")}
                    className="text-left hover:text-cyan-700"
                  >
                    Dato{sortLabel("date")}
                  </button>
                </div>

                <div className="divide-y divide-slate-200">
                  {archiveItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="grid gap-3 px-5 py-4 transition hover:bg-cyan-50 md:grid-cols-[1fr_130px_140px_130px] md:items-center"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="text-2xl leading-none">
                          {item.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-base font-black text-slate-950">
                            {item.name}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="text-sm font-bold text-slate-600">
                        {item.type}
                      </div>

                      <div className="text-sm font-bold text-slate-600">
                        {item.status}
                      </div>

                      <div className="text-sm font-semibold text-slate-500">
                        {item.date}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
              Neste steg
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Koble saker til mapper
            </h2>
            <p className="mt-4 leading-8 text-slate-300">
              Nå åpnes mappen som en egen visning. Neste steg blir å gjøre det
              mulig å opprette nye saker direkte i valgt mappe.
            </p>
          </aside>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}

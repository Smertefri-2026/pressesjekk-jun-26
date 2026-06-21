"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";

type CaseRow = {
  id: string;
  folder_id: string | null;
  title: string;
  status: "draft" | "in_progress" | "report_ready" | "closed";
  media_name: string | null;
  article_title: string | null;
  published_date: string | null;
  created_at: string;
};

type CaseFolderRow = {
  id: string;
  parent_folder_id: string | null;
  title: string;
  folder_type: string | null;
  status: "active" | "archived" | "closed" | "trashed";
  created_at: string;
  deleted_at: string | null;
};

type ReportRow = {
  id: string;
  case_id: string;
  version: number;
  report_type: "free_check" | "full_report" | "pfu_draft";
  created_at: string;
};

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  href: string;
};

type ArchiveItem = {
  id: string;
  rawId: string;
  icon: string;
  name: string;
  subtitle: string;
  type: "Mappe" | "Sak";
  status: string;
  date: string;
  href: string;
  folderId?: string;
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
  if (status === "trashed") return "Papirkurv";
  return status;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatActivityDate(date: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function MinSidePage() {
  const [user, setUser] = useState<User | null>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [folders, setFolders] = useState<CaseFolderRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [caseCount, setCaseCount] = useState(0);
  const [folderCount, setFolderCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [pfuDraftCount, setPfuDraftCount] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
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

      const [casesResult, foldersResult, reportsResult, pfuDraftCountResult] =
        await Promise.all([
          supabase
            .from("cases")
            .select(
              "id,folder_id,title,status,media_name,article_title,published_date,created_at",
              { count: "exact" }
            )
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(50),

          supabase
            .from("case_folders")
            .select("id,parent_folder_id,title,folder_type,status,created_at,deleted_at", {
              count: "exact",
            })
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(100),

          supabase
            .from("case_reports")
            .select("id,case_id,version,report_type,created_at", {
              count: "exact",
            })
            .order("created_at", { ascending: false })
            .limit(50),

          supabase
            .from("case_reports")
            .select("id", { count: "exact", head: true })
            .eq("report_type", "pfu_draft"),
        ]);

      if (casesResult.error) {
        setErrorMessage(casesResult.error.message);
        setIsLoading(false);
        return;
      }

      if (foldersResult.error) {
        setErrorMessage(foldersResult.error.message);
        setIsLoading(false);
        return;
      }

      if (reportsResult.error) {
        setErrorMessage(reportsResult.error.message);
        setIsLoading(false);
        return;
      }

      const caseRows = (casesResult.data ?? []) as CaseRow[];
      const folderRows = (foldersResult.data ?? []) as CaseFolderRow[];
      const reportRows = (reportsResult.data ?? []) as ReportRow[];

      setCases(caseRows);
      setFolders(folderRows);
      setReports(reportRows);
      setCaseCount(casesResult.count ?? caseRows.length);
      setFolderCount(foldersResult.count ?? folderRows.length);
      setReportCount(reportsResult.count ?? reportRows.length);
      setPfuDraftCount(pfuDraftCountResult.count ?? 0);

      setIsLoading(false);
    }

    loadDashboard();
  }, []);

  const selectedFolder = useMemo(() => {
    if (!selectedFolderId) return null;
    return folders.find((folder) => folder.id === selectedFolderId) ?? null;
  }, [folders, selectedFolderId]);

  const archiveItems = useMemo<ArchiveItem[]>(() => {
    const folderItems: ArchiveItem[] = folders
      .filter((folder) =>
        selectedFolderId
          ? folder.parent_folder_id === selectedFolderId
          : !folder.parent_folder_id
      )
      .map((folder) => ({
        id: `folder-${folder.id}`,
        rawId: folder.id,
        icon: "📁",
        name: folder.title,
        subtitle: selectedFolderId ? "Undermappe" : "Saksmappe",
        type: "Mappe",
        status: folderStatusLabel(folder.status),
        date: formatDate(folder.created_at),
        href: "#",
        folderId: folder.id,
      }));

    const caseItems: ArchiveItem[] = cases
      .filter((caseItem) =>
        selectedFolderId
          ? caseItem.folder_id === selectedFolderId
          : !caseItem.folder_id
      )
      .map((caseItem) => ({
        id: `case-${caseItem.id}`,
        rawId: caseItem.id,
        icon: "📄",
        name: caseItem.title,
        subtitle: caseItem.media_name ?? "Ukjent medie",
        type: "Sak",
        status: statusLabel(caseItem.status),
        date: caseItem.published_date ?? formatDate(caseItem.created_at),
        href: `/min-side/saker/${caseItem.id}`,
      }));

    return [...folderItems, ...caseItems].sort((a, b) => {
      const valueA = a[sortKey].toLowerCase();
      const valueB = b[sortKey].toLowerCase();

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [cases, folders, selectedFolderId, sortDirection, sortKey]);

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

  async function moveToTrash(item: ArchiveItem) {
    const confirmed = window.confirm(
      `Vil du flytte "${item.name}" til papirkurven?`
    );

    if (!confirmed) return;

    setErrorMessage("");

    if (item.type === "Mappe") {
      const { error } = await supabase
        .from("case_folders")
        .update({
          status: "trashed",
          deleted_at: new Date().toISOString(),
        })
        .eq("id", item.rawId);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setFolders((current) =>
        current.filter((folder) => folder.id !== item.rawId)
      );

      if (selectedFolderId === item.rawId) {
        setSelectedFolderId(null);
      }

      return;
    }

    const { error } = await supabase
      .from("cases")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", item.rawId);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setCases((current) => current.filter((caseItem) => caseItem.id !== item.rawId));
    setCaseCount((current) => Math.max(0, current - 1));
  }

  const activityItems: ActivityItem[] = [
    ...reports.map((report) => {
      const linkedCase = cases.find((caseItem) => caseItem.id === report.case_id);

      return {
        id: `report-${report.id}`,
        title:
          report.report_type === "pfu_draft"
            ? `PFU-utkast v${report.version} lagret`
            : `Rapport v${report.version} lagret`,
        description: linkedCase
          ? linkedCase.title
          : "Rapportutkast lagret på en sak",
        created_at: report.created_at,
        href:
          report.report_type === "pfu_draft"
            ? `/min-side/saker/${report.case_id}/pfu`
            : `/min-side/saker/${report.case_id}/rapport`,
      };
    }),
    ...cases.map((caseItem) => ({
      id: `case-${caseItem.id}`,
      title: "Sak opprettet",
      description: caseItem.title,
      created_at: caseItem.created_at,
      href: `/min-side/saker/${caseItem.id}`,
    })),
    ...folders.map((folder) => ({
      id: `folder-${folder.id}`,
      title: "Mappe opprettet",
      description: folder.title,
      created_at: folder.created_at,
      href: "/min-side/mapper",
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 6);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              Laster Min Side...
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
        <div className="grid gap-8 lg:grid-cols-[1fr_390px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Dashboard
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Saksarkiv
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Dette er ditt PresseSjekk-arkiv. Mapper fungerer som Finder:
              klikk på en mappe eller sak for å åpne den.
            </p>

            {user?.email ? (
              <p className="mt-5 text-sm font-semibold text-slate-500">
                Innlogget som:{" "}
                <span className="text-slate-950">{user.email}</span>
              </p>
            ) : null}

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href={
                  selectedFolderId
                    ? `/min-side/mapper/ny?parentFolderId=${selectedFolderId}`
                    : "/min-side/mapper/ny"
                }
                className="w-full rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white hover:bg-slate-800 sm:w-auto"
              >
                {selectedFolderId ? "+ Ny mappe her" : "+ Ny mappe"}
              </Link>

              <Link
                href="/min-side/saker/ny"
                className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-bold text-slate-950 hover:bg-slate-100 sm:w-auto"
              >
                + Ny sak
              </Link>

              <Link
                href="/min-side/profil"
                className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-bold text-slate-950 hover:bg-slate-100 sm:w-auto"
              >
                Profil
              </Link>

              <SignOutButton />
            </div>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Neste anbefalte steg
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              {folderCount === 0 && caseCount > 1
                ? "Samle saker i mapper"
                : caseCount === 0
                  ? "Opprett første sak"
                  : "Åpne en sak eller mappe"}
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              {folderCount === 0 && caseCount > 1
                ? "Du har flere saker. Opprett en mappe for å samle saker som hører sammen."
                : caseCount === 0
                  ? "Start med en sak, eller opprett en mappe først hvis du vet at dette skal bli en større sakssamling."
                  : "Klikk direkte på en mappe eller sak i arkivet for å fortsette arbeidet."}
            </p>
          </aside>
        </div>

        <section
          className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-5"
          id="oversikt"
        >
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="font-bold text-slate-500">Credits igjen</p>
            <p className="mt-4 text-5xl font-black text-cyan-700">0</p>
          </div>

          <a
            href="#arkiv"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="font-bold text-slate-500">Mapper</p>
            <p className="mt-4 text-5xl font-black text-slate-950">
              {folderCount}
            </p>
            <p className="mt-3 text-sm font-semibold text-cyan-700">
              Se arkiv
            </p>
          </a>

          <a
            href="#arkiv"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="font-bold text-slate-500">Saker</p>
            <p className="mt-4 text-5xl font-black text-slate-950">
              {caseCount}
            </p>
            <p className="mt-3 text-sm font-semibold text-cyan-700">
              Se arkiv
            </p>
          </a>

          <a
            href="#arkiv"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="font-bold text-slate-500">Rapporter</p>
            <p className="mt-4 text-5xl font-black text-slate-950">
              {reportCount}
            </p>
            <p className="mt-3 text-sm font-semibold text-cyan-700">
              Se rapporter
            </p>
          </a>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="font-bold text-slate-500">PFU-utkast</p>
            <p className="mt-4 text-5xl font-black text-slate-950">
              {pfuDraftCount}
            </p>
          </div>
        </section>

        <section id="arkiv" className="mt-10 grid gap-8 lg:grid-cols-[1fr_390px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-0 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                  Saksarkiv
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  {selectedFolder ? selectedFolder.title : "Mapper og saker"}
                </h2>

                {selectedFolder ? (
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId(null)}
                    className="mt-3 text-sm font-black text-cyan-700 hover:text-cyan-900"
                  >
                    ← Tilbake til mapper og saker
                  </button>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={
                    selectedFolderId
                      ? `/min-side/mapper/ny?parentFolderId=${selectedFolderId}`
                      : "/min-side/mapper/ny"
                  }
                  className="rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-black text-white hover:bg-slate-800"
                >
                  {selectedFolderId ? "+ Ny mappe her" : "+ Ny mappe"}
                </Link>

                <Link
                  href="/min-side/saker/ny"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
                >
                  + Ny sak
                </Link>
              </div>
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
                    {selectedFolder ? "Mappen er tom" : "Arkivet er tomt"}
                  </h3>
                  <p className="mt-4 max-w-2xl leading-8 text-slate-700">
                    {selectedFolder
                      ? "Denne mappen har ingen saker ennå. Neste steg blir å kunne opprette saker direkte i valgt mappe."
                      : "Opprett en mappe eller en sak for å komme i gang."}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {!selectedFolder ? (
                      <Link
                        href={
                          selectedFolderId
                            ? `/min-side/mapper/ny?parentFolderId=${selectedFolderId}`
                            : "/min-side/mapper/ny"
                        }
                        className="rounded-xl bg-cyan-500 px-5 py-4 text-sm font-black text-slate-950 hover:bg-cyan-400"
                      >
                        {selectedFolderId ? "+ Ny mappe her" : "+ Ny mappe"}
                      </Link>
                    ) : null}

                    <Link
                      href="/min-side/saker/ny"
                      className="rounded-xl border border-slate-300 bg-white px-5 py-4 text-sm font-black text-slate-950 hover:bg-slate-100"
                    >
                      + Ny sak
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <div className="hidden grid-cols-[1fr_120px_130px_120px_100px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500 md:grid">
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
                  <div className="text-right">Handling</div>
                </div>

                <div className="divide-y divide-slate-200">
                  {archiveItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-3 px-5 py-4 transition hover:bg-cyan-50 md:grid-cols-[1fr_120px_130px_120px_100px] md:items-center"
                    >
                      {item.type === "Mappe" ? (
                        <button
                          type="button"
                          onClick={() => setSelectedFolderId(item.folderId ?? null)}
                          className="flex min-w-0 items-start gap-3 text-left"
                        >
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
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          className="flex min-w-0 items-start gap-3"
                        >
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
                        </Link>
                      )}

                      <div className="text-sm font-bold text-slate-600">
                        {item.type}
                      </div>

                      <div className="text-sm font-bold text-slate-600">
                        {item.status}
                      </div>

                      <div className="text-sm font-semibold text-slate-500">
                        {item.date}
                      </div>

                      <div className="flex justify-start md:justify-end">
                        <button
                          type="button"
                          onClick={() => moveToTrash(item)}
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50"
                        >
                          Slett
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="grid gap-6">
            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Siste aktivitet
              </p>

              {activityItems.length === 0 ? (
                <p className="mt-4 leading-8 text-slate-300">
                  Aktivitet vises her når du har opprettet din første sak eller
                  mappe.
                </p>
              ) : (
                <div className="mt-5 grid gap-3">
                  {activityItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
                    >
                      <p className="font-black text-white">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-300">
                        {item.description}
                      </p>
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                        {formatActivityDate(item.created_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Arkivvisning
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Lett å skalere
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                Denne visningen er lettere enn store kort og passer bedre når
                en advokat, rådgiver eller journalist har mange mapper og saker.
              </p>
            </div>
          </aside>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}

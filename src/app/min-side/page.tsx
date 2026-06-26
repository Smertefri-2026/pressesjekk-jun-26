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
  deleted_at: string | null;
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
  report_type:
    | "free_check"
    | "full_report"
    | "pfu_draft"
    | "police_draft"
    | "investigation_draft";
  created_at: string;
};

type ProfileRow = {
  full_name: string | null;
  role_type: string | null;
  is_admin: boolean | null;
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
  currentFolderId?: string | null;
  currentParentFolderId?: string | null;
};

type SortKey = "name" | "type" | "status" | "date";
type ArchiveMode = "active" | "trash";
type ViewMode = "list" | "grid";

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

function folderTypeForRole(roleType: string | null) {
  if (roleType === "lawyer" || roleType === "advisor") return "client_case";
  if (roleType === "journalist") return "publication_case";
  if (roleType === "organization") return "organization_case";
  return "media_case";
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
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [caseCount, setCaseCount] = useState(0);
  const [folderCount, setFolderCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [pfuDraftCount, setPfuDraftCount] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("pressesjekkSelectedFolderId");
  });
  const [archiveMode, setArchiveMode] = useState<ArchiveMode>("active");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "list";

    const savedViewMode = localStorage.getItem("pressesjekkArchiveViewMode");

    return savedViewMode === "grid" ? "grid" : "list";
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
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

      const [
        casesResult,
        foldersResult,
        reportsResult,
        pfuDraftCountResult,
        profileResult,
      ] = await Promise.all([
          supabase
            .from("cases")
            .select(
              "id,folder_id,title,status,media_name,article_title,published_date,created_at,deleted_at",
              { count: "exact" }
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(100),

          supabase
            .from("case_folders")
            .select("id,parent_folder_id,title,folder_type,status,created_at,deleted_at", {
              count: "exact",
            })
            .eq("user_id", user.id)
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

          supabase
            .from("profiles")
            .select("full_name,role_type,is_admin")
            .eq("id", user.id)
            .maybeSingle(),
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
      const caseIds = new Set(caseRows.map((caseItem) => caseItem.id));
      const reportRows = ((reportsResult.data ?? []) as ReportRow[]).filter(
        (report) => caseIds.has(report.case_id)
      );

      setCases(caseRows);
      setFolders(folderRows);
      setReports(reportRows);

      if (!profileResult.error) {
        setProfile((profileResult.data ?? null) as ProfileRow | null);
      }
      setCaseCount(caseRows.filter((caseItem) => !caseItem.deleted_at).length);
      setFolderCount(folderRows.filter((folder) => !folder.deleted_at).length);
      setReportCount(reportRows.length);
      setPfuDraftCount(
        reportRows.filter((report) => report.report_type === "pfu_draft").length
      );

      setIsLoading(false);
    }

    loadDashboard();
  }, []);

  const selectedFolder = useMemo(() => {
    if (!selectedFolderId) return null;
    return (
      folders.find(
        (folder) => folder.id === selectedFolderId && !folder.deleted_at
      ) ?? null
    );
  }, [folders, selectedFolderId]);

  const newCaseHref = selectedFolderId
    ? `/min-side/saker/ny?folderId=${selectedFolderId}`
    : "/min-side/saker/ny";

  const newCaseLabel = selectedFolderId ? "+ Ny sak her" : "+ Ny sak";

  const activeFolders = folders.filter((folder) => !folder.deleted_at);

  const archiveItems = useMemo<ArchiveItem[]>(() => {
    const folderItems: ArchiveItem[] = folders
      .filter((folder) => {
        if (archiveMode === "trash") return Boolean(folder.deleted_at);

        if (folder.deleted_at) return false;

        return selectedFolderId
          ? folder.parent_folder_id === selectedFolderId
          : !folder.parent_folder_id;
      })
      .map((folder) => ({
        id: `folder-${folder.id}`,
        rawId: folder.id,
        icon: "📁",
        name: folder.title,
        subtitle:
          archiveMode === "trash"
            ? "Slettet mappe"
            : selectedFolderId
              ? "Undermappe"
              : "Saksmappe",
        type: "Mappe",
        status: folderStatusLabel(folder.status),
        date: formatDate(folder.deleted_at ?? folder.created_at),
        href: "#",
        folderId: folder.id,
        currentParentFolderId: folder.parent_folder_id,
      }));

    const caseItems: ArchiveItem[] = cases
      .filter((caseItem) => {
        if (archiveMode === "trash") return Boolean(caseItem.deleted_at);

        if (caseItem.deleted_at) return false;

        return selectedFolderId
          ? caseItem.folder_id === selectedFolderId
          : !caseItem.folder_id;
      })
      .map((caseItem) => ({
        id: `case-${caseItem.id}`,
        rawId: caseItem.id,
        icon: "📄",
        name: caseItem.title,
        subtitle:
          archiveMode === "trash"
            ? caseItem.media_name
              ? `Slettet sak · ${caseItem.media_name}`
              : "Slettet sak"
            : caseItem.media_name ?? "Ukjent medie",
        type: "Sak",
        status:
          archiveMode === "trash" ? "Papirkurv" : statusLabel(caseItem.status),
        date: formatDate(caseItem.deleted_at ?? caseItem.created_at),
        href: `/min-side/saker/${caseItem.id}`,
        currentFolderId: caseItem.folder_id,
      }));

    return [...folderItems, ...caseItems].sort((a, b) => {
      const valueA = a[sortKey].toLowerCase();
      const valueB = b[sortKey].toLowerCase();

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [archiveMode, cases, folders, selectedFolderId, sortDirection, sortKey]);

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

  async function moveFolderToFolder(folderId: string, parentFolderId: string | null) {
    setErrorMessage("");

    if (folderId === parentFolderId) {
      setErrorMessage("En mappe kan ikke flyttes inn i seg selv.");
      return;
    }

    const selectedParent = parentFolderId
      ? folders.find((folder) => folder.id === parentFolderId)
      : null;

    if (selectedParent?.parent_folder_id === folderId) {
      setErrorMessage(
        "En mappe kan ikke flyttes inn i sin egen undermappe."
      );
      return;
    }

    const { error } = await supabase
      .from("case_folders")
      .update({
        parent_folder_id: parentFolderId,
      })
      .eq("id", folderId);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setFolders((current) =>
      current.map((folder) =>
        folder.id === folderId
          ? { ...folder, parent_folder_id: parentFolderId }
          : folder
      )
    );
  }

  async function moveCaseToFolder(caseId: string, folderId: string | null) {
    setErrorMessage("");

    const { error } = await supabase
      .from("cases")
      .update({
        folder_id: folderId,
      })
      .eq("id", caseId);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setCases((current) =>
      current.map((caseItem) =>
        caseItem.id === caseId ? { ...caseItem, folder_id: folderId } : caseItem
      )
    );
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
        current.map((folder) =>
          folder.id === item.rawId
            ? {
                ...folder,
                status: "trashed",
                deleted_at: new Date().toISOString(),
              }
            : folder
        )
      );
      setFolderCount((current) => Math.max(0, current - 1));

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

    setCases((current) =>
      current.map((caseItem) =>
        caseItem.id === item.rawId
          ? { ...caseItem, deleted_at: new Date().toISOString() }
          : caseItem
      )
    );
    setCaseCount((current) => Math.max(0, current - 1));
  }

  const activityItems: ActivityItem[] = [
    ...reports.map((report) => {
      const linkedCase = cases.find((caseItem) => caseItem.id === report.case_id);

      return {
        id: `report-${report.id}`,
        title:
          report.report_type === "pfu_draft"
            ? `PFU-klage v${report.version} lagret`
            : report.report_type === "police_draft"
              ? `Politianmeldelse v${report.version} lagret`
              : report.report_type === "investigation_draft"
                ? `Utredning v${report.version} lagret`
                : `Rapport v${report.version} lagret`,
        description: linkedCase
          ? linkedCase.title
          : "Rapportutkast lagret på en sak",
        created_at: report.created_at,
        href:
          report.report_type === "pfu_draft"
            ? `/min-side/saker/${report.case_id}/pfu`
            : report.report_type === "police_draft"
              ? `/min-side/saker/${report.case_id}/politianmeldelse`
              : report.report_type === "investigation_draft"
                ? `/min-side/saker/${report.case_id}/utredning`
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
      href: "#",
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);


  async function createFolder() {
    if (!user) {
      setErrorMessage("Du må være innlogget for å opprette mapper.");
      return;
    }

    const folderTitle = window.prompt(
      selectedFolder
        ? `Navn på ny undermappe i «${selectedFolder.title}»:`
        : "Navn på ny mappe:"
    );

    if (!folderTitle?.trim()) {
      return;
    }

    setIsCreatingFolder(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("case_folders")
      .insert({
        user_id: user.id,
        title: folderTitle.trim(),
        folder_type:
          selectedFolder?.folder_type ?? folderTypeForRole(profile?.role_type ?? null),
        parent_folder_id: selectedFolderId || null,
        status: "active",
      })
      .select("id,parent_folder_id,title,folder_type,status,created_at,deleted_at")
      .single();

    if (error) {
      setErrorMessage(error.message);
      setIsCreatingFolder(false);
      return;
    }

    const newFolder = data as CaseFolderRow;

    setFolders((current) => [newFolder, ...current]);
    setFolderCount((current) => current + 1);
    setIsCreatingFolder(false);
  }

  async function restoreFromTrash(item: ArchiveItem) {
    setErrorMessage("");

    if (item.type === "Mappe") {
      const { error } = await supabase
        .from("case_folders")
        .update({
          status: "active",
          deleted_at: null,
        })
        .eq("id", item.rawId);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setFolders((current) =>
        current.map((folder) =>
          folder.id === item.rawId
            ? { ...folder, status: "active", deleted_at: null }
            : folder
        )
      );

      setFolderCount((current) => current + 1);
      return;
    }

    const { error } = await supabase
      .from("cases")
      .update({
        deleted_at: null,
      })
      .eq("id", item.rawId);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setCases((current) =>
      current.map((caseItem) =>
        caseItem.id === item.rawId ? { ...caseItem, deleted_at: null } : caseItem
      )
    );
    setCaseCount((current) => current + 1);
  }


  async function permanentlyDeleteItem(item: ArchiveItem) {
    const confirmation = window.prompt(
      `Dette kan ikke angres. Skriv SLETT for å slette "${item.name}" permanent.`
    );

    if (confirmation !== "SLETT") return;

    setErrorMessage("");

    if (item.type === "Mappe") {
      const hasChildFolders = folders.some(
        (folder) => folder.parent_folder_id === item.rawId
      );

      const hasCases = cases.some((caseItem) => caseItem.folder_id === item.rawId);

      if (hasChildFolders || hasCases) {
        setErrorMessage(
          "Mappen kan ikke slettes permanent fordi den inneholder undermapper eller saker. Flytt eller slett innholdet først."
        );
        return;
      }

      const { error } = await supabase
        .from("case_folders")
        .delete()
        .eq("id", item.rawId);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setFolders((current) =>
        current.filter((folder) => folder.id !== item.rawId)
      );

      return;
    }

    const { error: pfuError } = await supabase
      .from("pfu_decisions")
      .delete()
      .eq("case_id", item.rawId);

    if (pfuError) {
      setErrorMessage(pfuError.message);
      return;
    }

    const { error: reportsError } = await supabase
      .from("case_reports")
      .delete()
      .eq("case_id", item.rawId);

    if (reportsError) {
      setErrorMessage(reportsError.message);
      return;
    }

    const { error: inputsError } = await supabase
      .from("case_inputs")
      .delete()
      .eq("case_id", item.rawId);

    if (inputsError) {
      setErrorMessage(inputsError.message);
      return;
    }

    const { error: caseError } = await supabase
      .from("cases")
      .delete()
      .eq("id", item.rawId);

    if (caseError) {
      setErrorMessage(caseError.message);
      return;
    }

    setCases((current) =>
      current.filter((caseItem) => caseItem.id !== item.rawId)
    );
  }

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
              Min Side
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Her administrerer du mediesakene dine. Du kan opprette saker,
              samle dokumentasjon, lage rapporter, PFU-klager,
              politianmeldelser og utredninger, og organisere alt i mapper.
            </p>
          </section>

          <aside className="hidden rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7 lg:block">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Konto
            </p>

            <h2 className="mt-4 text-3xl font-black text-slate-950">
              {profile?.full_name?.trim() || "Din profil"}
            </h2>

            {user?.email ? (
              <p className="mt-4 break-words text-sm font-semibold leading-6 text-slate-600">
                Innlogget som:{" "}
                <span className="text-slate-950">{user.email}</span>
              </p>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Link
                href="/min-side/profil"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
              >
                Profil
              </Link>

              {profile?.is_admin ? (
                <Link
                  href="/admin"
                  className="rounded-xl border border-cyan-300 bg-cyan-100 px-5 py-3 text-center text-sm font-black text-cyan-950 hover:bg-cyan-200"
                >
                  Admin
                </Link>
              ) : null}

              <SignOutButton />
            </div>
          </aside>
        </div>

        <section
          className="mt-14 hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-5"
          id="oversikt"
        >
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="font-bold text-slate-500">Tilgang / pakker</p>
            <p className="mt-4 text-3xl font-black text-cyan-700">Kommer</p>
            <p className="mt-3 text-sm font-semibold text-slate-500">
              Kobles til Stripe senere
            </p>
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
            <p className="font-bold text-slate-500">PFU-klage</p>
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
                  {archiveMode === "trash"
                    ? "Papirkurv"
                    : selectedFolder
                      ? selectedFolder.title
                      : "Mapper og saker"}
                </h2>

                
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setArchiveMode("active");
                    sessionStorage.removeItem("pressesjekkSelectedFolderId");
                    setSelectedFolderId(null);
                  }}
                  className={`rounded-xl px-5 py-3 text-center text-sm font-black ${
                    archiveMode === "active"
                      ? "bg-slate-950 text-white"
                      : "border border-slate-300 bg-white text-slate-950 hover:bg-slate-100"
                  }`}
                >
                  Saksarkiv
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setArchiveMode("trash");
                    sessionStorage.removeItem("pressesjekkSelectedFolderId");
                    setSelectedFolderId(null);
                  }}
                  className={`rounded-xl px-5 py-3 text-center text-sm font-black ${
                    archiveMode === "trash"
                      ? "bg-slate-950 text-white"
                      : "border border-slate-300 bg-white text-slate-950 hover:bg-slate-100"
                  }`}
                >
                  Papirkurv
                </button>

                {archiveMode === "active" ? (
                  <>
                    <button
                      type="button"
                      onClick={createFolder}
                      disabled={isCreatingFolder}
                      className="rounded-xl bg-cyan-500 px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCreatingFolder
                        ? "Oppretter..."
                        : selectedFolderId
                          ? "+ Ny mappe her"
                          : "+ Ny mappe"}
                    </button>

                    <Link
                      href={newCaseHref}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
                    >
                      {newCaseLabel}
                    </Link>
                  </>
                ) : null}
              </div>
            </div>

            {errorMessage ? (
              <div className="m-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-5">
                {selectedFolder && archiveMode === "active" ? (
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.removeItem("pressesjekkSelectedFolderId");
                      setSelectedFolderId(null);
                    }}
                    className="shrink-0 text-sm font-black text-cyan-700 hover:text-cyan-900"
                  >
                    <span className="sm:hidden">← Tilbake</span>
                    <span className="hidden sm:inline">
                      ← Tilbake til mapper og saker
                    </span>
                  </button>
                ) : null}

                <p className="hidden text-sm font-bold text-slate-500 sm:block">
                  {viewMode === "list" ? "Listevisning" : "Symbolvisning"}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("pressesjekkArchiveViewMode", "list");
                    setViewMode("list");
                  }}
                  className={`rounded-xl px-3 py-2 text-sm font-black sm:px-4 ${
                    viewMode === "list"
                      ? "bg-slate-950 text-white"
                      : "border border-slate-300 bg-white text-slate-950 hover:bg-slate-100"
                  }`}
                >
                  Liste
                </button>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("pressesjekkArchiveViewMode", "grid");
                    setViewMode("grid");
                  }}
                  className={`rounded-xl px-3 py-2 text-sm font-black sm:px-4 ${
                    viewMode === "grid"
                      ? "bg-slate-950 text-white"
                      : "border border-slate-300 bg-white text-slate-950 hover:bg-slate-100"
                  }`}
                >
                  Symboler
                </button>
              </div>
            </div>

            {archiveItems.length === 0 ? (
              <div className="p-6 sm:p-8">
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8">
                  <h3 className="text-2xl font-black text-slate-950">
                    {archiveMode === "trash"
                      ? "Papirkurven er tom"
                      : selectedFolder
                        ? "Mappen er tom"
                        : "Arkivet er tomt"}
                  </h3>
                  <p className="mt-4 max-w-2xl leading-8 text-slate-700">
                    {archiveMode === "trash"
                      ? "Slettede mapper og saker vises her. Når papirkurven er tom, er det ingenting å gjenopprette."
                      : selectedFolder
                        ? "Denne mappen har ingen saker ennå. Opprett en sak eller en undermappe direkte her."
                        : "Opprett en sak for å komme i gang. Mapper kan brukes senere dersom du vil organisere flere saker."}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {!selectedFolder && archiveMode === "active" ? (
                      <button
                        type="button"
                        onClick={createFolder}
                        disabled={isCreatingFolder}
                        className="rounded-xl bg-cyan-500 px-5 py-4 text-sm font-black text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isCreatingFolder
                          ? "Oppretter..."
                          : selectedFolderId
                            ? "+ Ny mappe her"
                            : "+ Ny mappe"}
                      </button>
                    ) : null}

                    <Link
                      href={
                        selectedFolderId
                          ? `/min-side/saker/ny?folderId=${selectedFolderId}`
                          : "/min-side/saker/ny"
                      }
                      className="rounded-xl border border-slate-300 bg-white px-5 py-4 text-sm font-black text-slate-950 hover:bg-slate-100"
                    >
                      {selectedFolderId ? "+ Ny sak her" : "+ Ny sak"}
                    </Link>
                  </div>
                </div>
              </div>
            ) : viewMode === "grid" ? (
              <div className="p-5">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {archiveItems.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-cyan-50 hover:shadow-md"
                    >
                      {item.type === "Mappe" ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (item.folderId) {
                              sessionStorage.setItem(
                                "pressesjekkSelectedFolderId",
                                item.folderId
                              );
                            }
                            setSelectedFolderId(item.folderId ?? null);
                          }}
                          className="flex w-full items-start gap-4 text-left"
                        >
                          <span className="text-4xl leading-none">
                            {item.icon}
                          </span>
                          <div className="min-w-0">
                            <h3 className="truncate text-xl font-black text-slate-950">
                              {item.name}
                            </h3>
                            <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                              {item.subtitle}
                            </p>
                          </div>
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          className="flex w-full items-start gap-4"
                        >
                          <span className="text-4xl leading-none">
                            {item.icon}
                          </span>
                          <div className="min-w-0">
                            <h3 className="truncate text-xl font-black text-slate-950">
                              {item.name}
                            </h3>
                            <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                              {item.subtitle}
                            </p>
                          </div>
                        </Link>
                      )}

                      <div className="mt-4 grid gap-3">
                        {archiveMode === "trash" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => restoreFromTrash(item)}
                              className="rounded-xl border border-cyan-200 bg-white px-4 py-3 text-sm font-black text-cyan-700 hover:bg-cyan-50"
                            >
                              Gjenopprett
                            </button>

                            <button
                              type="button"
                              onClick={() => permanentlyDeleteItem(item)}
                              className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-black text-red-800 hover:bg-red-100"
                            >
                              Slett permanent
                            </button>
                          </>
                        ) : (
                          <>
                            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                              Flytt til
                            </label>

                            {item.type === "Sak" ? (
                              <select
                                value={item.currentFolderId ?? ""}
                                onChange={(event) =>
                                  moveCaseToFolder(
                                    item.rawId,
                                    event.target.value || null
                                  )
                                }
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-black text-slate-700 outline-none hover:bg-slate-50"
                              >
                                <option value="">Min Side</option>
                                {activeFolders.map((folder) => (
                                  <option key={folder.id} value={folder.id}>
                                    {folder.title}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <select
                                value={item.currentParentFolderId ?? ""}
                                onChange={(event) =>
                                  moveFolderToFolder(
                                    item.rawId,
                                    event.target.value || null
                                  )
                                }
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-black text-slate-700 outline-none hover:bg-slate-50"
                              >
                                <option value="">Min Side</option>
                                {activeFolders
                                  .filter((folder) => folder.id !== item.rawId)
                                  .map((folder) => (
                                    <option key={folder.id} value={folder.id}>
                                      {folder.title}
                                    </option>
                                  ))}
                              </select>
                            )}

                            <button
                              type="button"
                              onClick={() => moveToTrash(item)}
                              className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-700 hover:bg-red-50"
                            >
                              Papirkurv
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <div className="grid grid-cols-[minmax(0,1fr)_116px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500 md:hidden">
                  <div className="pl-12">Navn</div>
                  <div className="text-right">Flytt / Handling</div>
                </div>
                <div className="hidden grid-cols-[1fr_110px_120px_120px_230px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500 md:grid">
                  <button
                    type="button"
                    onClick={() => handleSort("name")}
                    className="pl-12 text-left hover:text-cyan-700"
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
                  <div className="text-right">Flytt / Handling</div>
                </div>

                <div className="divide-y divide-slate-200">
                  {archiveItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[minmax(0,1fr)_116px] gap-3 px-5 py-4 transition hover:bg-cyan-50 md:grid-cols-[1fr_110px_120px_120px_230px] md:items-center"
                    >
                      {item.type === "Mappe" ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (item.folderId) {
                              sessionStorage.setItem("pressesjekkSelectedFolderId", item.folderId);
                            }
                            setSelectedFolderId(item.folderId ?? null);
                          }}
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

                      <div className="hidden text-sm font-bold text-slate-600 md:block">
                        {item.type}
                      </div>

                      <div className="hidden text-sm font-bold text-slate-600 md:block">
                        {item.status}
                      </div>

                      <div className="hidden text-sm font-semibold text-slate-500 md:block">
                        {item.date}
                      </div>

                      <div className="flex flex-col items-end gap-2 md:flex-row md:flex-wrap md:justify-end">
                        {archiveMode === "trash" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => restoreFromTrash(item)}
                              className="rounded-lg border border-cyan-200 bg-white px-3 py-2 text-xs font-black text-cyan-700 hover:bg-cyan-50"
                            >
                              Gjenopprett
                            </button>

                            <button
                              type="button"
                              onClick={() => permanentlyDeleteItem(item)}
                              className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-black text-red-800 hover:bg-red-100"
                            >
                              Slett permanent
                            </button>
                          </>
                        ) : (
                          <>
                            {item.type === "Sak" ? (
                              <select
                                value={item.currentFolderId ?? ""}
                                onChange={(event) =>
                                  moveCaseToFolder(
                                    item.rawId,
                                    event.target.value || null
                                  )
                                }
                                className="w-[108px] rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-black text-slate-700 outline-none hover:bg-slate-50 md:w-auto md:max-w-[140px]"
                              >
                                <option value="">Min Side</option>
                                {activeFolders.map((folder) => (
                                  <option key={folder.id} value={folder.id}>
                                    {folder.title}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <select
                                value={item.currentParentFolderId ?? ""}
                                onChange={(event) =>
                                  moveFolderToFolder(
                                    item.rawId,
                                    event.target.value || null
                                  )
                                }
                                className="w-[108px] rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-black text-slate-700 outline-none hover:bg-slate-50 md:w-auto md:max-w-[140px]"
                              >
                                <option value="">Min Side</option>
                                {activeFolders
                                  .filter((folder) => folder.id !== item.rawId)
                                  .map((folder) => (
                                    <option key={folder.id} value={folder.id}>
                                      {folder.title}
                                    </option>
                                  ))}
                              </select>
                            )}

                            <button
                              type="button"
                              onClick={() => moveToTrash(item)}
                              className="text-xs font-black text-red-700 underline-offset-4 hover:underline"
                            >
                              Slett
                            </button>
                          </>
                        )}
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
                  Aktivitet vises her når du har opprettet din første sak,
                  rapport, PFU-klage, politianmeldelse eller utredning.
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

          </aside>
        </section>
        <section className="mt-8 lg:hidden">
          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Konto
            </p>

            <h2 className="mt-4 text-3xl font-black text-slate-950">
              {profile?.full_name?.trim() || "Din profil"}
            </h2>

            {user?.email ? (
              <p className="mt-4 break-words text-sm font-semibold leading-6 text-slate-600">
                Innlogget som:{" "}
                <span className="text-slate-950">{user.email}</span>
              </p>
            ) : null}

            <div className="mt-6 grid gap-3">
              <Link
                href="/min-side/profil"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
              >
                Profil
              </Link>

              <SignOutButton />
            </div>
          </aside>
        </section>

      </section>

      <LightPublicFooter />
    </main>
  );
}

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

type CaseAccessRow = {
  case_id: string;
  package_id: string;
  status: "active" | "pending" | "cancelled" | "expired";
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
  packageSortValue?: string;
  date: string;
  dateRaw?: string;
  href: string;
  folderId?: string;
  currentFolderId?: string | null;
  currentParentFolderId?: string | null;
  packageId?: string | null;
  packageLabel?: string;
  packageActionLabel?: string;
};

type SortKey = "name" | "type" | "package" | "status" | "date";
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

function packageLabel(packageId: string | null | undefined) {
  if (packageId === "report_pack") return "Rapportpakke";
  if (packageId === "pfu_pack") return "PFU-pakke";
  if (packageId === "full_pack") return "Full dokumentpakke";
  if (packageId === "investigation_pack") return "Utredningspakke";
  if (packageId === "case_bundle_3") return "3 saker";
  if (packageId === "case_bundle_5") return "5 saker";
  if (packageId === "case_bundle_10") return "10 saker";
  if (packageId === "monthly_start") return "Månedsavtale Start";
  if (packageId === "monthly_pro") return "Månedsavtale Pro";
  if (packageId === "monthly_agency") return "Månedsavtale Byrå";
  return "Ingen pakke";
}

function packageActionLabel(packageId: string | null | undefined) {
  if (!packageId) return "Velg pakke";
  if (packageId === "report_pack" || packageId === "pfu_pack") return "Oppgrader";
  return "Se pakke";
}

export default function MinSidePage() {
  const [user, setUser] = useState<User | null>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [folders, setFolders] = useState<CaseFolderRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [caseAccess, setCaseAccess] = useState<CaseAccessRow[]>([]);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [caseCount, setCaseCount] = useState(0);
  const [folderCount, setFolderCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [pfuDraftCount, setPfuDraftCount] = useState(0);
  const [policeDraftCount, setPoliceDraftCount] = useState(0);
  const [investigationDraftCount, setInvestigationDraftCount] = useState(0);
  const [activePackageCount, setActivePackageCount] = useState(0);
  const [availableCaseCount, setAvailableCaseCount] = useState(0);
  const [activePackageCaseId, setActivePackageCaseId] = useState<string | null>(
    null
  );
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

      const activeAccessRows =
        caseRows.length > 0
          ? await supabase
              .from("case_access")
              .select("case_id,package_id,status")
              .in(
                "case_id",
                caseRows.map((caseItem) => caseItem.id)
              )
              .eq("status", "active")
          : { data: [], error: null };

      const entitlementRows = await supabase
        .from("user_case_entitlements")
        .select("included_cases,used_cases,expires_at,status")
        .eq("user_id", user.id)
        .eq("status", "active");

      const accessRows = ((activeAccessRows.data ?? []) as CaseAccessRow[]).filter(
        (access) => access.status === "active"
      );

      const availableCases = (entitlementRows.data ?? []).reduce(
        (sum, entitlement) => {
          const includedCases = Number(entitlement.included_cases ?? 0);
          const usedCases = Number(entitlement.used_cases ?? 0);
          const expiresAt = entitlement.expires_at
            ? new Date(entitlement.expires_at).getTime()
            : null;

          if (expiresAt && expiresAt <= Date.now()) {
            return sum;
          }

          return sum + Math.max(0, includedCases - usedCases);
        },
        0
      );

      setCases(caseRows);
      setFolders(folderRows);
      setReports(reportRows);
      setCaseAccess(accessRows);
      setActivePackageCount(accessRows.length);
      setAvailableCaseCount(availableCases);
      setActivePackageCaseId(accessRows[0]?.case_id ?? null);

      if (!profileResult.error) {
        setProfile((profileResult.data ?? null) as ProfileRow | null);
      }
      setCaseCount(caseRows.filter((caseItem) => !caseItem.deleted_at).length);
      setFolderCount(folderRows.filter((folder) => !folder.deleted_at).length);
      setReportCount(
        reportRows.filter(
          (report) =>
            report.report_type === "free_check" ||
            report.report_type === "full_report"
        ).length
      );
      setPfuDraftCount(
        reportRows.filter((report) => report.report_type === "pfu_draft").length
      );
      setPoliceDraftCount(
        reportRows.filter((report) => report.report_type === "police_draft")
          .length
      );
      setInvestigationDraftCount(
        reportRows.filter(
          (report) => report.report_type === "investigation_draft"
        ).length
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
  const firstActiveCase = cases.find((caseItem) => !caseItem.deleted_at);
  const packageCaseId = activePackageCaseId ?? firstActiveCase?.id ?? null;
  const packageHref = packageCaseId
    ? `/min-side/saker/${packageCaseId}/pakke`
    : availableCaseCount > 0
      ? "/min-side/saker/ny"
      : "/priser";
  const packageStatusLabel =
    availableCaseCount > 0
      ? `${availableCaseCount} ledige`
      : activePackageCount === 0
        ? "Ingen aktive"
        : activePackageCount === 1
          ? "1 aktiv"
          : `${activePackageCount} aktive`;
  const packageCtaLabel =
    availableCaseCount > 0
      ? activePackageCount > 0
        ? `${activePackageCount} aktiv sak`
        : "Opprett ny sak"
      : activePackageCount > 0
        ? "Se pakker og betaling"
        : firstActiveCase
          ? "Velg pakke"
          : "Kjøp pakke";

  const caseAccessByCaseId = useMemo(() => {
    return new Map(caseAccess.map((access) => [access.case_id, access]));
  }, [caseAccess]);

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
        packageSortValue: "",
        date: formatDate(folder.deleted_at ?? folder.created_at),
        dateRaw: folder.deleted_at ?? folder.created_at,
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
      .map((caseItem) => {
        const access = caseAccessByCaseId.get(caseItem.id);
        const currentPackageId = access?.package_id ?? null;

        return {
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
          dateRaw: caseItem.deleted_at ?? caseItem.created_at,
          href: `/min-side/saker/${caseItem.id}`,
          currentFolderId: caseItem.folder_id,
          packageId: currentPackageId,
          packageLabel: packageLabel(currentPackageId),
          packageSortValue: packageLabel(currentPackageId),
          packageActionLabel: packageActionLabel(currentPackageId),
        };
      });

    return [...folderItems, ...caseItems].sort((a, b) => {
      if (sortKey === "date") {
        const valueA = new Date(a.dateRaw ?? a.date).getTime();
        const valueB = new Date(b.dateRaw ?? b.date).getTime();

        if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
        if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      }

      const valueA =
        sortKey === "package"
          ? (a.packageSortValue ?? "")
          : String(a[sortKey] ?? "");
      const valueB =
        sortKey === "package"
          ? (b.packageSortValue ?? "")
          : String(b[sortKey] ?? "");

      const comparison = valueA
        .toLowerCase()
        .localeCompare(valueB.toLowerCase(), "nb-NO");

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [
    archiveMode,
    caseAccessByCaseId,
    cases,
    folders,
    selectedFolderId,
    sortDirection,
    sortKey,
  ]);

  function handleSort(nextSortKey: SortKey) {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(nextSortKey === "date" ? "desc" : "asc");
  }

  function sortButtonLabel(key: SortKey, label: string) {
    return `${label}${sortLabel(key)}`;
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

  const isJournalistWorkflow = profile?.role_type === "journalist";

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
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-700">
              Dashboard
            </p>

            <h1 className="mt-4 max-w-4xl [text-wrap:balance] text-4xl font-black sm:text-5xl tracking-tight text-slate-950 md:text-7xl">
              Min Side
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              {isJournalistWorkflow
                ? "Her administrerer du redaksjonelle saker. Du kan opprette saker, samle publiseringsgrunnlag, dokumentasjon og kilder, lage redaksjonelle rapporter og organisere alt i mapper."
                : "Her administrerer du mediesakene dine. Du kan opprette saker, samle dokumentasjon, lage rapporter, PFU-klager, politianmeldelser og utredninger, og organisere alt i mapper."}
            </p>
          </section>

          <aside className="hidden rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm sm:p-7 lg:block">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-800">
              Konto
            </p>

            <h2 className="mt-4 text-3xl font-black text-slate-950">
              {profile?.full_name?.trim() || "Din profil"}
            </h2>

            {user?.email ? (
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
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
                  className="rounded-xl border border-red-300 bg-red-100 px-5 py-3 text-center text-sm font-black text-red-950 hover:bg-red-100"
                >
                  Admin
                </Link>
              ) : null}

              <SignOutButton />
            </div>
          </aside>
        </div>

        <section className="mt-8 grid grid-cols-2 gap-3 md:hidden">
          <Link
            href={packageHref}
            className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-xs font-bold text-red-800">Tilgang / pakker</p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {packageStatusLabel}
            </p>
            <p className="mt-2 text-[11px] font-semibold leading-5 text-red-800">
              {packageCtaLabel}
            </p>
          </Link>

          <Link
            href="/min-side/kjop"
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-xs font-bold text-red-800">Kjøpshistorikk</p>
            <p className="mt-3 text-3xl font-black text-slate-950">
              Kjøp
            </p>
            <p className="mt-2 text-[11px] font-semibold leading-5 text-red-700">
              Betalinger og kvitteringer
            </p>
          </Link>

          {reportCount > 0 ? (
            <Link
              href="/min-side/rapporter"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-xs font-bold text-slate-500">Rapporter</p>
              <p className="mt-3 text-3xl font-black text-slate-950">
                {reportCount}
              </p>
              <p className="mt-2 text-[11px] font-semibold leading-5 text-red-700">
                Se rapporter
              </p>
            </Link>
          ) : null}

          {pfuDraftCount > 0 ? (
            <Link
              href="/min-side/pfu-klager"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-xs font-bold text-slate-500">PFU-klager</p>
              <p className="mt-3 text-3xl font-black text-slate-950">
                {pfuDraftCount}
              </p>
              <p className="mt-2 text-[11px] font-semibold leading-5 text-red-700">
                Se PFU-klager
              </p>
            </Link>
          ) : null}

          {policeDraftCount > 0 ? (
            <Link
              href="/min-side/politianmeldelser"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-xs font-bold text-slate-500">Politianmeldelser</p>
              <p className="mt-3 text-3xl font-black text-slate-950">
                {policeDraftCount}
              </p>
              <p className="mt-2 text-[11px] font-semibold leading-5 text-red-700">
                Se anmeldelser
              </p>
            </Link>
          ) : null}

          {investigationDraftCount > 0 ? (
            <Link
              href="/min-side/utredninger"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-xs font-bold text-slate-500">Utredninger</p>
              <p className="mt-3 text-3xl font-black text-slate-950">
                {investigationDraftCount}
              </p>
              <p className="mt-2 text-[11px] font-semibold leading-5 text-red-700">
                Se utredninger
              </p>
            </Link>
          ) : null}
        </section>

        <section
          className="mt-14 hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-6"
          id="oversikt"
        >
          <Link
            href={packageHref}
            className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="font-bold text-red-800">Tilgang / pakker</p>
            <p className="mt-4 text-3xl font-black text-slate-950">
              {packageStatusLabel}
            </p>
            <p className="mt-3 text-sm font-semibold text-red-800">
              {packageCtaLabel}
            </p>
          </Link>

          <Link
            href="/min-side/kjop"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="font-bold text-red-800">Kjøpshistorikk</p>
            <p className="mt-4 text-3xl font-black text-slate-950">
              Kjøp
            </p>
            <p className="mt-3 text-sm font-semibold text-red-700">
              Betalinger og kvitteringer
            </p>
          </Link>

          {reportCount > 0 ? (
            <Link
              href="/min-side/rapporter"
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="font-bold text-slate-500">Rapporter</p>
              <p className="mt-4 [text-wrap:balance] text-4xl font-black sm:text-5xl text-slate-950">
                {reportCount}
              </p>
              <p className="mt-3 text-sm font-semibold text-red-700">
                Se rapporter
              </p>
            </Link>
          ) : null}

          {pfuDraftCount > 0 ? (
            <Link
              href="/min-side/pfu-klager"
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="font-bold text-slate-500">PFU-klager</p>
              <p className="mt-4 [text-wrap:balance] text-4xl font-black sm:text-5xl text-slate-950">
                {pfuDraftCount}
              </p>
              <p className="mt-3 text-sm font-semibold text-red-700">
                Se PFU-klager
              </p>
            </Link>
          ) : null}

          {policeDraftCount > 0 ? (
            <Link
              href="/min-side/politianmeldelser"
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="font-bold text-slate-500">Politianmeldelser</p>
              <p className="mt-4 [text-wrap:balance] text-4xl font-black sm:text-5xl text-slate-950">
                {policeDraftCount}
              </p>
              <p className="mt-3 text-sm font-semibold text-red-700">
                Se politianmeldelser
              </p>
            </Link>
          ) : null}

          {investigationDraftCount > 0 ? (
            <Link
              href="/min-side/utredninger"
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="font-bold text-slate-500">Utredninger</p>
              <p className="mt-4 [text-wrap:balance] text-4xl font-black sm:text-5xl text-slate-950">
                {investigationDraftCount}
              </p>
              <p className="mt-3 text-sm font-semibold text-red-700">
                Se utredninger
              </p>
            </Link>
          ) : null}
        </section>

        <section id="arkiv" className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-0 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
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

              <div className="flex flex-col gap-4 sm:items-end">
                <div className="flex flex-wrap items-center gap-4 text-sm font-black">
                  <button
                    type="button"
                    onClick={() => {
                      setArchiveMode("active");
                      sessionStorage.removeItem("pressesjekkSelectedFolderId");
                      setSelectedFolderId(null);
                    }}
                    className={
                      archiveMode === "active"
                        ? "text-slate-950 underline decoration-red-500 decoration-4 underline-offset-8"
                        : "text-slate-500 hover:text-slate-950"
                    }
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
                    className={
                      archiveMode === "trash"
                        ? "text-slate-950 underline decoration-red-500 decoration-4 underline-offset-8"
                        : "text-slate-500 hover:text-slate-950"
                    }
                  >
                    Papirkurv
                  </button>
                </div>

                {archiveMode === "active" ? (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={createFolder}
                      disabled={isCreatingFolder}
                      className="rounded-xl border border-red-300 bg-red-50 px-5 py-3 text-center text-sm font-black text-red-950 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCreatingFolder
                        ? "Oppretter..."
                        : selectedFolderId
                          ? "+ Ny mappe her"
                          : "+ Ny mappe"}
                    </button>

                    <Link
                      href={newCaseHref}
                      className="rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-black text-white hover:bg-slate-800"
                    >
                      {newCaseLabel}
                    </Link>
                  </div>
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
                    className="shrink-0 text-sm font-black text-red-700"
                  >
                    <span className="sm:hidden">← Tilbake</span>
                    <span className="hidden sm:inline">
                      ← Tilbake til mapper og saker
                    </span>
                  </button>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 text-xs font-black text-slate-500">
                  <span className="mr-1 uppercase tracking-[0.16em]">
                    Sorter:
                  </span>

                  {[
                    ["name", "Navn"],
                    ["type", "Type"],
                    ["package", "Pakke"],
                    ["status", "Status"],
                    ["date", "Dato"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSort(key as SortKey)}
                      className={
                        sortKey === key
                          ? "rounded-full bg-slate-950 px-3 py-1 text-white"
                          : "rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:bg-slate-200"
                      }
                    >
                      {sortButtonLabel(key as SortKey, label)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3 text-sm font-black">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("pressesjekkArchiveViewMode", "list");
                    setViewMode("list");
                  }}
                  className={
                    viewMode === "list"
                      ? "text-slate-950 underline decoration-red-500 decoration-4 underline-offset-8"
                      : "text-slate-500 hover:text-slate-950"
                  }
                >
                  Liste
                </button>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("pressesjekkArchiveViewMode", "grid");
                    setViewMode("grid");
                  }}
                  className={
                    viewMode === "grid"
                      ? "text-slate-950 underline decoration-red-500 decoration-4 underline-offset-8"
                      : "text-slate-500 hover:text-slate-950"
                  }
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
                        className="rounded-xl bg-red-500 px-5 py-4 text-sm font-black text-slate-950 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-red-50 hover:shadow-md"
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
                            {item.type === "Sak" ? (
                              <p className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">
                                {item.packageLabel}
                              </p>
                            ) : null}
                          </div>
                        </Link>
                      )}

                      <div className="mt-4 grid gap-3">
                        {archiveMode === "trash" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => restoreFromTrash(item)}
                              className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-700 hover:bg-red-50"
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

                            {item.type === "Sak" ? (
                              <Link
                                href={`/min-side/saker/${item.rawId}/pakke`}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
                              >
                                {item.packageActionLabel}
                              </Link>
                            ) : null}

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
                <div className="hidden grid-cols-[minmax(0,1fr)_190px_220px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500 md:grid">
                  <div className="pl-12 text-left">
                    Navn
                  </div>
                  <div>Pakke / status</div>
                  <div className="text-right">Flytt / handling</div>
                </div>

                <div className="divide-y divide-slate-200">
                  {archiveItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[minmax(0,1fr)_116px] gap-3 px-5 py-4 transition hover:bg-red-50 md:grid-cols-[minmax(0,1fr)_190px_220px] md:items-center"
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

                      <div className="hidden min-w-0 text-sm font-bold text-slate-600 md:block">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                          {item.type}
                        </p>

                        {item.type === "Sak" ? (
                          <span
                            className={`mt-2 inline-flex max-w-full rounded-full px-3 py-1 text-xs font-black ${
                              item.packageId
                                ? "bg-green-100 text-green-800"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {item.packageLabel}
                          </span>
                        ) : (
                          <span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                            {item.status}
                          </span>
                        )}

                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          {item.date}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 md:items-stretch md:justify-end">
                        {archiveMode === "trash" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => restoreFromTrash(item)}
                              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50"
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
                                className="w-[108px] rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-black text-slate-700 outline-none hover:bg-slate-50 md:w-full"
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
                                className="w-[108px] rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-black text-slate-700 outline-none hover:bg-slate-50 md:w-full"
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

                            {item.type === "Sak" ? (
                              <Link
                                href={`/min-side/saker/${item.rawId}/pakke`}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-xs font-black text-slate-950 hover:bg-slate-100"
                              >
                                {item.packageActionLabel}
                              </Link>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => moveToTrash(item)}
                              className="text-center text-xs font-black text-red-700 underline-offset-4 hover:underline"
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
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-300">
                Siste aktivitet
              </p>

              {activityItems.length === 0 ? (
                <p className="mt-4 leading-8 text-slate-300">
                  {isJournalistWorkflow
                    ? "Aktivitet vises her når du har opprettet din første redaksjonelle sak, lagt inn publiseringsgrunnlag eller laget rapport."
                    : "Aktivitet vises her når du har opprettet din første sak, rapport, PFU-klage, politianmeldelse eller utredning."}
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
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-red-300">
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
          <aside className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-800">
              Konto
            </p>

            <h2 className="mt-4 text-3xl font-black text-slate-950">
              {profile?.full_name?.trim() || "Din profil"}
            </h2>

            {user?.email ? (
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
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

              {profile?.is_admin ? (
                <Link
                  href="/admin"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
                >
                  Admin
                </Link>
              ) : null}

              <SignOutButton />
            </div>
          </aside>
        </section>

      </section>

      <LightPublicFooter />
    </main>
  );
}

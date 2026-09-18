"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";

export type DocumentReportType =
  | "free_check"
  | "full_report"
  | "pfu_draft"
  | "police_draft"
  | "investigation_draft";

type TabDefinition = {
  key: string;
  label: string;
  reportType: DocumentReportType;
  emptyTitle: string;
  emptyText: string;
};

const PAGE_SIZE = 10;

const TABS: TabDefinition[] = [
  {
    key: "enkel",
    label: "Enkel rapport",
    reportType: "free_check",
    emptyTitle: "Ingen enkle rapporter ennå",
    emptyText: "Når du oppretter en enkel rapport i en sak, vises den her.",
  },
  {
    key: "full",
    label: "Full rapport",
    reportType: "full_report",
    emptyTitle: "Ingen fulle rapporter ennå",
    emptyText: "Når du genererer en full rapport i en sak, vises den her.",
  },
  {
    key: "pfu",
    label: "PFU",
    reportType: "pfu_draft",
    emptyTitle: "Ingen PFU-klager ennå",
    emptyText: "Når du genererer et PFU-klageutkast i en sak, vises det her.",
  },
  {
    key: "politi",
    label: "Politianmeldelser",
    reportType: "police_draft",
    emptyTitle: "Ingen politianmeldelser ennå",
    emptyText: "Når du genererer et politianmeldelsesutkast i en sak, vises det her.",
  },
  {
    key: "utredning",
    label: "Utredninger",
    reportType: "investigation_draft",
    emptyTitle: "Ingen utredninger ennå",
    emptyText: "Når du genererer et utredningsutkast i en sak, vises det her.",
  },
];

type ReportRow = {
  id: string;
  case_id: string;
  version: number | null;
  report_type: DocumentReportType;
  status: string | null;
  created_at: string;
  cases:
    | { title: string | null; media_name: string | null; article_title: string | null }
    | { title: string | null; media_name: string | null; article_title: string | null }[]
    | null;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function reportTypeLabel(type: DocumentReportType) {
  if (type === "free_check") return "Enkel rapport";
  if (type === "full_report") return "Full rapport";
  if (type === "pfu_draft") return "PFU-klage";
  if (type === "police_draft") return "Politianmeldelse";
  if (type === "investigation_draft") return "Utredning";
  return type;
}

function relatedCase(report: ReportRow) {
  if (Array.isArray(report.cases)) return report.cases[0] ?? null;
  return report.cases;
}

function caseTitle(report: ReportRow) {
  const item = relatedCase(report);
  return item?.title ?? item?.article_title ?? "Sak uten tittel";
}

function caseSubtitle(report: ReportRow) {
  const item = relatedCase(report);
  const parts = [item?.media_name, item?.article_title].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "PresseSjekk-sak";
}

function documentHref(report: ReportRow) {
  if (report.report_type === "pfu_draft") return `/min-side/saker/${report.case_id}/pfu`;
  if (report.report_type === "police_draft") return `/min-side/saker/${report.case_id}/politianmeldelse`;
  if (report.report_type === "investigation_draft") return `/min-side/saker/${report.case_id}/utredning`;
  return `/min-side/saker/${report.case_id}/full-rapport`;
}

/**
 * Samlet rapportarkiv for /min-side/rapporter. Erstatter fire tidligere
 * separate sider (rapporter/pfu-klager/politianmeldelser/utredninger) med
 * ett sett faner over samme datahenting og rad-mønster - se Fase 6.3.
 */
export function DocumentOverviewPage() {
  const searchParams = useSearchParams();
  const initialTab = TABS.find((tab) => tab.key === searchParams.get("tab"))?.key ?? TABS[0].key;

  const [user, setUser] = useState<User | null>(null);
  const [activeTabKey, setActiveTabKey] = useState(initialTab);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    async function loadDocuments() {
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

      const { data: caseRows, error: caseError } = await supabase
        .from("cases")
        .select("id")
        .eq("user_id", user.id)
        .is("deleted_at", null);

      if (caseError) {
        setErrorMessage(caseError.message);
        setIsLoading(false);
        return;
      }

      const caseIds = (caseRows ?? []).map((caseItem) => caseItem.id);

      if (caseIds.length === 0) {
        setReports([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("case_reports")
        .select("id,case_id,version,report_type,status,created_at,cases(title,media_name,article_title)")
        .in("case_id", caseIds)
        .in(
          "report_type",
          TABS.map((tab) => tab.reportType)
        )
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      setReports((data ?? []) as unknown as ReportRow[]);
      setIsLoading(false);
    }

    loadDocuments();
  }, []);

  const activeTab = TABS.find((tab) => tab.key === activeTabKey) ?? TABS[0];

  const reportsByTab = useMemo(() => {
    const map = new Map<string, ReportRow[]>();
    for (const tab of TABS) {
      map.set(
        tab.key,
        reports.filter((report) => report.report_type === tab.reportType)
      );
    }
    return map;
  }, [reports]);

  const activeReports = reportsByTab.get(activeTab.key) ?? [];
  const visibleReports = activeReports.slice(0, visibleCount);
  const latestReports = activeReports.slice(0, 5);

  function selectTab(key: string) {
    setActiveTabKey(key);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link href="/min-side" className="text-sm font-bold text-red-700">
          ← Tilbake til Min Side
        </Link>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">Rapporter</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              Alle rapporter og utkast
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
              Samlet oversikt over alt som er generert i sakene dine - enkle rapporter, fulle rapporter, PFU-klager, politianmeldelser og utredninger.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/min-side/saker/ny" className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white hover:bg-red-600">
              Ny sak
            </Link>
            {user ? <SignOutButton /> : null}
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 font-semibold text-red-800">{errorMessage}</div>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-2 border-b border-slate-200 pb-1">
          {TABS.map((tab) => {
            const count = reportsByTab.get(tab.key)?.length ?? 0;
            const isActive = tab.key === activeTab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => selectTab(tab.key)}
                className={`rounded-t-xl px-4 py-2.5 text-sm font-bold transition ${
                  isActive
                    ? "border-b-2 border-red-500 bg-white text-slate-950"
                    : "text-slate-500 hover:bg-white hover:text-slate-950"
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        <section className="mt-8 grid gap-6 md:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Totalt i {activeTab.label.toLowerCase()}</p>
            <p className="mt-4 [text-wrap:balance] text-4xl font-black sm:text-5xl text-slate-950">{activeReports.length}</p>
            <p className="mt-3 leading-7 text-slate-600">Dokumenter funnet i dine saker.</p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">Sist opprettet</p>
            {latestReports.length === 0 ? (
              <p className="mt-4 leading-7 text-slate-600">Ingen dokumenter er opprettet ennå.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {latestReports.map((report) => (
                  <Link
                    key={report.id}
                    href={documentHref(report)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-red-50"
                  >
                    <p className="font-black text-slate-950">{caseTitle(report)}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {reportTypeLabel(report.report_type)} v{report.version ?? 1}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">Dokumentliste</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">{activeTab.label}</h2>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            {isLoading ? (
              <div className="bg-slate-50 p-6 text-slate-700">Laster dokumenter...</div>
            ) : activeReports.length === 0 ? (
              <div className="bg-slate-50 p-6">
                <h3 className="text-xl font-black text-slate-950">{activeTab.emptyTitle}</h3>
                <p className="mt-3 max-w-2xl leading-7 text-slate-700">{activeTab.emptyText}</p>
              </div>
            ) : (
              <div>
                <div className="divide-y divide-slate-200">
                  {visibleReports.map((report) => (
                    <article key={report.id} className="grid gap-4 bg-white p-5 md:grid-cols-[1fr_170px_150px_140px]">
                      <div>
                        <h3 className="font-black text-slate-950">{caseTitle(report)}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{caseSubtitle(report)}</p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Type</p>
                        <p className="mt-1 font-bold">{reportTypeLabel(report.report_type)}</p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Dato</p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">{formatDate(report.created_at)}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Link href={documentHref(report)} className="rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white hover:bg-red-600">
                          Åpne
                        </Link>
                        <Link
                          href={`/min-side/saker/${report.case_id}`}
                          className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"
                        >
                          Sak
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>

                {visibleReports.length < activeReports.length ? (
                  <div className="border-t border-slate-200 bg-slate-50 p-5 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"
                    >
                      Vis flere
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}

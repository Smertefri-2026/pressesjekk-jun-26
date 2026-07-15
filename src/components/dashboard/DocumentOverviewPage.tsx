"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

type DocumentOverviewPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  reportTypes: DocumentReportType[];
  emptyTitle: string;
  emptyText: string;
  primaryHref: string;
  primaryLabel: string;
};

const PAGE_SIZE = 10;

type ReportRow = {
  id: string;
  case_id: string;
  version: number | null;
  report_type: DocumentReportType;
  status: string | null;
  created_at: string;
  cases:
    | {
        title: string | null;
        media_name: string | null;
        article_title: string | null;
      }
    | {
        title: string | null;
        media_name: string | null;
        article_title: string | null;
      }[]
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
  if (type === "free_check") return "Regelbasert rapport";
  if (type === "full_report") return "KI-rapport";
  if (type === "pfu_draft") return "PFU-klage";
  if (type === "police_draft") return "Politianmeldelse";
  if (type === "investigation_draft") return "Utredning";
  return type;
}

function statusLabel(status: string | null) {
  if (!status) return "Lagret";
  if (status === "draft") return "Utkast";
  if (status === "ready") return "Klar";
  if (status === "completed") return "Fullført";
  if (status === "generated") return "Generert";
  return status;
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
  if (report.report_type === "pfu_draft") {
    return `/min-side/saker/${report.case_id}/pfu`;
  }

  if (report.report_type === "police_draft") {
    return `/min-side/saker/${report.case_id}/politianmeldelse`;
  }

  if (report.report_type === "investigation_draft") {
    return `/min-side/saker/${report.case_id}/utredning`;
  }

  return `/min-side/saker/${report.case_id}/rapport`;
}

export function DocumentOverviewPage({
  eyebrow,
  title,
  description,
  reportTypes,
  emptyTitle,
  emptyText,
  primaryHref,
  primaryLabel,
}: DocumentOverviewPageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [caseIds, setCaseIds] = useState<string[]>([]);
  const [hasMoreReports, setHasMoreReports] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

      setCaseIds(caseIds);

      if (caseIds.length === 0) {
        setReports([]);
        setHasMoreReports(false);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("case_reports")
        .select(
          "id,case_id,version,report_type,status,created_at,cases(title,media_name,article_title)"
        )
        .in("case_id", caseIds)
        .in("report_type", reportTypes)
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      const rows = (data ?? []) as unknown as ReportRow[];

      setReports(rows);
      setHasMoreReports(rows.length === PAGE_SIZE);
      setIsLoading(false);
    }

    loadDocuments();
  }, [reportTypes]);

  const latestDocuments = useMemo(() => reports.slice(0, 5), [reports]);

  async function loadMoreReports() {
    if (isLoadingMore || !hasMoreReports || caseIds.length === 0) return;

    setIsLoadingMore(true);
    setErrorMessage("");

    const from = reports.length;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("case_reports")
      .select(
        "id,case_id,version,report_type,status,created_at,cases(title,media_name,article_title)"
      )
      .in("case_id", caseIds)
      .in("report_type", reportTypes)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      setErrorMessage(error.message);
      setIsLoadingMore(false);
      return;
    }

    const rows = (data ?? []) as unknown as ReportRow[];

    setReports((currentReports) => [...currentReports, ...rows]);
    setHasMoreReports(rows.length === PAGE_SIZE);
    setIsLoadingMore(false);
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
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white hover:bg-red-600"
            >
              {primaryLabel}
            </Link>
            {user ? <SignOutButton /> : null}
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 font-semibold text-red-800">
            {errorMessage}
          </div>
        ) : null}

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
              Totalt
            </p>
            <p className="mt-4 [text-wrap:balance] text-4xl font-black sm:text-5xl text-slate-950">
              {reports.length}
            </p>
            <p className="mt-3 leading-7 text-slate-600">
              Dokumenter funnet i dine saker.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">
              Sist opprettet
            </p>
            {latestDocuments.length === 0 ? (
              <p className="mt-4 leading-7 text-slate-600">
                Ingen dokumenter er opprettet ennå.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {latestDocuments.map((report) => (
                  <Link
                    key={report.id}
                    href={documentHref(report)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-red-50"
                  >
                    <p className="font-black text-slate-950">
                      {caseTitle(report)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {reportTypeLabel(report.report_type)} v
                      {report.version ?? 1}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
              Dokumentliste
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Alle dokumenter
            </h2>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            {isLoading ? (
              <div className="bg-slate-50 p-6 text-slate-700">
                Laster dokumenter...
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-slate-50 p-6">
                <h3 className="text-xl font-black text-slate-950">
                  {emptyTitle}
                </h3>
                <p className="mt-3 max-w-2xl leading-7 text-slate-700">
                  {emptyText}
                </p>
              </div>
            ) : (
              <div>
                <div className="divide-y divide-slate-200">
                  {reports.map((report) => (
                    <article
                      key={report.id}
                      className="grid gap-4 bg-white p-5 md:grid-cols-[1fr_170px_150px_140px]"
                    >
                      <div>
                        <h3 className="font-black text-slate-950">
                          {caseTitle(report)}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {caseSubtitle(report)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                          Type
                        </p>
                        <p className="mt-1 font-bold">
                          {reportTypeLabel(report.report_type)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                          Dato
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {formatDate(report.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Link
                          href={documentHref(report)}
                          className="rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white hover:bg-red-600"
                        >
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

                {hasMoreReports ? (
                  <div className="border-t border-slate-200 bg-slate-50 p-5 text-center">
                    <button
                      type="button"
                      onClick={loadMoreReports}
                      disabled={isLoadingMore}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoadingMore ? "Laster flere..." : "Vis flere"}
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

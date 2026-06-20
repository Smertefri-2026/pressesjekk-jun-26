"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";

type CaseRow = {
  id: string;
  title: string;
  status: "draft" | "in_progress" | "report_ready" | "closed";
  media_name: string | null;
  article_title: string | null;
  article_url: string | null;
  published_date: string | null;
  created_at: string;
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

function statusLabel(status: CaseRow["status"]) {
  if (status === "draft") return "Utkast";
  if (status === "in_progress") return "Under arbeid";
  if (status === "report_ready") return "Rapport klar";
  if (status === "closed") return "Lukket";
  return status;
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
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [reportCount, setReportCount] = useState(0);
  const [pfuDraftCount, setPfuDraftCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);

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
        .from("cases")
        .select(
          "id,title,status,media_name,article_title,article_url,published_date,created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(error.message);
      } else {
        const caseRows = (data ?? []) as CaseRow[];
        setCases(caseRows);

        const { data: reportsData, error: reportsError } = await supabase
          .from("case_reports")
          .select("id,case_id,version,report_type,created_at");

        if (!reportsError) {
          const reportRows = (reportsData ?? []) as ReportRow[];
          setReports(reportRows);
          setReportCount(reportRows.length);
          setPfuDraftCount(
            reportRows.filter((item) => item.report_type === "pfu_draft").length
          );
        }
      }

      setIsLoading(false);
    }

    loadDashboard();
  }, []);

  const activityItems: ActivityItem[] = [
    ...reports.map((report) => {
      const linkedCase = cases.find((caseItem) => caseItem.id === report.case_id);

      return {
        id: `report-${report.id}`,
        title: `Rapport v${report.version} lagret`,
        description: linkedCase
          ? linkedCase.title
          : "Rapportutkast lagret på en sak",
        created_at: report.created_at,
        href: `/min-side/saker/${report.case_id}/rapport`,
      };
    }),
    ...cases.map((caseItem) => ({
      id: `case-${caseItem.id}`,
      title: "Sak opprettet",
      description: caseItem.title,
      created_at: caseItem.created_at,
      href: `/min-side/saker/${caseItem.id}`,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

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
              Dine PresseSjekk-saker
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Her samles sakene dine. I neste steg kan du opprette en ny sak,
              lagre artikkeldata og senere generere rapporter.
            </p>

            {user?.email ? (
              <p className="mt-5 text-sm font-semibold text-slate-500">
                Innlogget som:{" "}
                <span className="text-slate-950">{user.email}</span>
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/min-side/saker/ny"
                className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800"
              >
                + Opprett ny sak
              </Link>

              <Link
                href="/min-side/profil"
                className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
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
              {cases.length === 0
                ? "Opprett første ekte sak"
                : reportCount > 0
                  ? "Fortsett med rapporten"
                  : "Legg til opplysninger"}
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              {cases.length === 0
                ? "Neste steg er å lagre din første PresseSjekk-sak i databasen."
                : reportCount > 0
                  ? `Du har ${cases.length} lagret sak og ${reportCount} rapport. Åpne saken for å legge til flere opplysninger, redigere rapportgrunnlaget eller lage ny rapportversjon.`
                  : "Du har opprettet en sak. Neste steg er å legge til tilsvar, rettsstatus og dokumentasjon før du lager rapportutkast."}
            </p>
          </aside>
        </div>

        <section className="mt-14 grid gap-6 md:grid-cols-4" id="oversikt">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="font-bold text-slate-500">Credits igjen</p>
            <p className="mt-4 text-5xl font-black text-cyan-700">0</p>
          </div>

          <a
            href="#mine-saker"
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="font-bold text-slate-500">Aktive saker</p>
            <p className="mt-4 text-5xl font-black text-slate-950">
              {cases.length}
            </p>
            <p className="mt-3 text-sm font-semibold text-cyan-700">
              Se sakslisten
            </p>
          </a>

          <a
            href="#mine-saker"
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

        <section id="mine-saker" className="mt-10 grid gap-8 lg:grid-cols-[1fr_390px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                  Mine saker
                </p>
                <h2 className="mt-3 text-4xl font-black text-slate-950">
                  Lagrede saker
                </h2>
              </div>

              <Link
                href="/min-side/saker/ny"
                className="rounded-xl bg-slate-950 px-5 py-4 text-center text-sm font-black text-white hover:bg-slate-800"
              >
                + Opprett ny sak
              </Link>
            </div>

            {errorMessage ? (
              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                {errorMessage}
              </div>
            ) : null}

            {cases.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8">
                <h3 className="text-2xl font-black text-slate-950">
                  Ingen lagrede saker ennå
                </h3>
                <p className="mt-4 max-w-2xl leading-8 text-slate-700">
                  Når du oppretter din første sak, vil den vises her. Foreløpig
                  kan du åpne demosaken for å se hvordan en sak kan se ut.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/min-side/saker/ny"
                    className="rounded-xl bg-cyan-500 px-5 py-4 text-sm font-black text-slate-950 hover:bg-cyan-400"
                  >
                    Start ny sak
                  </Link>
                  <Link
                    href="/min-side/saker/demo-1"
                    className="rounded-xl border border-slate-300 bg-white px-5 py-4 text-sm font-black text-slate-950 hover:bg-slate-100"
                  >
                    Åpne demosak
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-8 grid gap-4">
                {cases.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">
                          {item.media_name ?? "Ukjent medie"} ·{" "}
                          {item.published_date ?? "Dato ikke satt"}
                        </p>
                        <h3 className="mt-3 text-2xl font-black text-slate-950">
                          {item.title}
                        </h3>
                        {item.article_title ? (
                          <p className="mt-2 text-slate-600">
                            {item.article_title}
                          </p>
                        ) : null}
                        <p className="mt-3 text-sm font-semibold text-slate-500">
                          Status: {statusLabel(item.status)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/min-side/saker/${item.id}`}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
                        >
                          Åpne sak
                        </Link>

                        {reports.some((report) => report.case_id === item.id) ? (
                          <Link
                            href={`/min-side/saker/${item.id}/rapport`}
                            className="rounded-xl bg-cyan-500 px-4 py-3 text-center text-sm font-black text-slate-950 hover:bg-cyan-400"
                          >
                            Åpne rapport
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
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
                  Aktivitet vises her når du har opprettet din første sak.
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
      </section>

      <LightPublicFooter />
    </main>
  );
}

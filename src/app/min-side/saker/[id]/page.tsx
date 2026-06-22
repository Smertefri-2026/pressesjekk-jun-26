"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { CaseWorkflowCard } from "@/components/cases/CaseWorkflowCard";
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
  short_description: string | null;
  created_at: string;
  updated_at: string;
};

type CaseInputRow = {
  id: string;
  article_text: string | null;
  what_happened: string | null;
  your_role: string | null;
  reply_sent: boolean | null;
  reply_text: string | null;
  editor_response: string | null;
  legal_status: string | null;
  legal_status_details: string | null;
  documentation_summary: string | null;
  desired_outcome: string | null;
};

type CaseReportRow = {
  id: string;
  version: number;
  report_type: "free_check" | "full_report" | "pfu_draft";
  status: "draft" | "ready" | "archived";
  created_at: string;
};

type PfuDecisionRow = {
  id: string;
  pfu_complaint_sent: boolean | null;
  pfu_sent_date: string | null;
  pfu_case_number: string | null;
  pfu_case_url: string | null;
  decision_received: boolean | null;
  decision_date: string | null;
  decision_result: string | null;
  uploaded_file_name: string | null;
  next_step_interest: string | null;
};

function statusLabel(status: CaseRow["status"]) {
  if (status === "draft") return "Utkast";
  if (status === "in_progress") return "Under arbeid";
  if (status === "report_ready") return "Rapport klar";
  if (status === "closed") return "Lukket";
  return status;
}

function legalStatusLabel(status: string | null) {
  if (!status) return "Ikke satt";
  if (status === "not_relevant") return "Ikke relevant";
  if (status === "unknown") return "Uavklart";
  if (status === "reported") return "Anmeldt";
  if (status === "dismissed") return "Henlagt";
  if (status === "court_case") return "Rettssak";
  if (status === "judgment") return "Dom/avgjørelse";
  if (status === "appeal") return "Klage/anke";
  return status;
}

function pfuDecisionResultLabel(status: string | null) {
  if (!status) return "Ikke satt";
  if (status === "upheld") return "Felt";
  if (status === "partly_upheld") return "Delvis felt";
  if (status === "not_upheld") return "Ikke felt";
  if (status === "dismissed") return "Avvist";
  if (status === "withdrawn") return "Trukket";
  if (status === "other") return "Annet";
  return status;
}

function formatDate(date: string | null) {
  if (!date) return "Ikke satt";

  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function InfoBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <div className="mt-3 whitespace-pre-line leading-8 text-slate-700">
        {children}
      </div>
    </div>
  );
}

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [caseItem, setCaseItem] = useState<CaseRow | null>(null);
  const [caseInput, setCaseInput] = useState<CaseInputRow | null>(null);
  const [reports, setReports] = useState<CaseReportRow[]>([]);
  const [pfuDecision, setPfuDecision] = useState<PfuDecisionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadCase() {
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
        .from("cases")
        .select(
          "id,title,status,media_name,article_title,article_url,published_date,short_description,created_at,updated_at"
        )
        .eq("id", params.id)
        .single();

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      setCaseItem(data as CaseRow);

      const { data: inputData, error: inputError } = await supabase
        .from("case_inputs")
        .select(
          "id,article_text,what_happened,your_role,reply_sent,reply_text,editor_response,legal_status,legal_status_details,documentation_summary,desired_outcome"
        )
        .eq("case_id", params.id)
        .maybeSingle();

      if (inputError) {
        setErrorMessage(inputError.message);
      } else {
        setCaseInput((inputData as CaseInputRow | null) ?? null);
      }

      const { data: reportsData, error: reportsError } = await supabase
        .from("case_reports")
        .select("id,version,report_type,status,created_at")
        .eq("case_id", params.id)
        .order("version", { ascending: false });

      if (!reportsError) {
        setReports((reportsData ?? []) as CaseReportRow[]);
      }

      const { data: pfuDecisionData, error: pfuDecisionError } = await supabase
        .from("pfu_decisions")
        .select(
          "id,pfu_complaint_sent,pfu_sent_date,pfu_case_number,pfu_case_url,decision_received,decision_date,decision_result,uploaded_file_name,next_step_interest"
        )
        .eq("case_id", params.id)
        .maybeSingle();

      if (!pfuDecisionError) {
        setPfuDecision((pfuDecisionData as PfuDecisionRow | null) ?? null);
      }

      setIsLoading(false);
    }

    if (params.id) {
      loadCase();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">Laster saken...</p>
          </div>
        </section>
      </main>
    );
  }

  if (errorMessage || !caseItem) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Link
            href="/min-side"
            className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
          >
            ← Tilbake til Min Side
          </Link>

          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
              Feil
            </p>
            <h1 className="mt-3 text-3xl font-black text-red-950">
              Fant ikke saken
            </h1>
            <p className="mt-4 leading-8 text-red-800">
              {errorMessage || "Saken finnes ikke, eller du har ikke tilgang."}
            </p>
          </div>
        </section>

        <LightPublicFooter />
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
              PresseSjekk-sak
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              {caseItem.title}
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Dette er startsiden for saken. Her får du oversikt over artikkel,
              mediehus, status, rapporter og videre arbeid. Bruk Saksgang til
              høyre for å gå mellom stegene i saken.
            </p>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Grunninformasjon
              </p>

              <div className="flex flex-wrap items-start justify-between gap-4">
                <h2 className="mt-3 text-4xl font-black text-slate-950">
                  Artikkel og sak
                </h2>

                <Link
                  href={`/min-side/saker/${params.id}/rediger`}
                  className="mt-3 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800"
                >
                  Rediger grunninformasjon
                </Link>
              </div>

              <p className="mt-4 max-w-3xl leading-8 text-slate-700">
                Sjekk at mediehus, publiseringsdato, artikkeloverskrift, lenke
                og kort beskrivelse stemmer. Dette er grunnlaget som brukes
                videre i saksopplysninger, rapport og PFU-spor.
              </p>

              <div className="mt-8 grid gap-4">
                <InfoBlock label="Mediehus">
                  <p className="text-xl font-black text-slate-950">
                    {caseItem.media_name || "Ikke satt"}
                  </p>
                </InfoBlock>

                <InfoBlock label="Publiseringsdato">
                  <p className="text-xl font-black text-slate-950">
                    {formatDate(caseItem.published_date)}
                  </p>
                </InfoBlock>

                <InfoBlock label="Artikkeloverskrift">
                  <p className="text-xl font-black text-slate-950">
                    {caseItem.article_title || "Ikke satt"}
                  </p>
                </InfoBlock>

                <InfoBlock label="Lenke">
                  {caseItem.article_url ? (
                    <a
                      href={caseItem.article_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block break-words text-lg font-bold text-cyan-700 hover:text-cyan-900"
                    >
                      {caseItem.article_url}
                    </a>
                  ) : (
                    <p className="text-xl font-black text-slate-950">
                      Ikke satt
                    </p>
                  )}
                </InfoBlock>

                <InfoBlock label="Kort beskrivelse">
                  {caseItem.short_description || "Ikke lagt inn ennå."}
                </InfoBlock>
              </div>
            </div>

          </section>

          <aside className="grid content-start gap-6">
          <CaseWorkflowCard
            caseId={params.id}
            statusLabel={statusLabel(caseItem.status)}
            activeStep="case"
            stepsDone={{
              caseRegistered: true,
              caseInputs: Boolean(caseInput),
              report: reports.some((report) => report.report_type !== "pfu_draft"),
              pfuDraft: reports.some((report) => report.report_type === "pfu_draft"),
              pfuDecision: Boolean(
                pfuDecision?.decision_received || pfuDecision?.uploaded_file_name
              ),
              policeReport: false,
            }}
          />

            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Rapport
              </p>
              <h2 className="mt-3 text-3xl font-black">
                {reports.length > 1
                  ? `${reports.length} rapporter lagret`
                  : reports.length === 1
                    ? "1 rapport lagret"
                    : "Ingen rapport lagret"}
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                {reports.length > 0
                  ? `Siste rapportversjon er v${reports[0]?.version}. Du kan åpne rapportutkastet eller lage en ny versjon.`
                  : "Når saksopplysninger er lagt inn, kan du lage første rapportutkast."}
              </p>

              <Link
                href={`/min-side/saker/${params.id}/rapport`}
                className="mt-6 inline-flex rounded-xl bg-cyan-400 px-5 py-4 text-sm font-black text-slate-950 hover:bg-cyan-300"
              >
                {reports.length > 0 ? "Åpne rapportutkast" : "Lag rapportutkast"}
              </Link>
            </div>

            <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
                PFU-status
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                {pfuDecision?.decision_received
                  ? pfuDecisionResultLabel(pfuDecision.decision_result)
                  : pfuDecision?.pfu_complaint_sent
                    ? "PFU-klage sendt"
                    : "Ikke registrert"}
              </h2>

              <div className="mt-5 grid gap-3 text-sm font-semibold text-slate-700">
                <p>
                  Klage sendt:{" "}
                  <span className="font-black text-slate-950">
                    {pfuDecision?.pfu_complaint_sent ? "Ja" : "Nei / ikke satt"}
                  </span>
                </p>
                <p>
                  Avgjørelse mottatt:{" "}
                  <span className="font-black text-slate-950">
                    {pfuDecision?.decision_received ? "Ja" : "Nei / ikke satt"}
                  </span>
                </p>
                <p>
                  Opplastet fil:{" "}
                  <span className="font-black text-slate-950">
                    {pfuDecision?.uploaded_file_name || "Ingen fil"}
                  </span>
                </p>
              </div>

              <Link
                href={`/min-side/saker/${params.id}/pfu-avgjorelse`}
                className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800"
              >
                Åpne PFU-avgjørelse
              </Link>
            </div>
          </aside>
        </div>

      </section>

      <LightPublicFooter />
    </main>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
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
  short_description: string | null;
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
  summary: string | null;
  findings: string[] | null;
  recommendations: string[] | null;
  pfu_draft: string | null;
  status: "draft" | "ready" | "archived";
  created_at: string;
};

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

function formatDate(date: string | null) {
  if (!date) return "Ikke satt";

  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function ReportBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-xl font-black text-slate-950">{title}</h3>
      <div className="mt-3 whitespace-pre-line leading-8 text-slate-700">
        {children}
      </div>
    </section>
  );
}

export default function CaseReportPage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [caseItem, setCaseItem] = useState<CaseRow | null>(null);
  const [caseInput, setCaseInput] = useState<CaseInputRow | null>(null);
  const [reports, setReports] = useState<CaseReportRow[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadData() {
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

      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select(
          "id,title,status,media_name,article_title,article_url,published_date,short_description"
        )
        .eq("id", params.id)
        .single();

      if (caseError) {
        setErrorMessage(caseError.message);
        setIsLoading(false);
        return;
      }

      setCaseItem(caseData as CaseRow);

      const { data: inputData, error: inputError } = await supabase
        .from("case_inputs")
        .select(
          "id,article_text,what_happened,your_role,reply_sent,reply_text,editor_response,legal_status,legal_status_details,documentation_summary,desired_outcome"
        )
        .eq("case_id", params.id)
        .maybeSingle();

      if (inputError) {
        setErrorMessage(inputError.message);
        setIsLoading(false);
        return;
      }

      setCaseInput((inputData as CaseInputRow | null) ?? null);

      const { data: reportData, error: reportError } = await supabase
        .from("case_reports")
        .select(
          "id,version,report_type,summary,findings,recommendations,pfu_draft,status,created_at"
        )
        .eq("case_id", params.id)
        .order("version", { ascending: false });

      if (reportError) {
        setErrorMessage(reportError.message);
        setIsLoading(false);
        return;
      }

      setReports((reportData ?? []) as CaseReportRow[]);
      setIsLoading(false);
    }

    if (params.id) {
      loadData();
    }
  }, [params.id]);

  const draft = useMemo(() => {
    const findings: string[] = [];
    const recommendations: string[] = [];

    if (!caseItem) {
      return {
        summary: "",
        findings,
        recommendations,
      };
    }

    if (caseItem.article_url) {
      findings.push("Saken har registrert artikkellenke.");
    } else {
      findings.push("Saken mangler artikkellenke.");
      recommendations.push("Legg inn lenke til artikkelen hvis den er tilgjengelig.");
    }

    if (caseInput?.article_text) {
      findings.push("Det er lagt inn artikkeltekst eller relevante utdrag.");
    } else {
      findings.push("Det mangler artikkeltekst eller utdrag.");
      recommendations.push("Lim inn artikkeltekst eller relevante utdrag før endelig rapport lages.");
    }

    if (caseInput?.reply_sent) {
      findings.push("Det er registrert at tilsvar eller henvendelse er sendt til redaksjonen.");
    } else {
      findings.push("Det er ikke registrert at tilsvar eller henvendelse er sendt.");
      recommendations.push("Vurder å dokumentere om tilsvar, retting eller samtidig imøtegåelse er forsøkt.");
    }

    if (caseInput?.editor_response) {
      findings.push("Svar fra redaksjonen er registrert.");
    } else {
      findings.push("Svar fra redaksjonen er ikke registrert.");
      recommendations.push("Legg inn redaksjonens svar hvis det finnes.");
    }

    if (caseInput?.legal_status) {
      findings.push(`Rettsstatus er registrert som: ${legalStatusLabel(caseInput.legal_status)}.`);
    } else {
      findings.push("Rettsstatus er ikke registrert.");
      recommendations.push("Avklar om saken har rettslig status, henleggelse, dom, klage eller annen dokumentasjon.");
    }

    if (caseInput?.documentation_summary) {
      findings.push("Det finnes en dokumentasjonsoppsummering.");
    } else {
      findings.push("Dokumentasjonsoppsummering mangler.");
      recommendations.push("Lag en punktvis oversikt over dokumenter, e-poster, SMS-er, vedlegg og annen dokumentasjon.");
    }

    if (recommendations.length === 0) {
      recommendations.push("Saken har et godt første dokumentasjonsgrunnlag. Neste steg kan være full analyse.");
    }

    const summary = `Dette er et foreløpig rapportutkast for saken "${caseItem.title}". Rapporten bygger på grunninformasjon, eventuelle saksopplysninger, tilsvar, rettsstatus og dokumentasjonsoppsummering som er lagret i PresseSjekk. Utkastet er veiledende og erstatter ikke advokat, PFU eller redaksjonell vurdering.`;

    return {
      summary,
      findings,
      recommendations,
    };
  }, [caseItem, caseInput]);

  async function handleSaveReport() {
    if (!caseItem) return;

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const nextVersion =
      reports.length > 0 ? Math.max(...reports.map((item) => item.version)) + 1 : 1;

    const { error } = await supabase.from("case_reports").insert({
      case_id: caseItem.id,
      version: nextVersion,
      report_type: "free_check",
      summary: draft.summary,
      findings: draft.findings,
      recommendations: draft.recommendations,
      status: "ready",
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    await supabase
      .from("cases")
      .update({ status: "report_ready" })
      .eq("id", caseItem.id);

    setSuccessMessage(`Rapportutkast v${nextVersion} er lagret.`);
    setReports((current) => [
      {
        id: crypto.randomUUID(),
        version: nextVersion,
        report_type: "free_check",
        summary: draft.summary,
        findings: draft.findings,
        recommendations: draft.recommendations,
        pfu_draft: null,
        status: "ready",
        created_at: new Date().toISOString(),
      },
      ...current,
    ]);

    setCaseItem({ ...caseItem, status: "report_ready" });
    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              Laster rapport...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (errorMessage && !caseItem) {
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
            <h1 className="text-3xl font-black text-red-950">
              Kunne ikke åpne rapport
            </h1>
            <p className="mt-4 leading-8 text-red-800">{errorMessage}</p>
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
          href={`/min-side/saker/${params.id}`}
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          ← Tilbake til saken
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Rapportutkast
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Første rapportutkast.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Dette er en enkel, regelbasert rapport basert på opplysningene som
              allerede er lagret på saken. Senere kan denne erstattes eller
              forbedres med AI-analyse.
            </p>

            {user?.email ? (
              <p className="mt-5 text-sm font-semibold text-slate-500">
                Innlogget som:{" "}
                <span className="text-slate-950">{user.email}</span>
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/min-side/saker/${params.id}`}
                className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
              >
                Til saken
              </Link>

              <button
                type="button"
                onClick={handleSaveReport}
                disabled={isSaving}
                className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Lagrer..." : "Lagre rapportutkast"}
              </button>
            </div>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Sak
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              {caseItem?.title}
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              {caseItem?.media_name ?? "Ukjent medie"} ·{" "}
              {formatDate(caseItem?.published_date ?? null)}
            </p>
          </aside>
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_390px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Utkast
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Rapport
            </h2>

            <div className="mt-8 grid gap-5">
              <ReportBlock title="Sammendrag">
                {draft.summary}
              </ReportBlock>

              <ReportBlock title="Foreløpige funn">
                <ul className="grid gap-3">
                  {draft.findings.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="text-cyan-700">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </ReportBlock>

              <ReportBlock title="Anbefalte neste steg">
                <ul className="grid gap-3">
                  {draft.recommendations.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="text-amber-600">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </ReportBlock>

              <ReportBlock title="Forbehold">
                Dette er et foreløpig og veiledende rapportutkast. Det er ikke
                juridisk rådgivning, PFU-avgjørelse eller endelig vurdering.
                Innholdet bør kontrolleres før det brukes videre.
              </ReportBlock>
            </div>

            {errorMessage ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                {successMessage}
              </div>
            ) : null}
          </div>

          <aside className="grid gap-6">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
                Rapportversjoner
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                {reports.length} lagret
              </h2>
              <div className="mt-5 grid gap-3">
                {reports.length === 0 ? (
                  <p className="leading-8 text-slate-700">
                    Ingen rapporter er lagret ennå.
                  </p>
                ) : (
                  reports.map((report) => (
                    <div
                      key={`${report.id}-${report.version}`}
                      className="rounded-2xl border border-amber-200 bg-white/70 p-4"
                    >
                      <p className="font-black text-slate-950">
                        Rapport v{report.version}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        {formatDate(report.created_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Neste versjon
              </p>
              <h2 className="mt-3 text-3xl font-black">
                AI-analyse senere
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                Når rapportflyten fungerer, kan vi koble på AI for dypere
                vurdering av presseetikk, tilsvar og dokumentasjon.
              </p>
            </div>
          </aside>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}

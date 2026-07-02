"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { CaseWorkflowCard } from "@/components/cases/CaseWorkflowCard";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";
import type { PackagePlanId } from "@/data/packagePlans";

type CaseAccessRow = {
  package_id: PackagePlanId;
  status: "active" | "pending" | "cancelled" | "expired";
};

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
  report_type: "free_check" | "full_report" | "pfu_draft" | "police_draft" | "investigation_draft";
  summary: string | null;
  findings: string[] | null;
  recommendations: string[] | null;
  pfu_draft: string | null;
  status: "draft" | "ready" | "archived";
  created_at: string;
};

type PfuDecisionRow = {
  id: string;
  decision_received: boolean | null;
  uploaded_file_name: string | null;
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

function statusLabel(status: CaseRow["status"]) {
  if (status === "draft") return "Utkast";
  if (status === "in_progress") return "Under arbeid";
  if (status === "report_ready") return "Rapport klar";
  if (status === "closed") return "Lukket";
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

export default function CaseReportPage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [caseAccessPackageId, setCaseAccessPackageId] =
    useState<PackagePlanId | null>(null);
  const [workflowType, setWorkflowType] = useState<"standard" | "journalist">("standard");
  const [caseItem, setCaseItem] = useState<CaseRow | null>(null);
  const [caseInput, setCaseInput] = useState<CaseInputRow | null>(null);
  const [reports, setReports] = useState<CaseReportRow[]>([]);
  const [allReports, setAllReports] = useState<CaseReportRow[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [visibleReportCount, setVisibleReportCount] = useState(5);
  const [pfuDecision, setPfuDecision] = useState<PfuDecisionRow | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState(false);
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

      const { data: accessData } = await supabase
        .from("case_access")
        .select("package_id,status")
        .eq("case_id", params.id)
        .eq("status", "active")
        .maybeSingle();

      const caseAccess = accessData as CaseAccessRow | null;

      setCaseAccessPackageId(caseAccess?.package_id ?? null);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role_type")
        .eq("id", user.id)
        .maybeSingle();

      setWorkflowType(
        profileData?.role_type === "journalist" ? "journalist" : "standard"
      );

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

      const loadedReports = (reportData ?? []) as CaseReportRow[];
      const loadedReportVersions = loadedReports.filter(
        (report) =>
          report.report_type === "free_check" ||
          report.report_type === "full_report"
      );

      setAllReports(loadedReports);
      setReports(loadedReportVersions);
      setSelectedReportId(loadedReportVersions[0]?.id ?? null);
      setVisibleReportCount(5);

      const { data: pfuDecisionData } = await supabase
        .from("pfu_decisions")
        .select("id,decision_received,uploaded_file_name")
        .eq("case_id", params.id)
        .maybeSingle();

      setPfuDecision((pfuDecisionData as PfuDecisionRow | null) ?? null);

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

  const activeReport =
    reports.find((report) => report.id === selectedReportId) ??
    reports[0] ??
    null;

  const activeReportTitle = activeReport
    ? activeReport.report_type === "full_report"
      ? `KI-rapport v${activeReport.version}`
      : `Regelbasert rapport v${activeReport.version}`
    : "Rapportutkast";

  const visibleReports = reports.slice(0, visibleReportCount);
  const hasMoreReports = reports.length > visibleReportCount;

  const activeSummary = activeReport?.summary || draft.summary;

  const activeFindings =
    activeReport?.findings && activeReport.findings.length > 0
      ? activeReport.findings
      : draft.findings;

  const activeRecommendations =
    activeReport?.recommendations && activeReport.recommendations.length > 0
      ? activeReport.recommendations
      : draft.recommendations;

  const isJournalistWorkflow = workflowType === "journalist";

  function formatActiveReportForExport() {
    const title = activeReportTitle;
    const date = activeReport?.created_at
      ? formatDate(activeReport.created_at)
      : formatDate(new Date().toISOString());

    const findingsText = activeFindings
      .map((item, index) => `${index + 1}. ${item}`)
      .join("\n");

    const recommendationsText = activeRecommendations
      .map((item, index) => `${index + 1}. ${item}`)
      .join("\n");

    return `PresseSjekk rapport

Sak:
${caseItem?.title ?? "Ukjent sak"}

Rapport:
${title}

Dato:
${date}

Sammendrag:
${activeSummary}

Foreløpige funn:
${findingsText}

Anbefalte neste steg:
${recommendationsText}

Forbehold:
Dette er et foreløpig og veiledende rapportutkast. Det er ikke juridisk rådgivning, PFU-avgjørelse eller endelig vurdering. Innholdet bør kontrolleres før det brukes videre.
`;
  }

  async function handleDownloadReportPdf() {
    if (!activeReport) {
      setErrorMessage("Du må velge en lagret rapportversjon før du kan laste ned PDF.");
      return;
    }

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    const accessToken = sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      setErrorMessage("Du må være innlogget for å laste ned PDF.");
      return;
    }

    setErrorMessage("");

    console.log("Laster ned PDF for rapport:", activeReport.id);

    const response = await fetch(
      `/api/cases/${params.id}/reports/${activeReport.id}/pdf`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log("PDF response status:", response.status);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message = payload?.error ?? `Kunne ikke lage PDF. Status: ${response.status}`;
      console.error("PDF-feil:", message);
      setErrorMessage(message);
      alert(message);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const safeTitle = (caseItem?.title ?? "pressesjekk-rapport")
      .toLowerCase()
      .replace(/[^a-z0-9æøå]+/gi, "-")
      .replace(/^-+|-+$/g, "");

    link.href = url;
    link.download = `${safeTitle}-${activeReportTitle
      .toLowerCase()
      .replace(/[^a-z0-9æøå]+/gi, "-")
      .replace(/^-+|-+$/g, "")}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  function handleDownloadReportText() {
    const reportText = formatActiveReportForExport();
    const safeTitle = (caseItem?.title ?? "pressesjekk-rapport")
      .toLowerCase()
      .replace(/[^a-z0-9æøå]+/gi, "-")
      .replace(/^-+|-+$/g, "");

    const blob = new Blob([reportText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${safeTitle}-${activeReportTitle
      .toLowerCase()
      .replace(/[^a-z0-9æøå]+/gi, "-")
      .replace(/^-+|-+$/g, "")}.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  async function handleSaveReport() {
    if (!caseItem) return;

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const nextVersion =
      reports.length > 0 ? Math.max(...reports.map((item) => item.version)) + 1 : 1;

    const { data: savedReport, error } = await supabase
      .from("case_reports")
      .insert({
        case_id: caseItem.id,
        version: nextVersion,
        report_type: "free_check",
        summary: draft.summary,
        findings: draft.findings,
        recommendations: draft.recommendations,
        status: "ready",
      })
      .select(
        "id,version,report_type,summary,findings,recommendations,pfu_draft,status,created_at"
      )
      .single();

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    if (!savedReport?.id) {
      setErrorMessage("Rapporten ble lagret, men vi fant ikke rapport-ID.");
      setIsSaving(false);
      return;
    }

    await supabase
      .from("cases")
      .update({ status: "report_ready" })
      .eq("id", caseItem.id);

    setSuccessMessage(`Regelbasert rapport v${nextVersion} er lagret.`);

    const newReport = savedReport as CaseReportRow;

    setReports((current) => [newReport, ...current]);
    setAllReports((current) => [newReport, ...current]);

    setSelectedReportId(newReport.id);
    setCaseItem({ ...caseItem, status: "report_ready" });
    setIsSaving(false);
  }

  async function handleGenerateAiReport() {
    if (!caseItem) return;

    setIsGeneratingAiReport(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    const accessToken = sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      setErrorMessage("Du må være innlogget for å generere KI-rapport.");
      setIsGeneratingAiReport(false);
      return;
    }

    const response = await fetch(`/api/cases/${params.id}/generate-report`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      setErrorMessage(result.error || "Kunne ikke generere KI-rapport.");
      setIsGeneratingAiReport(false);
      return;
    }

    if (!result.report) {
      setErrorMessage("KI-rapporten ble generert, men svaret manglet rapportdata.");
      setIsGeneratingAiReport(false);
      return;
    }

    const generatedReport = result.report as CaseReportRow;

    setReports((current) => [generatedReport, ...current]);
    setAllReports((current) => [generatedReport, ...current]);
    setSelectedReportId(generatedReport.id);
    setCaseItem({ ...caseItem, status: "report_ready" });
    setSuccessMessage(`KI-rapport v${generatedReport.version} er generert og lagret.`);
    setIsGeneratingAiReport(false);
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
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
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
          href="/min-side"
          className="text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          ← Tilbake til Min Side
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-700">
              Rapportutkast
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Rapportutkast
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              {isJournalistWorkflow
                ? "Rapportutkastet bygger på publiseringsgrunnlag og saksopplysninger som allerede er lagret på saken. Utkastet kan brukes som arbeidsgrunnlag for redaksjonell kvalitetssikring, VVP-risiko og videre publiseringsvurdering."
                : "Rapportutkastet bygger på grunninformasjon og saksopplysninger som allerede er lagret på saken. Utkastet kan brukes som arbeidsgrunnlag før videre vurdering, PFU-klage, politianmeldelse eller utredning."}
            </p>



          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-700">
              Rapport
            </p>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="mt-3 text-4xl font-black text-slate-950">
                  Rapportutkast
                </h2>
                <p className="mt-4 max-w-3xl leading-8 text-slate-700">
                  Kontroller utkastet før du lagrer en ny rapportversjon. Utkastet
                  bygger på grunninformasjon og saksopplysninger som er lagt inn.
                </p>
              </div>

              <div className="mt-6 grid w-full grid-cols-2 gap-3 sm:mt-3 sm:flex sm:w-auto sm:flex-wrap">
                <button
                  type="button"
                  onClick={handleGenerateAiReport}
                  disabled={isGeneratingAiReport}
                  className="col-span-2 w-full rounded-2xl bg-blue-500 px-5 py-4 text-center text-base font-black text-slate-950 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-1 sm:w-auto sm:py-3 sm:text-sm"
                >
                  {isGeneratingAiReport
                    ? "Genererer..."
                    : "Generer rapport med KI"}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadReportPdf}
                  disabled={!activeReport}
                  className="col-span-1 w-full rounded-2xl border border-blue-300 bg-blue-50 px-2 py-4 text-center text-base font-black text-blue-900 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5 sm:py-3 sm:text-sm"
                >
                  Last ned PDF
                </button>

                <button
                  type="button"
                  onClick={handleDownloadReportText}
                  className="col-span-1 w-full rounded-2xl border border-slate-300 bg-white px-2 py-4 text-center text-base font-black text-slate-950 hover:bg-slate-100 sm:w-auto sm:px-5 sm:py-3 sm:text-sm"
                >
                  Last ned tekst
                </button>
              </div>
            </div>

            <pre className="mt-8 max-h-[900px] overflow-auto whitespace-pre-wrap rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-800 sm:p-7">
              {formatActiveReportForExport()}
            </pre>

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

            <div className="mt-8 flex flex-wrap gap-3">
              {!isJournalistWorkflow ? (
                <Link
                  href={`/min-side/saker/${params.id}/pfu`}
                  className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800"
                >
                  Gå til PFU-klage
                </Link>
              ) : (
                <Link
                  href={`/min-side/saker/${params.id}/opplysninger`}
                  className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800"
                >
                  Til publiseringsgrunnlag
                </Link>
              )}

              <Link
                href={`/min-side/saker/${params.id}`}
                className="rounded-2xl border border-slate-300 bg-white px-6 py-4 font-black text-slate-950 hover:bg-slate-100"
              >
                Til saken
              </Link>
            </div>
          </div>

          </section>

          <aside className="grid content-start gap-6">
          <CaseWorkflowCard
            caseId={params.id}
            statusLabel={caseItem ? statusLabel(caseItem.status) : "Utkast"}
            activeStep="rapport"
            workflowType={workflowType}
              currentPackageId={caseAccessPackageId ?? undefined}
            stepsDone={{
              caseRegistered: true,
              caseInputs: Boolean(caseInput),
              report: reports.length > 0,
              pfuDraft: allReports.some((report) => report.report_type === "pfu_draft"),
              pfuDecision: Boolean(
                pfuDecision?.decision_received || pfuDecision?.uploaded_file_name
              ),
              policeReport: allReports.some((report) => report.report_type === "police_draft"),
              investigation: allReports.some(
                (report) => report.report_type === "investigation_draft"
              ),
            }}
          />

<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-700">
                Rapportversjoner
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                {reports.length > 1
                  ? `${reports.length} lagret`
                  : reports.length === 1
                    ? "1 lagret"
                    : "Ingen lagret"}
              </h2>
              <div className="mt-5 grid gap-3">
                {reports.length === 0 ? (
                  <p className="leading-8 text-slate-700">
                    Ingen rapporter er lagret ennå. Generer en KI-rapport eller lagre
                    den regelbaserte rapporten når du ønsker å bevare en versjon.
                  </p>
                ) : (
                  visibleReports.map((report) => {
                    const isSelected = activeReport?.id === report.id;

                    return (
                      <button
                        key={`${report.id}-${report.version}`}
                        type="button"
                        onClick={() => setSelectedReportId(report.id)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-slate-200 bg-slate-50 hover:bg-blue-50"
                        }`}
                      >
                        <p className="font-black text-slate-950">
                          {report.report_type === "full_report"
                            ? `KI-rapport v${report.version}`
                            : `Regelbasert rapport v${report.version}`}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          {formatDate(report.created_at)}
                        </p>
                        {isSelected ? (
                          <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                            Vises nå
                          </p>
                        ) : null}
                      </button>
                    );
                  })
                )}

                {hasMoreReports ? (
                  <button
                    type="button"
                    onClick={() => setVisibleReportCount((current) => current + 5)}
                    className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
                  >
                    Vis 5 til
                  </button>
                ) : null}
              </div>
            </div>

            {!isJournalistWorkflow ? (
              <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-300">
                  Videre arbeid
                </p>
                <h2 className="mt-3 text-3xl font-black">
                  Fra rapport til handling
                </h2>
                <p className="mt-4 leading-8 text-slate-300">
                  Etter at rapportutkastet er lagret, kan saken brukes videre som
                  grunnlag for PFU-klage, politianmeldelse, dokumentasjon,
                  redigering eller utredning.
                </p>
              </div>
            ) : null}
          </aside>
        </div>

      </section>

      <LightPublicFooter />
    </main>
  );
}

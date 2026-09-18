"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { CaseSidebar } from "@/components/cases/CaseSidebar";
import { ClaimsPanel } from "@/components/evidence/ClaimsPanel";
import { TimelinePanel } from "@/components/evidence/TimelinePanel";
import { WitnessesPanel } from "@/components/evidence/WitnessesPanel";
import { EvidenceWorkspacePanel, type FocusedContext } from "@/components/evidence/EvidenceWorkspacePanel";
import { DocumentationInsightsPanel } from "@/components/evidence/DocumentationInsightsPanel";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";
import type { PackagePlanId } from "@/data/packagePlans";
import { normalizeBuiltFrom, normalizeReportSections } from "@/lib/report/mappers";
import type { CaseReportRow as FullCaseReportRow } from "@/lib/report/mappers";
import { StructuredReportView } from "@/components/report/StructuredReportView";

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

type CaseReportRow = Pick<
  FullCaseReportRow,
  | "id"
  | "version"
  | "report_type"
  | "summary"
  | "findings"
  | "recommendations"
  | "pfu_draft"
  | "status"
  | "created_at"
  | "sections"
  | "built_from"
  | "report_kind"
>;

type PfuDecisionRow = {
  id: string;
  decision_received: boolean | null;
  uploaded_file_name: string | null;
};

type CaseInputRow = {
  id: string;
  case_id: string;
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

const caseRoleOptions = [
  "Omtalt person",
  "Pårørende",
  "Rådgiver",
  "Advokat",
  "Journalist/redaksjon",
  "Bedrift/organisasjon",
  "Leser/publikum",
  "Annet",
];

function statusLabel(status: CaseRow["status"]) {
  if (status === "draft") return "Utkast";
  if (status === "in_progress") return "Under arbeid";
  if (status === "report_ready") return "Rapport klar";
  if (status === "closed") return "Lukket";
  return status;
}

function legalStatusLabel(status: string) {
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
  return new Intl.DateTimeFormat("nb-NO", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));
}

/**
 * Fase 6.3 — Full rapport. Erstatter de tidligere separate sidene
 * /opplysninger og /rapport med én arbeidsflate: saksopplysninger,
 * påstander, tidslinje, vitner (dokumenter i sidepanelets arbeidsflate) og
 * rapportgenerering/-visning på samme side. Ingen egen rapport-URL.
 */
export default function FullRapportPage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [caseAccessPackageId, setCaseAccessPackageId] = useState<PackagePlanId | null>(null);
  const [workflowType, setWorkflowType] = useState<"standard" | "journalist">("standard");
  const [caseItem, setCaseItem] = useState<CaseRow | null>(null);
  const [caseInputId, setCaseInputId] = useState<string | null>(null);
  const [allReports, setAllReports] = useState<CaseReportRow[]>([]);
  const [reports, setReports] = useState<CaseReportRow[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [visibleReportCount, setVisibleReportCount] = useState(5);
  const [pfuDecision, setPfuDecision] = useState<PfuDecisionRow | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingInputs, setIsSavingInputs] = useState(false);
  const [isEditingInputs, setIsEditingInputs] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState(false);
  const [focusedContext, setFocusedContext] = useState<FocusedContext>(null);

  const [articleText, setArticleText] = useState("");
  const [whatHappened, setWhatHappened] = useState("");
  const [yourRole, setYourRole] = useState("");
  const [replySent, setReplySent] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editorResponse, setEditorResponse] = useState("");
  const [legalStatus, setLegalStatus] = useState("");
  const [legalStatusDetails, setLegalStatusDetails] = useState("");
  const [documentationSummary, setDocumentationSummary] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");

  const isJournalist = workflowType === "journalist";
  const isJournalistWorkflow = isJournalist;

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

      const { data: accessData, error: accessError } = await supabase
        .from("case_access")
        .select("package_id,status")
        .eq("case_id", params.id)
        .eq("status", "active")
        .maybeSingle();

      if (accessError) {
        setErrorMessage(accessError.message);
        setIsLoading(false);
        return;
      }

      const caseAccess = accessData as CaseAccessRow | null;
      setCaseAccessPackageId(caseAccess?.package_id ?? null);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role_type")
        .eq("id", user.id)
        .maybeSingle();

      setWorkflowType(profileData?.role_type === "journalist" ? "journalist" : "standard");

      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("id,title,status,media_name,article_title,article_url,published_date,short_description")
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
          "id,case_id,article_text,what_happened,your_role,reply_sent,reply_text,editor_response,legal_status,legal_status_details,documentation_summary,desired_outcome"
        )
        .eq("case_id", params.id)
        .maybeSingle();

      if (inputError) {
        setErrorMessage(inputError.message);
        setIsLoading(false);
        return;
      }

      if (inputData) {
        const input = inputData as CaseInputRow;

        setCaseInputId(input.id);
        setArticleText(input.article_text ?? "");
        setWhatHappened(input.what_happened ?? "");
        setYourRole(input.your_role ?? "");
        setReplySent(Boolean(input.reply_sent));
        setReplyText(input.reply_text ?? "");
        setEditorResponse(input.editor_response ?? "");
        setLegalStatus(input.legal_status ?? "");
        setLegalStatusDetails(input.legal_status_details ?? "");
        setDocumentationSummary(input.documentation_summary ?? "");
        setDesiredOutcome(input.desired_outcome ?? "");
        setIsEditingInputs(false);
      } else {
        setIsEditingInputs(true);
      }

      const { data: reportData, error: reportError } = await supabase
        .from("case_reports")
        .select("id,version,report_type,summary,findings,recommendations,pfu_draft,status,created_at,sections,built_from,report_kind")
        .eq("case_id", params.id)
        .order("version", { ascending: false });

      if (reportError) {
        setErrorMessage(reportError.message);
        setIsLoading(false);
        return;
      }

      const loadedReports = (reportData ?? []) as CaseReportRow[];
      const loadedReportVersions = loadedReports.filter(
        (report) => report.report_type === "free_check" || report.report_type === "full_report"
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setErrorMessage("Du må være innlogget for å lagre opplysninger.");
      return;
    }

    setIsSavingInputs(true);
    setSaveMessage("");
    setErrorMessage("");

    const payload = {
      case_id: params.id,
      article_text: articleText.trim() || null,
      what_happened: whatHappened.trim() || null,
      your_role: yourRole.trim() || null,
      reply_sent: replySent,
      reply_text: replyText.trim() || null,
      editor_response: editorResponse.trim() || null,
      legal_status: legalStatus.trim() || null,
      legal_status_details: legalStatusDetails.trim() || null,
      documentation_summary: documentationSummary.trim() || null,
      desired_outcome: desiredOutcome.trim() || null,
    };

    if (caseInputId) {
      const { error } = await supabase.from("case_inputs").update(payload).eq("id", caseInputId);

      if (error) {
        setErrorMessage(error.message);
        setIsSavingInputs(false);
        return;
      }
    } else {
      const { data, error } = await supabase.from("case_inputs").insert(payload).select("id").single();

      if (error) {
        setErrorMessage(error.message);
        setIsSavingInputs(false);
        return;
      }

      setCaseInputId(data.id);
    }

    setSaveMessage("Saksopplysningene er lagret.");
    setIsEditingInputs(false);
    setIsSavingInputs(false);
  }

  const draft = useMemo(() => {
    const findings: string[] = [];
    const recommendations: string[] = [];

    if (!caseItem) {
      return { summary: "", findings, recommendations };
    }

    if (caseItem.article_url) {
      findings.push("Saken har registrert artikkellenke.");
    } else {
      findings.push("Saken mangler artikkellenke.");
      recommendations.push("Legg inn lenke til artikkelen hvis den er tilgjengelig.");
    }

    if (articleText) {
      findings.push("Det er lagt inn artikkeltekst eller relevante utdrag.");
    } else {
      findings.push("Det mangler artikkeltekst eller utdrag.");
      recommendations.push("Lim inn artikkeltekst eller relevante utdrag før endelig rapport lages.");
    }

    if (replySent) {
      findings.push("Det er registrert at tilsvar eller henvendelse er sendt til redaksjonen.");
    } else {
      findings.push("Det er ikke registrert at tilsvar eller henvendelse er sendt.");
      recommendations.push("Vurder å dokumentere om tilsvar, retting eller samtidig imøtegåelse er forsøkt.");
    }

    if (editorResponse) {
      findings.push("Svar fra redaksjonen er registrert.");
    } else {
      findings.push("Svar fra redaksjonen er ikke registrert.");
      recommendations.push("Legg inn redaksjonens svar hvis det finnes.");
    }

    if (legalStatus) {
      findings.push(`Rettsstatus er registrert som: ${legalStatusLabel(legalStatus)}.`);
    } else {
      findings.push("Rettsstatus er ikke registrert.");
      recommendations.push("Avklar om saken har rettslig status, henleggelse, dom, klage eller annen dokumentasjon.");
    }

    if (documentationSummary) {
      findings.push("Det finnes egne notater til saken.");
    }

    if (recommendations.length === 0) {
      recommendations.push("Saken har et godt første dokumentasjonsgrunnlag. Neste steg kan være full analyse.");
    }

    const summary = `Dette er et foreløpig rapportutkast for saken "${caseItem.title}". Rapporten bygger på grunninformasjon, eventuelle saksopplysninger, tilsvar, rettsstatus og dokumentasjonsoppsummering som er lagret i PresseSjekk. Utkastet er veiledende og erstatter ikke advokat, PFU eller redaksjonell vurdering.`;

    return { summary, findings, recommendations };
  }, [caseItem, articleText, replySent, editorResponse, legalStatus, documentationSummary]);

  const activeReport = reports.find((report) => report.id === selectedReportId) ?? reports[0] ?? null;

  const isStructuredReport = activeReport?.report_kind === "structured";
  const activeStructuredSections = isStructuredReport ? normalizeReportSections(activeReport?.sections) : [];
  const activeBuiltFrom = isStructuredReport ? normalizeBuiltFrom(activeReport?.built_from) : null;

  const activeReportTitle = activeReport
    ? activeReport.report_type === "full_report"
      ? `KI-rapport v${activeReport.version}`
      : `Regelbasert rapport v${activeReport.version}`
    : "Rapportutkast";

  const visibleReports = reports.slice(0, visibleReportCount);
  const hasMoreReports = reports.length > visibleReportCount;

  const activeSummary = activeReport?.summary || draft.summary;
  const activeFindings = activeReport?.findings && activeReport.findings.length > 0 ? activeReport.findings : draft.findings;
  const activeRecommendations =
    activeReport?.recommendations && activeReport.recommendations.length > 0 ? activeReport.recommendations : draft.recommendations;

  function formatActiveReportForExport() {
    const title = activeReportTitle;
    const date = activeReport?.created_at ? formatDate(activeReport.created_at) : formatDate(new Date().toISOString());

    const findingsText = activeFindings.map((item, index) => `${index + 1}. ${item}`).join("\n");
    const recommendationsText = activeRecommendations.map((item, index) => `${index + 1}. ${item}`).join("\n");

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

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      setErrorMessage("Du må være innlogget for å laste ned PDF.");
      return;
    }

    setErrorMessage("");

    const response = await fetch(`/api/cases/${params.id}/reports/${activeReport.id}/pdf`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message = payload?.error ?? `Kunne ikke lage PDF. Status: ${response.status}`;
      setErrorMessage(message);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const safeTitle = (caseItem?.title ?? "pressesjekk-rapport").toLowerCase().replace(/[^a-z0-9æøå]+/gi, "-").replace(/^-+|-+$/g, "");

    link.href = url;
    link.download = `${safeTitle}-${activeReportTitle.toLowerCase().replace(/[^a-z0-9æøå]+/gi, "-").replace(/^-+|-+$/g, "")}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  function handleDownloadReportText() {
    const reportText = formatActiveReportForExport();
    const safeTitle = (caseItem?.title ?? "pressesjekk-rapport").toLowerCase().replace(/[^a-z0-9æøå]+/gi, "-").replace(/^-+|-+$/g, "");

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${safeTitle}-${activeReportTitle.toLowerCase().replace(/[^a-z0-9æøå]+/gi, "-").replace(/^-+|-+$/g, "")}.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  async function handleGenerateAiReport() {
    if (!caseItem) return;

    setIsGeneratingAiReport(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      setErrorMessage("Du må være innlogget for å generere KI-rapport.");
      setIsGeneratingAiReport(false);
      return;
    }

    const response = await fetch(`/api/cases/${params.id}/generate-report`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
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
    setCaseItem((current) => (current ? { ...current, status: "report_ready" } : current));
    setSuccessMessage(`KI-rapport v${generatedReport.version} er generert og lagret.`);
    setIsGeneratingAiReport(false);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">Laster full rapport...</p>
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
          <Link href="/min-side" className="text-sm font-semibold text-red-700 hover:text-red-900">
            ← Tilbake til Min Side
          </Link>

          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">Feil</p>
            <h1 className="mt-3 text-3xl font-black text-red-950">Kunne ikke åpne full rapport</h1>
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
        <Link href="/min-side" className="text-sm font-semibold text-red-700 hover:text-red-900">
          ← Tilbake til Min Side
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-700">
              {isJournalist ? "Redaksjonell sjekk" : "Full rapport"}
            </p>

            <h1 className="mt-4 max-w-4xl [text-wrap:balance] text-4xl font-black sm:text-5xl tracking-tight text-slate-950 md:text-7xl">
              {isJournalist ? "Redaksjonell sjekk" : "Full rapport"}
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              {isJournalist
                ? "Samle publiseringsgrunnlag, kilder, dokumentasjon, tilsvar og redaksjonelle vurderinger på ett sted, og bygg den redaksjonelle rapporten når grunnlaget er klart."
                : "Samle saksopplysninger, påstander, tidslinje og vitner på ett sted, og bygg rapporten når grunnlaget er klart - alt på denne siden."}
            </p>

            {/* Saksopplysninger */}
            {isEditingInputs ? (
              <form onSubmit={handleSubmit} className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">Opplysninger</p>
                <h2 className="mt-3 text-4xl font-black text-slate-950">{isJournalist ? "Hva skal kvalitetssikres?" : "Hva bør vurderes?"}</h2>

                <div className="mt-8 grid gap-6">
                  <div>
                    <label htmlFor="articleText" className="text-sm font-bold text-slate-800">
                      {isJournalist ? "Publiseringsutkast eller artikkeltekst" : "Artikkeltekst eller utdrag"}
                    </label>
                    <textarea
                      id="articleText"
                      rows={7}
                      value={articleText}
                      onChange={(event) => setArticleText(event.target.value)}
                      placeholder={
                        isJournalist
                          ? "Lim inn publiseringsutkast, artikkeltekst eller relevante utdrag her..."
                          : "Lim inn artikkeltekst eller relevante utdrag her..."
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="whatHappened" className="text-sm font-bold text-slate-800">
                      {isJournalist ? "Redaksjonell problemstilling" : "Hva skjedde?"}
                    </label>
                    <textarea
                      id="whatHappened"
                      rows={5}
                      value={whatHappened}
                      onChange={(event) => setWhatHappened(event.target.value)}
                      placeholder={
                        isJournalist
                          ? "Forklar hva som bør kvalitetssikres: fakta, kildegrunnlag, vinkling, tilsvar, identifisering eller publiseringsrisiko..."
                          : "Forklar kort hva saken handler om, og hva du mener bør undersøkes..."
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>

                  {!isJournalist ? (
                    <div>
                      <label htmlFor="yourRole" className="text-sm font-bold text-slate-800">
                        Din rolle i saken
                      </label>
                      <select
                        id="yourRole"
                        value={yourRole}
                        onChange={(event) => setYourRole(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
                      >
                        <option value="">Velg rolle i saken</option>
                        {yourRole && !caseRoleOptions.includes(yourRole) ? <option value={yourRole}>{yourRole}</option> : null}
                        {caseRoleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Dette gjelder rollen din i denne konkrete saken. Profilrollen din lagres separat på profilsiden.
                      </p>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={replySent}
                        onChange={(event) => setReplySent(event.target.checked)}
                        className="mt-1 h-5 w-5 rounded border-slate-300"
                      />
                      <span>
                        <span className="block font-black text-slate-950">
                          {isJournalist ? "Kontakt med berørt part er gjennomført" : "Tilsvar eller svar er sendt til redaksjonen"}
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-slate-600">
                          {isJournalist
                            ? "Huk av hvis berørt part, kilde, omtalt person eller virksomhet er kontaktet for kommentar, tilsvar eller samtidig imøtegåelse."
                            : "Huk av hvis du har bedt om retting, tilsvar, samtidig imøtegåelse eller sendt annen henvendelse."}
                        </span>
                      </span>
                    </label>
                  </div>

                  <div>
                    <label htmlFor="replyText" className="text-sm font-bold text-slate-800">
                      {isJournalist ? "Kontakt med kilde eller berørt part" : "Tilsvar eller henvendelse til redaksjonen"}
                    </label>
                    <textarea
                      id="replyText"
                      rows={6}
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      placeholder={
                        isJournalist
                          ? "Lim inn eller oppsummer spørsmål, tilsvar, sitatsjekk, samtidig imøtegåelse eller kontakt med berørt part..."
                          : "Lim inn eller oppsummer hva du sendte til redaksjonen..."
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="editorResponse" className="text-sm font-bold text-slate-800">
                      {isJournalist ? "Svar fra kilde eller berørt part" : "Svar fra redaksjonen"}
                    </label>
                    <textarea
                      id="editorResponse"
                      rows={5}
                      value={editorResponse}
                      onChange={(event) => setEditorResponse(event.target.value)}
                      placeholder={
                        isJournalist
                          ? "Skriv kort hva kilden eller den berørte parten svarte, eller lim inn relevant svar..."
                          : "Skriv kort hva redaksjonen svarte, eller lim inn relevant svar..."
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="legalStatus" className="text-sm font-bold text-slate-800">
                      {isJournalist ? "Risiko/status" : "Rettsstatus"}
                    </label>
                    <select
                      id="legalStatus"
                      value={legalStatus}
                      onChange={(event) => setLegalStatus(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
                    >
                      <option value="">{isJournalist ? "Velg status" : "Velg rettsstatus"}</option>
                      <option value="not_relevant">Ikke relevant</option>
                      <option value="unknown">Uavklart</option>
                      <option value="reported">Anmeldt</option>
                      <option value="dismissed">Henlagt</option>
                      <option value="court_case">Rettssak</option>
                      <option value="judgment">Dom/avgjørelse</option>
                      <option value="appeal">Klage/anke</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="legalStatusDetails" className="text-sm font-bold text-slate-800">
                      {isJournalist ? "Detaljer om risiko/status" : "Detaljer om rettsstatus"}
                    </label>
                    <textarea
                      id="legalStatusDetails"
                      rows={5}
                      value={legalStatusDetails}
                      onChange={(event) => setLegalStatusDetails(event.target.value)}
                      placeholder={
                        isJournalist
                          ? "Forklar kort om det finnes publiseringsrisiko, uavklarte fakta, kildekonflikt, identifisering, rettslig prosess eller andre forhold..."
                          : "Forklar kort om saken er anmeldt, henlagt, avgjort, påklaget eller annet..."
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="documentationSummary" className="text-sm font-bold text-slate-800">
                      Egne notater til saken
                    </label>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Din egen forventning eller kontekst for saken som helhet - ikke et faktum. Dokumenter lastes opp i Dokumentasjon til
                      høyre. Hvis notatet gjelder ett bestemt dokument, bruk «Hva ønsker du at vi særlig skal se etter» på dokumentet i
                      stedet.
                    </p>
                    <textarea
                      id="documentationSummary"
                      rows={4}
                      value={documentationSummary}
                      onChange={(event) => setDocumentationSummary(event.target.value)}
                      placeholder={isJournalist ? "Egne notater, kildevurderinger eller kontekst du vil fremheve..." : "Egne notater eller kontekst du vil fremheve..."}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="desiredOutcome" className="text-sm font-bold text-slate-800">
                      {isJournalist ? "Ønsket redaksjonell avklaring" : "Hva ønsker du å oppnå?"}
                    </label>
                    <textarea
                      id="desiredOutcome"
                      rows={4}
                      value={desiredOutcome}
                      onChange={(event) => setDesiredOutcome(event.target.value)}
                      placeholder={
                        isJournalist
                          ? "F.eks. styrke faktagrunnlag, avklare vinkling, redusere publiseringsrisiko, sikre tilsvar eller dokumentere redaksjonelle vurderinger..."
                          : "F.eks. retting, tilsvar, beklagelse, avindeksering, PFU-klage eller bedre dokumentasjon..."
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>

                  {saveMessage ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-900">{saveMessage}</div>
                  ) : null}

                  {errorMessage ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">{errorMessage}</div>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isSavingInputs}
                      className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingInputs ? "Lagrer..." : "Lagre opplysninger"}
                    </button>

                    <Link
                      href={`/min-side/saker/${params.id}`}
                      className="rounded-2xl border border-slate-300 bg-white px-6 py-4 font-black text-slate-950 hover:bg-slate-100"
                    >
                      Til saken
                    </Link>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">Opplysninger</p>

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <h2 className="mt-3 text-4xl font-black text-slate-950">
                    {isJournalist ? "Fakta, kilder og redaksjonell dokumentasjon" : "Fakta, tilsvar og dokumentasjon"}
                  </h2>

                  <button
                    type="button"
                    onClick={() => {
                      setSaveMessage("");
                      setIsEditingInputs(true);
                    }}
                    className="mt-3 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800"
                  >
                    Rediger saksopplysninger
                  </button>
                </div>

                <p className="mt-4 max-w-3xl leading-8 text-slate-700">
                  {isJournalist
                    ? "Dette er publiseringsgrunnlaget som brukes videre som grunnlag for redaksjonell sjekk, dokumentasjon og presseetisk vurdering."
                    : "Dette er opplysningene som brukes videre som grunnlag for rapport, PFU-klage og dokumentasjon."}
                </p>

                {saveMessage ? (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-900">{saveMessage}</div>
                ) : null}

                <div className="mt-8 grid gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Artikkeltekst eller utdrag</p>
                    <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">{articleText || "Ikke lagt inn ennå."}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                      {isJournalist ? "Redaksjonell problemstilling" : "Hva skjedde?"}
                    </p>
                    <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">{whatHappened || "Ikke lagt inn ennå."}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">{isJournalist ? "Sjekkpunkt" : "Din rolle"}</p>
                      <p className="mt-3 text-lg font-black text-slate-950">{isJournalist ? "Redaksjonell vurdering" : yourRole || "Ikke satt"}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                        {isJournalist ? "Berørt part kontaktet" : "Tilsvar sendt"}
                      </p>
                      <p className="mt-3 text-lg font-black text-slate-950">{replySent ? "Ja" : "Nei / ikke registrert"}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                      {isJournalist ? "Kontakt med kilde eller berørt part" : "Tilsvar eller henvendelse"}
                    </p>
                    <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">{replyText || "Ikke lagt inn ennå."}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                      {isJournalist ? "Svar fra kilde eller berørt part" : "Svar fra redaksjonen"}
                    </p>
                    <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">{editorResponse || "Ikke lagt inn ennå."}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">{isJournalist ? "Risiko/status" : "Rettsstatus"}</p>
                      <p className="mt-3 text-lg font-black text-slate-950">{legalStatusLabel(legalStatus)}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Ønsket resultat</p>
                      <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">{desiredOutcome || "Ikke lagt inn ennå."}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                      {isJournalist ? "Detaljer om risiko/status" : "Detaljer om rettsstatus"}
                    </p>
                    <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">{legalStatusDetails || "Ikke lagt inn ennå."}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Egne notater til saken</p>
                    <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">{documentationSummary || "Ikke lagt inn ennå."}</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`/min-side/saker/${params.id}`}
                    className="rounded-2xl border border-slate-300 bg-white px-6 py-4 font-black text-slate-950 hover:bg-slate-100"
                  >
                    Til saken
                  </Link>
                </div>
              </div>
            )}

            {/* Påstander → Tidslinje → Vitner */}
            <div className="mt-8">
              <ClaimsPanel caseId={params.id} onFocusClaim={(claimId, claimText) => setFocusedContext({ type: "claim", id: claimId, label: claimText })} />
            </div>

            <div className="mt-8">
              <TimelinePanel caseId={params.id} onFocusEvent={(eventId, eventTitle) => setFocusedContext({ type: "event", id: eventId, label: eventTitle })} />
            </div>

            <div className="mt-8">
              <WitnessesPanel
                caseId={params.id}
                onFocusWitness={(accountId, witnessLabel) => setFocusedContext({ type: "witness", id: accountId, label: witnessLabel })}
              />
            </div>

            <DocumentationInsightsPanel caseId={params.id} />

            {/* Generer og vis rapport */}
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">Rapport</p>

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="mt-3 text-4xl font-black text-slate-950">Generer full rapport</h2>
                  <p className="mt-4 max-w-3xl leading-8 text-slate-700">
                    Når nok grunnlag er på plass over, kan du generere rapporten. Den vises nedenfor på samme side - ingen egen rapport-side.
                  </p>
                </div>

                <div className="mt-6 grid w-full grid-cols-2 gap-3 sm:mt-3 sm:flex sm:w-auto sm:flex-wrap">
                  <button
                    type="button"
                    onClick={handleGenerateAiReport}
                    disabled={isGeneratingAiReport}
                    className="col-span-2 w-full rounded-2xl bg-red-500 px-5 py-4 text-center text-base font-black text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-1 sm:w-auto sm:py-3 sm:text-sm"
                  >
                    {isGeneratingAiReport ? "Genererer..." : "Generer rapport med KI"}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadReportPdf}
                    disabled={!activeReport}
                    className="col-span-1 w-full rounded-2xl border border-red-300 bg-red-50 px-2 py-4 text-center text-base font-black text-red-900 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5 sm:py-3 sm:text-sm"
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

              {isStructuredReport && activeStructuredSections.length > 0 ? (
                <div className="mt-8 max-h-[900px] overflow-auto rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
                  <StructuredReportView sections={activeStructuredSections} builtFrom={activeBuiltFrom} />
                </div>
              ) : (
                <pre className="mt-8 max-h-[900px] overflow-auto whitespace-pre-wrap rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-800 sm:p-7">
                  {formatActiveReportForExport()}
                </pre>
              )}

              {errorMessage ? (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{errorMessage}</div>
              ) : null}

              {successMessage ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{successMessage}</div>
              ) : null}
            </div>
          </section>

          <CaseSidebar
            caseId={params.id}
            statusLabel={caseItem ? statusLabel(caseItem.status) : "Utkast"}
            activeStep="full-rapport"
            workflowType={workflowType}
            currentPackageId={caseAccessPackageId ?? undefined}
            stepsDone={{
              caseRegistered: true,
              caseInputs: Boolean(caseInputId),
              report: reports.length > 0,
              pfuDraft: allReports.some((report) => report.report_type === "pfu_draft"),
              pfuDecision: Boolean(pfuDecision?.decision_received || pfuDecision?.uploaded_file_name),
              policeReport: allReports.some((report) => report.report_type === "police_draft"),
              investigation: allReports.some((report) => report.report_type === "investigation_draft"),
            }}
            documentation={<EvidenceWorkspacePanel caseId={params.id} focusedContext={focusedContext} onClearFocus={() => setFocusedContext(null)} />}
            statusTitle="Status"
            statusItems={[
              {
                label: "Opplysninger",
                value: caseInputId ? "Lagret" : "Ikke lagret ennå",
                tone: caseInputId ? "success" : "neutral",
              },
              {
                label: "Rapportversjoner",
                value: reports.length > 0 ? `${reports.length} lagret` : "Ingen lagret",
                tone: reports.length > 0 ? "success" : "neutral",
              },
            ]}
            statusContent={
              reports.length === 0 ? undefined : (
                <div className="grid gap-3">
                  {visibleReports.map((report) => {
                    const isSelected = activeReport?.id === report.id;

                    return (
                      <button
                        key={`${report.id}-${report.version}`}
                        type="button"
                        onClick={() => setSelectedReportId(report.id)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          isSelected ? "border-red-500 bg-red-50 shadow-sm" : "border-slate-200 bg-slate-50 hover:bg-red-50"
                        }`}
                      >
                        <p className="font-black text-slate-950">
                          {report.report_type === "full_report" ? `KI-rapport v${report.version}` : `Regelbasert rapport v${report.version}`}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-600">{formatDate(report.created_at)}</p>
                        {isSelected ? <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-red-700">Vises nå</p> : null}
                      </button>
                    );
                  })}

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
              )
            }
            nextStep={
              isJournalistWorkflow
                ? {
                    title: "Fra rapport til handling",
                    description: "Bruk den redaksjonelle rapporten som dokumentasjon i det videre arbeidet med publiseringsgrunnlaget.",
                    primary: { label: "Til saken", href: `/min-side/saker/${params.id}` },
                  }
                : {
                    title: "Fra rapport til handling",
                    description:
                      "Etter at rapportutkastet er lagret, kan saken brukes videre som grunnlag for PFU-klage, politianmeldelse eller utredning.",
                    primary: { label: "Gå til PFU-klage", href: `/min-side/saker/${params.id}/pfu` },
                    secondary: { label: "Til saken", href: `/min-side/saker/${params.id}` },
                  }
            }
          />
        </div>
      </section>

      <LightPublicFooter />
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { CaseWorkflowCard } from "@/components/cases/CaseWorkflowCard";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";
import type { PackagePlanId } from "@/data/packagePlans";

type CaseAccessRow = {
  package_id: PackagePlanId;
  status: "active" | "pending" | "cancelled" | "expired";
};

type CaseRow = {
  id: string;
  title: string | null;
  status: string | null;
  media_name: string | null;
  article_title: string | null;
  short_description: string | null;
};

type CaseInputRow = {
  id: string;
};

type CaseReportRow = {
  id: string;
  version: number | null;
  report_type:
    | "free_check"
    | "full_report"
    | "pfu_draft"
    | "police_draft"
    | "investigation_draft";
  investigation_draft: string | null;
  status: "draft" | "ready" | "archived" | null;
  created_at: string | null;
};

type PfuDecisionRow = {
  decision_received: boolean | null;
  uploaded_file_name: string | null;
};

export default function InvestigationPage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [caseAccessPackageId, setCaseAccessPackageId] =
    useState<PackagePlanId | null>(null);
  const [workflowType, setWorkflowType] = useState<"standard" | "journalist">(
    "standard"
  );
  const [caseItem, setCaseItem] = useState<CaseRow | null>(null);
  const [caseInput, setCaseInput] = useState<CaseInputRow | null>(null);
  const [reports, setReports] = useState<CaseReportRow[]>([]);
  const [investigationDrafts, setInvestigationDrafts] = useState<CaseReportRow[]>(
    []
  );
  const [selectedInvestigationDraftId, setSelectedInvestigationDraftId] =
    useState<string | null>(null);
  const [pfuDecision, setPfuDecision] = useState<PfuDecisionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingInvestigation, setIsGeneratingInvestigation] =
    useState(false);
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
        .select("id,title,status,media_name,article_title,short_description")
        .eq("id", params.id)
        .single();

      if (caseError) {
        setErrorMessage(caseError.message);
        setIsLoading(false);
        return;
      }

      setCaseItem(caseData as CaseRow);

      const { data: inputData } = await supabase
        .from("case_inputs")
        .select("id")
        .eq("case_id", params.id)
        .maybeSingle();

      setCaseInput((inputData as CaseInputRow | null) ?? null);

      const { data: reportsData } = await supabase
        .from("case_reports")
        .select("id,version,report_type,investigation_draft,status,created_at")
        .eq("case_id", params.id)
        .order("version", { ascending: false });

      const loadedReports = (reportsData ?? []) as CaseReportRow[];

      setReports(loadedReports);

      const loadedInvestigationDrafts = loadedReports.filter(
        (report) => report.report_type === "investigation_draft"
      );

      setInvestigationDrafts(loadedInvestigationDrafts);
      setSelectedInvestigationDraftId(
        loadedInvestigationDrafts[0]?.id ?? null
      );

      const { data: decisionData } = await supabase
        .from("pfu_decisions")
        .select("decision_received,uploaded_file_name")
        .eq("case_id", params.id)
        .maybeSingle();

      setPfuDecision((decisionData as PfuDecisionRow | null) ?? null);
      setIsLoading(false);
    }

    loadData();
  }, [params.id]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="font-semibold text-slate-600">Laster utredningspakke...</p>
        </section>
        <LightPublicFooter />
      </main>
    );
  }

  if (errorMessage || !caseItem || !user) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="font-semibold text-red-700">
            {errorMessage || "Fant ikke saken."}
          </p>
        </section>
        <LightPublicFooter />
      </main>
    );
  }

  const activeInvestigationDraft =
    investigationDrafts.find(
      (draft) => draft.id === selectedInvestigationDraftId
    ) ?? investigationDrafts[0] ?? null;

  const activeInvestigationDraftText =
    activeInvestigationDraft?.investigation_draft ||
    "Ingen utredning er generert ennå. Trykk på «Generer utredning med KI» for å lage et samlet utredningsutkast basert på saken, saksopplysningene, rapportene, PFU-klagen, PFU-avgjørelsen, politianmeldelsen og dokumentene som allerede er lagt inn.";

  const isJournalistWorkflow = workflowType === "journalist";

  async function handleGenerateInvestigationDraft() {
    setIsGeneratingInvestigation(true);
    setErrorMessage("");
    setSuccessMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setErrorMessage("Du må være innlogget for å generere utredning.");
      setIsGeneratingInvestigation(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/cases/${params.id}/generate-investigation-draft`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error ?? "Kunne ikke generere utredning.");
        setIsGeneratingInvestigation(false);
        return;
      }

      const newReport = data.report as CaseReportRow;

      setInvestigationDrafts((current) => [newReport, ...current]);
      setReports((current) => [newReport, ...current]);
      setSelectedInvestigationDraftId(newReport.id);
      setSuccessMessage("Utredningsutkastet ble generert og lagret.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Ukjent feil ved generering av utredning.";

      setErrorMessage(message);
    } finally {
      setIsGeneratingInvestigation(false);
    }
  }

  async function handleDownloadPdf() {
    if (!activeInvestigationDraft?.id) return;

    setErrorMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setErrorMessage("Du må være innlogget for å laste ned PDF.");
      return;
    }

    const response = await fetch(
      `/api/cases/${params.id}/reports/${activeInvestigationDraft.id}/pdf`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setErrorMessage(data?.error ?? "Kunne ikke laste ned PDF.");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `pressesjekk-utredning-v${
      activeInvestigationDraft.version ?? "1"
    }.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  function handleDownloadText() {
    if (!activeInvestigationDraft?.investigation_draft) return;

    const blob = new Blob([activeInvestigationDraft.investigation_draft], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `pressesjekk-utredning-v${
      activeInvestigationDraft.version ?? "1"
    }.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  if (isJournalistWorkflow) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Link
            href={`/min-side/saker/${params.id}`}
            className="text-sm font-semibold text-red-700 hover:text-red-900"
          >
            ← Tilbake til saken
          </Link>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
            <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm sm:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-800">
                Redaksjonell sjekk
              </p>

              <h1 className="mt-4 max-w-4xl [text-wrap:balance] text-4xl font-black sm:text-5xl tracking-tight text-slate-950 md:text-6xl">
                Utredningspakke er ikke del av redaksjonelt forhåndsløp
              </h1>

              <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
                Denne siden er laget for større saker etter publisering, der en
                omtalt person, virksomhet eller pårørende trenger samlet
                dokumentasjon, tidslinje og videre vurdering. For journalist og
                redaksjon bør hovedløpet være publiseringsgrunnlag, redaksjonell
                rapport, VVP-risiko og kvalitetssikring før publisering.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/min-side/saker/${params.id}/rapport`}
                  className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800"
                >
                  Gå til redaksjonell rapport
                </Link>

                <Link
                  href={`/min-side/saker/${params.id}/opplysninger`}
                  className="rounded-2xl border border-red-300 bg-white px-6 py-4 font-black text-red-900 hover:bg-red-50"
                >
                  Gå til publiseringsgrunnlag
                </Link>

                <Link
                  href={`/min-side/saker/${params.id}/pakke`}
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-4 font-black text-slate-950 hover:bg-slate-100"
                >
                  Se redaksjonelle pakker
                </Link>
              </div>
            </section>

            <aside className="grid content-start gap-6">
              <CaseWorkflowCard
                caseId={params.id}
                statusLabel={
                  caseItem.status === "report_ready" ? "Rapport klar" : "Utkast"
                }
                activeStep="rapport"
                workflowType="journalist"
                currentPackageId={caseAccessPackageId ?? undefined}
                stepsDone={{
                  caseRegistered: true,
                  caseInputs: Boolean(caseInput),
                  report: reports.some(
                    (report) =>
                      report.report_type === "free_check" ||
                      report.report_type === "full_report"
                  ),
                  pfuDraft: false,
                  pfuDecision: false,
                  policeReport: false,
                  investigation: false,
                }}
              />

              <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-300">
                  Riktig arbeidsflyt
                </p>
                <h2 className="mt-3 text-3xl font-black">
                  Før publisering
                </h2>
                <p className="mt-4 leading-8 text-slate-300">
                  For redaksjoner bør vurderingen samles i rapport og
                  publiseringsgrunnlag. Utredning, PFU, PFU-avgjørelse og
                  politianmeldelse er etter-publisering-løp for andre roller.
                </p>
              </div>
            </aside>
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
          className="text-sm font-semibold text-red-700 hover:text-red-900"
        >
          ← Tilbake til Min Side
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-700">
              Utredningspakke
            </p>

            <h1 className="mt-4 max-w-4xl [text-wrap:balance] text-4xl font-black sm:text-5xl tracking-tight text-slate-950 md:text-7xl">
              Komplett utredning
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Utredningspakken brukes for større eller mer alvorlige mediesaker
              der saken bør settes sammen som et komplett, kronologisk og
              dokumentert grunnlag for videre vurdering.
            </p>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
                Utredningspakke
              </p>

              <h2 className="mt-3 text-4xl font-black text-slate-950">
                {activeInvestigationDraft
                  ? `Utredning v${activeInvestigationDraft.version ?? ""}`
                  : "Utredning"}
              </h2>

              <p className="mt-4 max-w-3xl leading-8 text-slate-700">
                {activeInvestigationDraft
                  ? "Dette er valgt lagret utredning. Du kan laste ned PDF, laste ned tekst eller generere en ny versjon."
                  : "Generer et samlet KI-basert utredningsutkast basert på saken, dokumentasjonen, rapporten, PFU-klagen, PFU-avgjørelsen og politianmeldelsen."}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                <button
                  type="button"
                  onClick={handleGenerateInvestigationDraft}
                  disabled={isGeneratingInvestigation}
                  className="col-span-2 w-full rounded-2xl bg-red-500 px-5 py-4 text-center text-base font-black text-slate-950 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-1 sm:w-auto sm:py-3 sm:text-sm"
                >
                  {isGeneratingInvestigation
                    ? "Genererer..."
                    : "Generer utredning med KI"}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={!activeInvestigationDraft?.investigation_draft}
                  className="col-span-1 w-full rounded-2xl border border-red-300 bg-red-50 px-3 py-4 text-center text-base font-black text-red-900 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5 sm:py-3 sm:text-sm"
                >
                  Last ned PDF
                </button>

                <button
                  type="button"
                  onClick={handleDownloadText}
                  disabled={!activeInvestigationDraft?.investigation_draft}
                  className="col-span-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-4 text-center text-base font-black text-slate-950 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5 sm:py-3 sm:text-sm"
                >
                  Last ned tekst
                </button>
              </div>

              <pre className="mt-8 max-h-[900px] overflow-auto whitespace-pre-wrap rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-800 sm:p-7">
                {activeInvestigationDraftText}
              </pre>

              {successMessage ? (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-900">
                  {successMessage}
                </div>
              ) : null}

              {errorMessage ? (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">
                  {errorMessage}
                </div>
              ) : null}
            </div>
          </section>

          <aside className="grid gap-6">
            <CaseWorkflowCard
              caseId={params.id}
              statusLabel={
                caseItem.status === "report_ready" ? "Rapport klar" : "Utkast"
              }
              activeStep="utredning"
              workflowType={workflowType}
              currentPackageId={caseAccessPackageId ?? undefined}
              stepsDone={{
                caseRegistered: true,
                caseInputs: Boolean(caseInput),
                report: reports.some(
                  (report) =>
                    report.report_type === "free_check" ||
                    report.report_type === "full_report"
                ),
                pfuDraft: reports.some((report) => report.report_type === "pfu_draft"),
                pfuDecision: Boolean(
                  pfuDecision?.decision_received || pfuDecision?.uploaded_file_name
                ),
                policeReport: reports.some(
                  (report) => report.report_type === "police_draft"
                ),
                investigation: investigationDrafts.length > 0,
              }}
            />

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
                Lagrede utredninger
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                {investigationDrafts.length > 0
                  ? `${investigationDrafts.length} lagret`
                  : "Ingen lagret"}
              </h2>

              <div className="mt-5 grid gap-3">
                {investigationDrafts.length > 0 ? (
                  investigationDrafts.map((draft) => (
                    <button
                      key={draft.id}
                      type="button"
                      onClick={() => setSelectedInvestigationDraftId(draft.id)}
                      className={`rounded-2xl border p-4 text-left ${
                        selectedInvestigationDraftId === draft.id
                          ? "border-red-500 bg-red-50"
                          : "border-slate-200 bg-slate-50 hover:bg-white"
                      }`}
                    >
                      <p className="font-black text-slate-950">
                        Utredning v{draft.version ?? ""}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {draft.created_at
                          ? new Date(draft.created_at).toLocaleDateString("nb-NO")
                          : "Ukjent dato"}
                      </p>
                      {selectedInvestigationDraftId === draft.id ? (
                        <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-red-700">
                          Vises nå
                        </p>
                      ) : null}
                    </button>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    Generer første utredningsutkast for å lagre en versjon.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-300">
                Komplett dokumentpakke
              </p>
              <h2 className="mt-3 text-3xl font-black">
                Din mest komplette oversikt
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                Med eller uten PFU-klage og politianmeldelse er
                utredningspakken din samlede versjon av saken. Målet er å samle
                dokumentasjon, tidslinje, vurderinger og vedlegg i én
                profesjonell PDF.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <LightPublicFooter />
    </main>
  );
}

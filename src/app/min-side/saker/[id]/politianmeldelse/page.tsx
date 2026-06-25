"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  short_description: string | null;
};

type CaseReportRow = {
  id: string;
  version: number;
  report_type: "free_check" | "full_report" | "pfu_draft" | "police_draft" | "investigation_draft";
  police_draft: string | null;
  status: "draft" | "ready" | "archived";
  created_at: string;
};

type CaseInputRow = {
  id: string;
};

type PfuDecisionRow = {
  id: string;
  decision_received: boolean | null;
  uploaded_file_name: string | null;
};

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

export default function PoliceReportPage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [caseAccessPackageId, setCaseAccessPackageId] =
    useState<PackagePlanId | null>(null);
  const [workflowType, setWorkflowType] = useState<"standard" | "journalist">("standard");
  const [caseItem, setCaseItem] = useState<CaseRow | null>(null);
  const [caseInput, setCaseInput] = useState<CaseInputRow | null>(null);
  const [reports, setReports] = useState<CaseReportRow[]>([]);
  const [policeDrafts, setPoliceDrafts] = useState<CaseReportRow[]>([]);
  const [selectedPoliceDraftId, setSelectedPoliceDraftId] = useState<string | null>(null);
  const [pfuDecision, setPfuDecision] = useState<PfuDecisionRow | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPoliceDraft, setIsGeneratingPoliceDraft] = useState(false);
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

      const { data: allReportsData } = await supabase
        .from("case_reports")
        .select("id,version,report_type,police_draft,status,created_at")
        .eq("case_id", params.id)
        .order("version", { ascending: false });

      const loadedReports = (allReportsData ?? []) as CaseReportRow[];
      const loadedPoliceDrafts = loadedReports.filter(
        (report) => report.report_type === "police_draft"
      );

      setReports(loadedReports);
      setPoliceDrafts(loadedPoliceDrafts);
      setSelectedPoliceDraftId(loadedPoliceDrafts[0]?.id ?? null);

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

  const activePoliceDraft =
    policeDrafts.find((draft) => draft.id === selectedPoliceDraftId) ??
    policeDrafts[0] ??
    null;

  const activePoliceDraftText =
    activePoliceDraft?.police_draft ||
    "Ingen politianmeldelse er generert ennå. Trykk på «Generer politianmeldelse med KI» for å lage et utkast.";

  async function handleGeneratePoliceDraft() {
    if (!caseItem) return;

    setIsGeneratingPoliceDraft(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    const accessToken = sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      setErrorMessage("Du må være innlogget for å generere politianmeldelse.");
      setIsGeneratingPoliceDraft(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/cases/${params.id}/generate-police-report-draft`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        setErrorMessage(
          payload?.error ?? `Kunne ikke generere utkast. Status: ${response.status}`
        );
        return;
      }

      if (!payload.report) {
        setErrorMessage(
          "KI-utkastet ble generert, men ble ikke lagret som rapportversjon."
        );
        return;
      }

      const generatedDraft = payload.report as CaseReportRow;

      setPoliceDrafts((current) => [generatedDraft, ...current]);
      setReports((current) => [generatedDraft, ...current]);
      setSelectedPoliceDraftId(generatedDraft.id);
      setSuccessMessage(`Politianmeldelse v${generatedDraft.version} er generert og lagret.`);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Kunne ikke generere politianmeldelse.");
      }
    } finally {
      setIsGeneratingPoliceDraft(false);
    }
  }

  function handleDownloadPoliceDraftText() {
    const safeTitle = (caseItem?.title ?? "pressesjekk-politianmeldelse")
      .toLowerCase()
      .replace(/[^a-z0-9æøå]+/gi, "-")
      .replace(/^-+|-+$/g, "");

    const blob = new Blob([activePoliceDraftText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${safeTitle}-${activePoliceDraft
      ? `politianmeldelse-v${activePoliceDraft.version}`
      : "politianmeldelse"}.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  async function handleDownloadPoliceDraftPdf() {
    if (!activePoliceDraft) {
      setErrorMessage("Du må velge et lagret politianmeldelse før du kan laste ned PDF.");
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

    const response = await fetch(
      `/api/cases/${params.id}/reports/${activePoliceDraft.id}/pdf`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setErrorMessage(payload?.error ?? `Kunne ikke lage PDF. Status: ${response.status}`);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const safeTitle = (caseItem?.title ?? "pressesjekk-politianmeldelse")
      .toLowerCase()
      .replace(/[^a-z0-9æøå]+/gi, "-")
      .replace(/^-+|-+$/g, "");

    link.href = url;
    link.download = `${safeTitle}-politianmeldelse-v${activePoliceDraft.version}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              Laster politianmeldelse...
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
              Kunne ikke åpne politianmeldelse
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
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          ← Tilbake til Min Side
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Politianmeldelse
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Vurdering av politianmeldelse
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Dette steget bruker informasjonen fra saken, rapporten,
              PFU-klagen og eventuell PFU-avgjørelse til å lage et nøkternt
              politianmeldelse. Utkastet er ikke juridisk rådgivning og må
              kvalitetssikres før eventuell innsending.
            </p>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Politianmeldelse
              </p>

              <h2 className="mt-3 text-4xl font-black text-slate-950">
                {activePoliceDraft
                  ? `Politianmeldelse v${activePoliceDraft.version}`
                  : "Politianmeldelse"}
              </h2>

              <p className="mt-4 max-w-3xl leading-8 text-slate-700">
                {activePoliceDraft
                  ? "Dette er valgt lagret politianmeldelse. Du kan laste ned PDF, laste ned tekst eller generere en ny versjon."
                  : "Generer et KI-basert politianmeldelse som kan brukes som arbeidsgrunnlag før eventuell politianmeldelse eller videre vurdering."}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                <button
                  type="button"
                  onClick={handleGeneratePoliceDraft}
                  disabled={isGeneratingPoliceDraft}
                  className="col-span-2 w-full rounded-2xl bg-cyan-500 px-5 py-4 text-center text-base font-black text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-1 sm:w-auto sm:py-3 sm:text-sm"
                >
                  {isGeneratingPoliceDraft
                    ? "Genererer..."
                    : "Generer politianmeldelse med KI"}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPoliceDraftPdf}
                  disabled={!activePoliceDraft}
                  className="col-span-1 w-full rounded-2xl border border-cyan-300 bg-cyan-50 px-3 py-4 text-center text-base font-black text-cyan-900 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5 sm:py-3 sm:text-sm"
                >
                  Last ned PDF
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPoliceDraftText}
                  className="col-span-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-4 text-center text-base font-black text-slate-950 hover:bg-slate-100 sm:w-auto sm:px-5 sm:py-3 sm:text-sm"
                >
                  Last ned tekst
                </button>
              </div>

              <pre className="mt-8 max-h-[900px] overflow-auto whitespace-pre-wrap rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-800 sm:p-7">
                {activePoliceDraftText}
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
                <Link
                  href={`/min-side/saker/${params.id}`}
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-4 font-black text-slate-950 hover:bg-slate-100"
                >
                  Til saken
                </Link>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
                7. Bestill utredningspakke
              </p>

              <h2 className="mt-3 text-4xl font-black text-slate-950">
                Erstatning og videre utredning
              </h2>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
                I større saker kan det være aktuelt å vurdere økonomisk tap,
                omdømmeskade, oppreisning og årsakssammenheng. Dette er normalt
                et eget sivilt spor som krever grundig dokumentasjon og manuell
                gjennomgang.
              </p>

              <p className="mt-4 max-w-3xl leading-8 text-slate-700">
                En utredningspakke kan gjennomgå publisering, tidslinje,
                dokumentasjon, mulig tap, PFU-spor, rettslige spørsmål og
                grunnlag for videre oppfølging. Pris fra kr 100 000 eks. mva.
                for større saker.
              </p>

              <Link
                href="/kontakt"
                className="mt-8 inline-flex rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800"
              >
                Bestill utredningspakke
              </Link>
            </div>
          </section>

          <aside className="grid content-start gap-6">
            <CaseWorkflowCard
              caseId={params.id}
              statusLabel={caseItem ? statusLabel(caseItem.status) : "Utkast"}
              activeStep="politianmeldelse"
            workflowType={workflowType}
              currentPackageId={caseAccessPackageId ?? undefined}
              stepsDone={{
                caseRegistered: true,
                caseInputs: Boolean(caseInput),
                report: reports.some((report) => report.report_type !== "pfu_draft"),
                pfuDraft: reports.some((report) => report.report_type === "pfu_draft"),
                pfuDecision: Boolean(
                  pfuDecision?.decision_received || pfuDecision?.uploaded_file_name
                ),
                policeReport: policeDrafts.length > 0,
                investigation: reports.some((report) => report.report_type === "investigation_draft"),
              }}
            />

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Lagrede politianmeldelser
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                {policeDrafts.length > 1
                  ? `${policeDrafts.length} lagret`
                  : policeDrafts.length === 1
                    ? "1 lagret"
                    : "Ingen lagret"}
              </h2>

              <div className="mt-5 grid gap-3">
                {policeDrafts.length === 0 ? (
                  <p className="leading-8 text-slate-700">
                    Ingen politianmeldelseer er lagret ennå. Generer et KI-utkast
                    når saken er klar for videre vurdering.
                  </p>
                ) : (
                  policeDrafts.map((draft) => {
                    const isSelected = activePoliceDraft?.id === draft.id;

                    return (
                      <button
                        key={`${draft.id}-${draft.version}`}
                        type="button"
                        onClick={() => setSelectedPoliceDraftId(draft.id)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? "border-cyan-400 bg-cyan-50 shadow-sm"
                            : "border-slate-200 bg-slate-50 hover:bg-cyan-50"
                        }`}
                      >
                        <p className="font-black text-slate-950">
                          Politianmeldelse v{draft.version}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          {formatDate(draft.created_at)}
                        </p>
                        {isSelected ? (
                          <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                            Vises nå
                          </p>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Viktig forbehold
              </p>
              <h2 className="mt-3 text-3xl font-black">
                En anmeldelse kan bli henlagt
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                Dersom saken vurderes videre som politianmeldelse eller annen
                oppfølging, bør grunnlaget være ryddig, dokumentert og nøkternt.
                En anmeldelse gir ingen garanti for etterforskning eller
                resultat.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <LightPublicFooter />
    </main>
  );
}

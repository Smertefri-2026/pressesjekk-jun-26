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

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role_type: string | null;
};

type CaseReportRow = {
  id: string;
  version: number;
  report_type: "free_check" | "full_report" | "pfu_draft" | "police_draft" | "investigation_draft";
  pfu_draft: string | null;
  status: "draft" | "ready" | "archived";
  created_at: string;
};

type PfuDecisionRow = {
  id: string;
  decision_received: boolean | null;
  uploaded_file_name: string | null;
};

function formatDate(date: string | null) {
  if (!date) return "Ikke satt";

  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
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

function roleTypeLabel(roleType: string | null) {
  if (!roleType) return "Ikke satt";
  if (roleType === "private_person") return "Privatperson";
  if (roleType === "advisor") return "Rådgiver";
  if (roleType === "lawyer") return "Advokat";
  if (roleType === "journalist") return "Journalist/redaksjon";
  if (roleType === "organization") return "Organisasjon/bedrift";
  return roleType;
}

function statusLabel(status: CaseRow["status"]) {
  if (status === "draft") return "Utkast";
  if (status === "in_progress") return "Under arbeid";
  if (status === "report_ready") return "Rapport klar";
  if (status === "closed") return "Lukket";
  return status;
}

export default function PfuDraftPage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [caseAccessPackageId, setCaseAccessPackageId] =
    useState<PackagePlanId | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [caseItem, setCaseItem] = useState<CaseRow | null>(null);
  const [caseInput, setCaseInput] = useState<CaseInputRow | null>(null);
  const [pfuDrafts, setPfuDrafts] = useState<CaseReportRow[]>([]);
  const [selectedPfuDraftId, setSelectedPfuDraftId] = useState<string | null>(null);
  const [reports, setReports] = useState<CaseReportRow[]>([]);
  const [pfuDecision, setPfuDecision] = useState<PfuDecisionRow | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAiDraft, setIsGeneratingAiDraft] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
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
        .select("id,full_name,email,role_type")
        .eq("id", user.id)
        .maybeSingle();

      setProfile((profileData as ProfileRow | null) ?? null);

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
        .select("id,version,report_type,pfu_draft,status,created_at")
        .eq("case_id", params.id)
        .eq("report_type", "pfu_draft")
        .order("version", { ascending: false });

      if (reportError) {
        setErrorMessage(reportError.message);
        setIsLoading(false);
        return;
      }

      const loadedPfuDrafts = (reportData ?? []) as CaseReportRow[];
      setPfuDrafts(loadedPfuDrafts);
      setSelectedPfuDraftId(loadedPfuDrafts[0]?.id ?? null);

      const { data: allReportsData } = await supabase
        .from("case_reports")
        .select("id,version,report_type,pfu_draft,status,created_at")
        .eq("case_id", params.id);

      setReports((allReportsData ?? []) as CaseReportRow[]);

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

  const draftText = useMemo(() => {
    if (!caseItem) return "";

    return `PFU-KLAGE

Dette er et foreløpig utkast basert på opplysninger registrert i PresseSjekk. Utkastet må kontrolleres og tilpasses før eventuell innsending.

1. Klager
Navn:
${profile?.full_name || "[Fyll inn navn]"}

E-post:
${profile?.email || user?.email || "[Fyll inn e-post]"}

Profilrolle:
${roleTypeLabel(profile?.role_type ?? null)}

Rolle i saken:
${caseInput?.your_role || "[Fyll inn rolle i denne konkrete saken]"}

2. Innklaget medium
Medium:
${caseItem.media_name || "[Fyll inn mediehus]"}

3. Artikkel / publisering
Artikkeloverskrift:
${caseItem.article_title || caseItem.title}

Publiseringsdato:
${formatDate(caseItem.published_date)}

Lenke:
${caseItem.article_url || "[Fyll inn lenke hvis tilgjengelig]"}

4. Kort beskrivelse av saken
${caseInput?.what_happened || caseItem.short_description || "[Forklar kort hva saken gjelder, hva som er feil, misvisende eller problematisk, og hvorfor saken bør vurderes presseetisk.]"}

5. Tilsvar, kontakt med redaksjonen og samtidig imøtegåelse
Er tilsvar eller henvendelse sendt:
${caseInput?.reply_sent ? "Ja" : "Ikke registrert / nei"}

Tilsvar eller henvendelse:
${caseInput?.reply_text || "[Lim inn eller oppsummer hva som ble sendt til redaksjonen.]"}

Svar fra redaksjonen:
${caseInput?.editor_response || "[Lim inn eller oppsummer redaksjonens svar, hvis det finnes.]"}

6. Rettsstatus
Registrert rettsstatus:
${legalStatusLabel(caseInput?.legal_status ?? null)}

Detaljer:
${caseInput?.legal_status_details || "[Forklar om saken er anmeldt, henlagt, avgjort, påklaget, uavklart eller ikke relevant.]"}

7. Dokumentasjon
${caseInput?.documentation_summary || "[List opp dokumentasjon: e-poster, SMS, vedlegg, skjermbilder, rettsdokumenter, tidligere korrespondanse eller annen relevant dokumentasjon.]"}

8. Hva ønskes oppnådd?
${caseInput?.desired_outcome || "[F.eks. retting, tilsvar, beklagelse, presisering, sletting/avindeksering, PFU-behandling eller annen oppfølging.]"}

9. Foreløpige presseetiske problemstillinger
Basert på de registrerte opplysningene kan følgende temaer være relevante å vurdere videre:

- Om artikkelen gir et korrekt og dekkende bilde av saken.
- Om faktiske opplysninger er tilstrekkelig dokumentert.
- Om den omtalte parten fikk reell mulighet til tilsvar eller samtidig imøtegåelse.
- Om eventuelle feil er rettet tydelig og raskt nok.
- Om omtalen skiller tydelig mellom fakta, påstander og vurderinger.
- Om belastningen for den omtalte står i rimelig forhold til sakens offentlige interesse.

10. Forbehold
Dette er ikke en ferdig PFU-klage, juridisk rådgivning eller endelig presseetisk vurdering. Utkastet bør kvalitetssikres før bruk.`;
  }, [caseItem, caseInput, profile, user]);

  const activePfuDraft =
    pfuDrafts.find((draft) => draft.id === selectedPfuDraftId) ??
    pfuDrafts[0] ??
    null;

  const activePfuDraftText = activePfuDraft?.pfu_draft || draftText;

  function handleDownloadPfuDraftText() {
    const safeTitle = (caseItem?.title ?? "pressesjekk-pfu-klage")
      .toLowerCase()
      .replace(/[^a-z0-9æøå]+/gi, "-")
      .replace(/^-+|-+$/g, "");

    const blob = new Blob([activePfuDraftText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${safeTitle}-${activePfuDraft
      ? `pfu-klageutkast-v${activePfuDraft.version}`
      : "pfu-klageutkast"}.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  async function handleDownloadPfuDraftPdf() {
    if (!activePfuDraft) {
      setErrorMessage("Du må velge en lagret PFU-klage før du kan laste ned PDF.");
      return;
    }

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    const accessToken = sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      setErrorMessage("Du må være innlogget for å laste ned PFU-PDF.");
      return;
    }

    setErrorMessage("");

    const response = await fetch(
      `/api/cases/${params.id}/reports/${activePfuDraft.id}/pdf`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setErrorMessage(payload?.error ?? `Kunne ikke lage PFU-PDF. Status: ${response.status}`);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const safeTitle = (caseItem?.title ?? "pressesjekk-pfu-klage")
      .toLowerCase()
      .replace(/[^a-z0-9æøå]+/gi, "-")
      .replace(/^-+|-+$/g, "");

    link.href = url;
    link.download = `${safeTitle}-pfu-klageutkast-v${activePfuDraft.version}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  async function handleCopyDraft() {
    setCopyMessage("");
    setErrorMessage("");

    try {
      await navigator.clipboard.writeText(activePfuDraftText);
      setCopyMessage("PFU-klageet er kopiert.");
    } catch {
      setErrorMessage(
        "Kunne ikke kopiere automatisk. Marker teksten og kopier manuelt."
      );
    }
  }

  async function handleGenerateAiPfuDraft() {
    if (!caseItem) return;

    setIsGeneratingAiDraft(true);
    setErrorMessage("");
    setSuccessMessage("");
    setCopyMessage("");

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    const accessToken = sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      setErrorMessage("Du må være innlogget for å generere PFU-klage med KI.");
      setIsGeneratingAiDraft(false);
      return;
    }

    const response = await fetch(`/api/cases/${params.id}/generate-pfu-draft`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      setErrorMessage(result.error || "Kunne ikke generere PFU-klage med KI.");
      setIsGeneratingAiDraft(false);
      return;
    }

    if (!result.report) {
      setErrorMessage("PFU-klagen ble generert, men svaret manglet rapportdata.");
      setIsGeneratingAiDraft(false);
      return;
    }

    const generatedDraft = result.report as CaseReportRow;

    setPfuDrafts((current) => [generatedDraft, ...current]);
    setReports((current) => [generatedDraft, ...current]);
    setSelectedPfuDraftId(generatedDraft.id);
    setSuccessMessage(`PFU-klage v${generatedDraft.version} er generert og lagret.`);
    setIsGeneratingAiDraft(false);
  }

  async function handleSavePfuDraft() {
    if (!caseItem) return;

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const allKnownVersions = [...reports, ...pfuDrafts].map((item) => item.version);

    const nextVersion =
      allKnownVersions.length > 0 ? Math.max(...allKnownVersions) + 1 : 1;

    const { data: savedDraft, error } = await supabase
      .from("case_reports")
      .insert({
        case_id: caseItem.id,
        version: nextVersion,
        report_type: "pfu_draft",
        pfu_draft: draftText,
        status: "ready",
      })
      .select("id,version,report_type,pfu_draft,status,created_at")
      .single();

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    if (!savedDraft?.id) {
      setErrorMessage("PFU-klagen ble lagret, men vi fant ikke dokument-ID.");
      setIsSaving(false);
      return;
    }

    setSuccessMessage(`PFU-klage v${nextVersion} er lagret.`);

    const newPfuDraft = savedDraft as CaseReportRow;

    setPfuDrafts((current) => [newPfuDraft, ...current]);
    setReports((current) => [newPfuDraft, ...current]);

    setSelectedPfuDraftId(newPfuDraft.id);
    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              Laster PFU-klage...
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
        <Link
          href="/min-side"
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          ← Tilbake til Min Side
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              PFU-klage
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              PFU-klage
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              PFU-klageet bygger på saken, saksopplysninger,
              dokumentasjon og relevante punkter i Vær Varsom-plakaten.
              Utkastet er et arbeidsgrunnlag før eventuell innsending eller
              videre kvalitetssikring.
            </p>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Kladd
              </p>

              <h2 className="mt-3 text-4xl font-black text-slate-950">
                {activePfuDraft
                  ? `PFU-klage v${activePfuDraft.version}`
                  : "PFU-klage"}
              </h2>

              <p className="mt-4 max-w-3xl leading-8 text-slate-700">
                {activePfuDraft
                  ? "Dette er valgt lagret PFU-klage. Du kan laste ned PDF, laste ned tekst eller lage et nytt KI-utkast."
                  : "Bruk KI-knappen for å lage en gjennomarbeidet PFU-klage basert på saken og relevante presseetiske punkter."}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                <button
                  type="button"
                  onClick={handleGenerateAiPfuDraft}
                  disabled={isGeneratingAiDraft}
                  className="col-span-2 w-full rounded-2xl bg-cyan-500 px-5 py-4 text-center text-base font-black text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-1 sm:w-auto sm:py-3 sm:text-sm"
                >
                  {isGeneratingAiDraft
                    ? "Genererer..."
                    : "Generer PFU-klage med KI"}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPfuDraftPdf}
                  disabled={!activePfuDraft}
                  className="col-span-1 w-full rounded-2xl border border-cyan-300 bg-cyan-50 px-3 py-4 text-center text-base font-black text-cyan-900 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5 sm:py-3 sm:text-sm"
                >
                  Last ned PDF
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPfuDraftText}
                  className="col-span-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-4 text-center text-base font-black text-slate-950 hover:bg-slate-100 sm:w-auto sm:px-5 sm:py-3 sm:text-sm"
                >
                  Last ned tekst
                </button>


              </div>

              <pre className="mt-8 max-h-[900px] overflow-auto whitespace-pre-wrap rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-800 sm:p-7">
                {activePfuDraftText}
              </pre>

              {errorMessage ? (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                  {errorMessage}
                </div>
              ) : null}

              {copyMessage ? (
                <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold text-cyan-800">
                  {copyMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                  {successMessage}
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/min-side/saker/${params.id}/pfu-avgjorelse`}
                  className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800"
                >
                  Gå til PFU-avgjørelse
                </Link>

                <Link
                  href={`/min-side/saker/${params.id}/politianmeldelse`}
                  className="rounded-2xl border border-cyan-300 bg-cyan-50 px-6 py-4 font-black text-cyan-900 hover:bg-cyan-100"
                >
                  Gå til politianmeldelse
                </Link>

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
              activeStep="pfu"
              workflowType={profile?.role_type === "journalist" ? "journalist" : "standard"}
              currentPackageId={caseAccessPackageId ?? undefined}
              stepsDone={{
                caseRegistered: true,
                caseInputs: Boolean(caseInput),
                report: reports.some(
                  (report) =>
                    report.report_type === "free_check" ||
                    report.report_type === "full_report"
                ),
                pfuDraft: pfuDrafts.length > 0,
                pfuDecision: Boolean(
                  pfuDecision?.decision_received || pfuDecision?.uploaded_file_name
                ),
                policeReport: reports.some((report) => report.report_type === "police_draft"),
                investigation: reports.some(
                  (report) => report.report_type === "investigation_draft"
                ),
              }}
            />

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Lagrede PFU-klager
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                {pfuDrafts.length > 1
                  ? `${pfuDrafts.length} lagret`
                  : pfuDrafts.length === 1
                    ? "1 lagret"
                    : "Ingen lagret"}
              </h2>
              <div className="mt-5 grid gap-3">
                {pfuDrafts.length === 0 ? (
                  <p className="leading-8 text-slate-700">
                    Ingen PFU-klage er lagret ennå. Lagre utkastet når du
                    ønsker å bevare denne versjonen.
                  </p>
                ) : (
                  pfuDrafts.map((draft) => {
                    const isSelected = activePfuDraft?.id === draft.id;

                    return (
                      <button
                        key={`${draft.id}-${draft.version}`}
                        type="button"
                        onClick={() => setSelectedPfuDraftId(draft.id)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? "border-cyan-400 bg-cyan-50 shadow-sm"
                            : "border-slate-200 bg-slate-50 hover:bg-cyan-50"
                        }`}
                      >
                        <p className="font-black text-slate-950">
                          PFU-klage v{draft.version}
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
                Videre arbeid
              </p>
              <h2 className="mt-3 text-3xl font-black">
                Fra klage til oppfølging
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                Bruk utkastet som et arbeidsgrunnlag. Før innsending bør teksten
                kontrolleres, tilpasses saken og vurderes opp mot relevante
                punkter i Vær Varsom-plakaten.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <LightPublicFooter />
    </main>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { CaseSidebar } from "@/components/cases/CaseSidebar";
import { JournalistWorkflowGate } from "@/components/cases/JournalistWorkflowGate";
import { CaseAttachmentPanel } from "@/components/cases/CaseAttachmentPanel";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";
import { packageAccessSteps, type PackagePlanId } from "@/data/packagePlans";
import type { CaseReportRow as FullCaseReportRow } from "@/lib/report/mappers";

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

type CaseReportRow = Pick<
  FullCaseReportRow,
  "id" | "version" | "report_type" | "pfu_draft" | "status" | "created_at"
>;

type PfuDecisionRow = {
  id: string;
  pfu_complaint_sent: boolean | null;
  pfu_sent_date: string | null;
  pfu_case_number: string | null;
  pfu_case_url: string | null;
  decision_received: boolean | null;
  decision_date: string | null;
  decision_result: string | null;
  decision_summary: string | null;
  decision_text: string | null;
  uploaded_file_path: string | null;
  uploaded_file_name: string | null;
  uploaded_file_type: string | null;
  next_step_interest: string | null;
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

function decisionResultLabel(value: string | null) {
  if (!value) return "Ikke satt";
  if (value === "upheld") return "Felt";
  if (value === "not_upheld") return "Ikke felt";
  if (value === "dismissed") return "Avvist";
  if (value === "withdrawn") return "Trukket";
  if (value === "partly_upheld") return "Delvis felt";
  if (value === "other") return "Annet";
  return value;
}

function statusLabel(status: CaseRow["status"]) {
  if (status === "draft") return "Utkast";
  if (status === "in_progress") return "Under arbeid";
  if (status === "report_ready") return "Rapport klar";
  if (status === "closed") return "Lukket";
  return status;
}

export default function PfuPage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [caseAccessPackageId, setCaseAccessPackageId] = useState<PackagePlanId | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [caseItem, setCaseItem] = useState<CaseRow | null>(null);
  const [caseInput, setCaseInput] = useState<CaseInputRow | null>(null);
  const [pfuDrafts, setPfuDrafts] = useState<CaseReportRow[]>([]);
  const [selectedPfuDraftId, setSelectedPfuDraftId] = useState<string | null>(null);
  const [reports, setReports] = useState<CaseReportRow[]>([]);

  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [pfuComplaintSent, setPfuComplaintSent] = useState(false);
  const [pfuSentDate, setPfuSentDate] = useState("");
  const [pfuCaseNumber, setPfuCaseNumber] = useState("");
  const [pfuCaseUrl, setPfuCaseUrl] = useState("");
  const [decisionReceived, setDecisionReceived] = useState(false);
  const [decisionDate, setDecisionDate] = useState("");
  const [decisionResult, setDecisionResult] = useState("");
  const [decisionSummary, setDecisionSummary] = useState("");
  const [decisionText, setDecisionText] = useState("");
  const [nextStepInterest, setNextStepInterest] = useState("");
  // Historiske filreferanser (legacy - nye opplastinger skjer via
  // CaseAttachmentPanel/case_documents, se Dokumentasjon i høyrekolonnen).
  const [uploadedFilePath, setUploadedFilePath] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileType, setUploadedFileType] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isGeneratingAiDraft, setIsGeneratingAiDraft] = useState(false);
  const [isSavingDecision, setIsSavingDecision] = useState(false);
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

      setCaseAccessPackageId((accessData as CaseAccessRow | null)?.package_id ?? null);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id,full_name,email,role_type")
        .eq("id", user.id)
        .maybeSingle();

      setProfile((profileData as ProfileRow | null) ?? null);

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

      const { data: allReportsData } = await supabase
        .from("case_reports")
        .select("id,version,report_type,pfu_draft,status,created_at")
        .eq("case_id", params.id)
        .order("version", { ascending: false });

      const allReports = (allReportsData ?? []) as CaseReportRow[];
      setReports(allReports);

      const loadedPfuDrafts = allReports.filter((report) => report.report_type === "pfu_draft");
      setPfuDrafts(loadedPfuDrafts);
      setSelectedPfuDraftId(loadedPfuDrafts[0]?.id ?? null);

      const { data: decisionData, error: decisionError } = await supabase
        .from("pfu_decisions")
        .select(
          "id,pfu_complaint_sent,pfu_sent_date,pfu_case_number,pfu_case_url,decision_received,decision_date,decision_result,decision_summary,decision_text,uploaded_file_path,uploaded_file_name,uploaded_file_type,next_step_interest"
        )
        .eq("case_id", params.id)
        .maybeSingle();

      if (decisionError) {
        setErrorMessage(decisionError.message);
        setIsLoading(false);
        return;
      }

      if (decisionData) {
        const decision = decisionData as PfuDecisionRow;

        setDecisionId(decision.id);
        setPfuComplaintSent(Boolean(decision.pfu_complaint_sent));
        setPfuSentDate(decision.pfu_sent_date ?? "");
        setPfuCaseNumber(decision.pfu_case_number ?? "");
        setPfuCaseUrl(decision.pfu_case_url ?? "");
        setDecisionReceived(Boolean(decision.decision_received));
        setDecisionDate(decision.decision_date ?? "");
        setDecisionResult(decision.decision_result ?? "");
        setDecisionSummary(decision.decision_summary ?? "");
        setDecisionText(decision.decision_text ?? "");
        setNextStepInterest(decision.next_step_interest ?? "");
        setUploadedFilePath(decision.uploaded_file_path ?? "");
        setUploadedFileName(decision.uploaded_file_name ?? "");
        setUploadedFileType(decision.uploaded_file_type ?? "");
      }

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
${caseInput?.documentation_summary || "[Se dokumentasjonen som er lastet opp i saken (Dokumentasjon på saksopplysninger-siden) for e-poster, SMS, vedlegg og annen dokumentasjon.]"}

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

  const activePfuDraft = pfuDrafts.find((draft) => draft.id === selectedPfuDraftId) ?? pfuDrafts[0] ?? null;
  const activePfuDraftText = activePfuDraft?.pfu_draft || draftText;

  const isJournalistWorkflow = profile?.role_type === "journalist";

  const hasFullPackAccess = Boolean(
    caseAccessPackageId && (packageAccessSteps[caseAccessPackageId] ?? []).includes(5)
  );

  function handleDownloadPfuDraftText() {
    const safeTitle = (caseItem?.title ?? "pressesjekk-pfu-klage")
      .toLowerCase()
      .replace(/[^a-z0-9æøå]+/gi, "-")
      .replace(/^-+|-+$/g, "");

    const blob = new Blob([activePfuDraftText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${safeTitle}-${activePfuDraft ? `pfu-klageutkast-v${activePfuDraft.version}` : "pfu-klageutkast"}.txt`;

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

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      setErrorMessage("Du må være innlogget for å laste ned PFU-PDF.");
      return;
    }

    setErrorMessage("");

    const response = await fetch(`/api/cases/${params.id}/reports/${activePfuDraft.id}/pdf`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

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
      setErrorMessage("Kunne ikke kopiere automatisk. Marker teksten og kopier manuelt.");
    }
  }

  async function handleGenerateAiPfuDraft() {
    if (!caseItem) return;

    setIsGeneratingAiDraft(true);
    setErrorMessage("");
    setSuccessMessage("");
    setCopyMessage("");

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      setErrorMessage("Du må være innlogget for å generere PFU-klage med KI.");
      setIsGeneratingAiDraft(false);
      return;
    }

    const response = await fetch(`/api/cases/${params.id}/generate-pfu-draft`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
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

    setIsSavingDraft(true);
    setErrorMessage("");
    setSuccessMessage("");

    const allKnownVersions = [...reports, ...pfuDrafts].map((item) => item.version);
    const nextVersion = allKnownVersions.length > 0 ? Math.max(...allKnownVersions) + 1 : 1;

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
      setIsSavingDraft(false);
      return;
    }

    if (!savedDraft?.id) {
      setErrorMessage("PFU-klagen ble lagret, men vi fant ikke dokument-ID.");
      setIsSavingDraft(false);
      return;
    }

    setSuccessMessage(`PFU-klage v${nextVersion} er lagret.`);

    const newPfuDraft = savedDraft as CaseReportRow;

    setPfuDrafts((current) => [newPfuDraft, ...current]);
    setReports((current) => [newPfuDraft, ...current]);
    setSelectedPfuDraftId(newPfuDraft.id);
    setIsSavingDraft(false);
  }

  async function handleSaveDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !caseItem) {
      setErrorMessage("Du må være innlogget for å lagre PFU-status.");
      return;
    }

    setIsSavingDecision(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        case_id: caseItem.id,
        user_id: user.id,

        pfu_complaint_sent: pfuComplaintSent,
        pfu_sent_date: pfuSentDate || null,
        pfu_case_number: pfuCaseNumber.trim() || null,
        pfu_case_url: pfuCaseUrl.trim() || null,

        decision_received: hasFullPackAccess ? decisionReceived : false,
        decision_date: hasFullPackAccess ? decisionDate || null : null,
        decision_result: hasFullPackAccess ? decisionResult || null : null,
        decision_summary: hasFullPackAccess ? decisionSummary.trim() || null : null,
        decision_text: hasFullPackAccess ? decisionText.trim() || null : null,

        uploaded_file_path: uploadedFilePath || null,
        uploaded_file_name: uploadedFileName || null,
        uploaded_file_type: uploadedFileType || null,

        next_step_interest: nextStepInterest || null,
      };

      if (decisionId) {
        const { error } = await supabase.from("pfu_decisions").update(payload).eq("id", decisionId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("pfu_decisions")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;
        setDecisionId(data.id);
      }

      setSuccessMessage("PFU-status er lagret.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke lagre PFU-status.");
    } finally {
      setIsSavingDecision(false);
    }
  }

  async function handleOpenFile() {
    if (!uploadedFilePath) return;

    const { data, error } = await supabase.storage.from("case-documents").createSignedUrl(uploadedFilePath, 60);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">Laster PFU...</p>
          </div>
        </section>
      </main>
    );
  }

  if (isJournalistWorkflow) {
    return (
      <JournalistWorkflowGate
        caseId={params.id}
        heading="Bruk rapport og publiseringsgrunnlag"
        description="Denne siden er laget for PFU-klage og PFU-avgjørelse etter publisering. For journalist og redaksjon brukes PresseSjekk til publiseringsgrunnlag, VVP-risiko, kildekontroll og redaksjonell kvalitetssikring før publisering."
        statusLabel={caseItem ? statusLabel(caseItem.status) : "Utkast"}
        currentPackageId={caseAccessPackageId ?? undefined}
        stepsDone={{
          caseRegistered: true,
          caseInputs: Boolean(caseInput),
          report: reports.some(
            (report) => report.report_type === "free_check" || report.report_type === "full_report"
          ),
          pfuDraft: false,
          pfuDecision: false,
          policeReport: false,
          investigation: reports.some((report) => report.report_type === "investigation_draft"),
        }}
      />
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
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-700">PFU</p>

            <h1 className="mt-4 max-w-4xl [text-wrap:balance] text-4xl font-black sm:text-5xl tracking-tight text-slate-950 md:text-7xl">
              PFU-klage og avgjørelse
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Lag PFU-klagen, registrer at den er sendt inn, og følg opp med PFU-avgjørelsen når den kommer - samlet
              på ett sted.
            </p>

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

            {copyMessage ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                {copyMessage}
              </div>
            ) : null}

            {/* Steg 1: PFU-klage */}
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">1. PFU-klage</p>

              <h2 className="mt-3 text-3xl font-black text-slate-950">
                {activePfuDraft ? `PFU-klage v${activePfuDraft.version}` : "Lag PFU-klagen"}
              </h2>

              <p className="mt-4 max-w-3xl leading-7 text-slate-700">
                {activePfuDraft
                  ? "Dette er valgt lagret PFU-klage. Du kan laste ned PDF, laste ned tekst eller lage et nytt KI-utkast."
                  : "Bruk KI-knappen for å lage en gjennomarbeidet PFU-klage basert på saken og relevante presseetiske punkter."}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                <button
                  type="button"
                  onClick={handleGenerateAiPfuDraft}
                  disabled={isGeneratingAiDraft}
                  className="col-span-2 w-full rounded-2xl bg-red-500 px-5 py-4 text-center text-base font-black text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-1 sm:w-auto sm:py-3 sm:text-sm"
                >
                  {isGeneratingAiDraft ? "Genererer..." : "Generer PFU-klage med KI"}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPfuDraftPdf}
                  disabled={!activePfuDraft}
                  className="col-span-1 w-full rounded-2xl border border-red-300 bg-red-50 px-3 py-4 text-center text-base font-black text-red-900 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5 sm:py-3 sm:text-sm"
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

              <pre className="mt-8 max-h-[500px] overflow-auto whitespace-pre-wrap rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-800 sm:p-7">
                {activePfuDraftText}
              </pre>

              <button
                type="button"
                onClick={handleCopyDraft}
                className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-100"
              >
                Kopier tekst
              </button>

              {!activePfuDraft ? (
                <button
                  type="button"
                  onClick={handleSavePfuDraft}
                  disabled={isSavingDraft}
                  className="mt-4 ml-3 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingDraft ? "Lagrer..." : "Lagre uten KI"}
                </button>
              ) : null}
            </div>

            {/* Steg 2 og 3: status + avgjørelse, ett skjema */}
            <form
              onSubmit={handleSaveDecision}
              className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
            >
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">2. Send inn</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">Status på innsendt klage</h2>

              <div className="mt-6 grid gap-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={pfuComplaintSent}
                      onChange={(event) => setPfuComplaintSent(event.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-slate-300"
                    />
                    <span>
                      <span className="block font-black text-slate-950">PFU-klage er sendt</span>
                      <span className="mt-1 block text-sm leading-6 text-slate-600">
                        Huk av hvis klagen faktisk er sendt til PFU.
                      </span>
                    </span>
                  </label>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="pfuSentDate" className="text-sm font-bold text-slate-800">
                      Dato sendt
                    </label>
                    <input
                      id="pfuSentDate"
                      type="date"
                      value={pfuSentDate}
                      onChange={(event) => setPfuSentDate(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="pfuCaseNumber" className="text-sm font-bold text-slate-800">
                      PFU-saksnummer
                    </label>
                    <input
                      id="pfuCaseNumber"
                      type="text"
                      value={pfuCaseNumber}
                      onChange={(event) => setPfuCaseNumber(event.target.value)}
                      placeholder="F.eks. 123/26"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="pfuCaseUrl" className="text-sm font-bold text-slate-800">
                    Lenke til PFU-sak
                  </label>
                  <input
                    id="pfuCaseUrl"
                    type="url"
                    value={pfuCaseUrl}
                    onChange={(event) => setPfuCaseUrl(event.target.value)}
                    placeholder="https://..."
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="mt-10 border-t border-slate-200 pt-8">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">3. PFU-avgjørelse</p>
                <h2 className="mt-3 text-3xl font-black text-slate-950">Last opp avgjørelsen</h2>

                {!hasFullPackAccess ? (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <p className="font-black text-slate-950">Krever Full dokumentpakke</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Registrering av PFU-avgjørelsen (mottatt/resultat/opplasting) er en del av Full dokumentpakke.
                      Du kan fortsatt sende inn PFU-klagen med denne pakken.
                    </p>
                    <Link
                      href={`/min-side/saker/${params.id}/pakke`}
                      className="mt-4 inline-flex rounded-xl bg-red-500 px-4 py-2.5 text-xs font-black text-white hover:bg-red-600"
                    >
                      Oppgrader til Full dokumentpakke
                    </Link>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-6">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <label className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={decisionReceived}
                          onChange={(event) => setDecisionReceived(event.target.checked)}
                          className="mt-1 h-5 w-5 rounded border-slate-300"
                        />
                        <span>
                          <span className="block font-black text-slate-950">PFU-avgjørelse er mottatt</span>
                          <span className="mt-1 block text-sm leading-6 text-slate-600">
                            Huk av når avgjørelsen er mottatt eller publisert.
                          </span>
                        </span>
                      </label>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="decisionDate" className="text-sm font-bold text-slate-800">
                          Dato for avgjørelse
                        </label>
                        <input
                          id="decisionDate"
                          type="date"
                          value={decisionDate}
                          onChange={(event) => setDecisionDate(event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="decisionResult" className="text-sm font-bold text-slate-800">
                          Resultat
                        </label>
                        <select
                          id="decisionResult"
                          value={decisionResult}
                          onChange={(event) => setDecisionResult(event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
                        >
                          <option value="">Velg resultat</option>
                          <option value="upheld">Felt</option>
                          <option value="partly_upheld">Delvis felt</option>
                          <option value="not_upheld">Ikke felt</option>
                          <option value="dismissed">Avvist</option>
                          <option value="withdrawn">Trukket</option>
                          <option value="other">Annet</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="decisionSummary" className="text-sm font-bold text-slate-800">
                        Kort sammendrag
                      </label>
                      <textarea
                        id="decisionSummary"
                        rows={4}
                        value={decisionSummary}
                        onChange={(event) => setDecisionSummary(event.target.value)}
                        placeholder="Oppsummer kort hva PFU kom frem til..."
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="decisionText" className="text-sm font-bold text-slate-800">
                        Lim inn tekst eller utdrag fra avgjørelsen
                      </label>
                      <textarea
                        id="decisionText"
                        rows={6}
                        value={decisionText}
                        onChange={(event) => setDecisionText(event.target.value)}
                        placeholder="Lim inn hele eller deler av PFU-avgjørelsen..."
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
                      />
                    </div>

                    <p className="text-sm leading-6 text-slate-500">
                      Last opp selve avgjørelsen som fil i Dokumentasjon til høyre - KI-en leser innholdet
                      automatisk sammen med sakens øvrige dokumenter.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 border-t border-slate-200 pt-8">
                <label htmlFor="nextStepInterest" className="text-sm font-bold text-slate-800">
                  Ønsker du å vurdere neste steg?
                </label>
                <select
                  id="nextStepInterest"
                  value={nextStepInterest}
                  onChange={(event) => setNextStepInterest(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
                >
                  <option value="">Ikke valgt</option>
                  <option value="need_review">Ja, vurder neste steg</option>
                  <option value="police_report_interest">Ja, jeg vil vurdere politianmeldelse</option>
                  <option value="investigation_interest">Ja, jeg vil vurdere utredningspakke</option>
                  <option value="not_now">Ikke nå</option>
                </select>

                <button
                  type="submit"
                  disabled={isSavingDecision}
                  className="mt-6 w-full rounded-2xl bg-slate-950 px-6 py-4 text-center font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isSavingDecision ? "Lagrer..." : "Lagre PFU-status"}
                </button>
              </div>
            </form>
          </section>

          <CaseSidebar
            caseId={params.id}
            statusLabel={caseItem ? statusLabel(caseItem.status) : "Utkast"}
            activeStep="pfu"
            workflowType={profile?.role_type === "journalist" ? "journalist" : "standard"}
            currentPackageId={caseAccessPackageId ?? undefined}
            stepsDone={{
              caseRegistered: true,
              caseInputs: Boolean(caseInput),
              report: reports.some(
                (report) => report.report_type === "free_check" || report.report_type === "full_report"
              ),
              pfuDraft: pfuDrafts.length > 0,
              pfuDecision: Boolean(decisionReceived || uploadedFileName),
              policeReport: reports.some((report) => report.report_type === "police_draft"),
              investigation: reports.some((report) => report.report_type === "investigation_draft"),
            }}
            statusTitle="PFU"
            statusItems={[
              {
                label: "Klage",
                value: pfuDrafts.length > 0 ? `${pfuDrafts.length} lagret` : "Ikke opprettet",
                tone: pfuDrafts.length > 0 ? "success" : "neutral",
              },
              {
                label: "Sendt",
                value: pfuComplaintSent ? "Ja" : "Nei",
                tone: pfuComplaintSent ? "success" : "neutral",
              },
              {
                label: "Avgjørelse",
                value: !hasFullPackAccess ? "Ikke tilgjengelig" : decisionReceived ? decisionResultLabel(decisionResult) : "Ikke mottatt",
                tone: hasFullPackAccess && decisionReceived ? "success" : "neutral",
              },
            ]}
            statusContent={
              <div className="grid gap-4">
                {pfuDrafts.length > 0 ? (
                  <div className="grid gap-2">
                    {pfuDrafts.map((draft) => {
                      const isSelected = activePfuDraft?.id === draft.id;

                      return (
                        <button
                          key={`${draft.id}-${draft.version}`}
                          type="button"
                          onClick={() => setSelectedPfuDraftId(draft.id)}
                          className={`rounded-2xl border p-3 text-left transition ${
                            isSelected
                              ? "border-red-500 bg-red-50 shadow-sm"
                              : "border-slate-200 bg-slate-50 hover:bg-red-50"
                          }`}
                        >
                          <p className="font-black text-slate-950">PFU-klage v{draft.version}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-600">{formatDate(draft.created_at)}</p>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {uploadedFilePath ? (
                  <button
                    type="button"
                    onClick={handleOpenFile}
                    className="rounded-xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800"
                  >
                    Åpne opplastet fil ({uploadedFileName})
                  </button>
                ) : null}

                <CaseAttachmentPanel
                  caseId={params.id}
                  title="PFU-dokumenter og vedlegg"
                  description="Last opp PFU-avgjørelsen og annen dokumentasjon som hører til saken. Vedlegg lagres sammen med sakens øvrige dokumenter."
                  defaultDocumentType="pfu_document"
                  emptyStateTitle="Ingen vedlegg lastet opp ennå"
                  emptyStateDescription="Last opp PFU-avgjørelsen som fil her, i tillegg til å fylle inn detaljene i skjemaet til venstre."
                />
              </div>
            }
            nextStep={{
              title: "Etter PFU",
              description:
                "Bruk PFU-klagen og en eventuell avgjørelse som arbeidsgrunnlag. Etterpå kan du vurdere politianmeldelse eller en utredningspakke.",
              primary: {
                label: "Gå til politianmeldelse",
                href: `/min-side/saker/${params.id}/politianmeldelse`,
              },
              secondary: {
                label: "Gå til utredning",
                href: `/min-side/saker/${params.id}/utredning`,
              },
            }}
          />
        </div>
      </section>

      <LightPublicFooter />
    </main>
  );
}

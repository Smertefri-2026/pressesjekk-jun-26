"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
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
};

type CaseInputRow = {
  id: string;
};

type CaseReportRow = {
  id: string;
  report_type: "free_check" | "full_report" | "pfu_draft";
};

type PfuDecisionRow = {
  id: string;
  case_id: string;
  user_id: string;
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

export default function PfuDecisionPage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [caseItem, setCaseItem] = useState<CaseRow | null>(null);
  const [caseInput, setCaseInput] = useState<CaseInputRow | null>(null);
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

  const [uploadedFilePath, setUploadedFilePath] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileType, setUploadedFileType] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
        .select("id,title,status,media_name,article_title")
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
        .select("id,report_type")
        .eq("case_id", params.id);

      setReports((reportsData ?? []) as CaseReportRow[]);

      const { data: decisionData, error: decisionError } = await supabase
        .from("pfu_decisions")
        .select(
          "id,case_id,user_id,pfu_complaint_sent,pfu_sent_date,pfu_case_number,pfu_case_url,decision_received,decision_date,decision_result,decision_summary,decision_text,uploaded_file_path,uploaded_file_name,uploaded_file_type,next_step_interest"
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

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setSelectedFile(file);
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function uploadSelectedFile() {
    if (!user || !selectedFile) {
      return {
        filePath: uploadedFilePath || null,
        fileName: uploadedFileName || null,
        fileType: uploadedFileType || null,
      };
    }

    setIsUploading(true);

    const safeName = selectedFile.name
      .replaceAll(" ", "-")
      .replace(/[^a-zA-Z0-9.\-_]/g, "")
      .toLowerCase();

    const filePath = `${user.id}/${params.id}/pfu-avgjorelse-${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("case-documents")
      .upload(filePath, selectedFile, {
        cacheControl: "3600",
        upsert: false,
      });

    setIsUploading(false);

    if (uploadError) {
      throw uploadError;
    }

    setUploadedFilePath(filePath);
    setUploadedFileName(selectedFile.name);
    setUploadedFileType(selectedFile.type);

    return {
      filePath,
      fileName: selectedFile.name,
      fileType: selectedFile.type,
    };
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !caseItem) {
      setErrorMessage("Du må være innlogget for å lagre PFU-avgjørelse.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const fileData = await uploadSelectedFile();

      const payload = {
        case_id: caseItem.id,
        user_id: user.id,

        pfu_complaint_sent: pfuComplaintSent,
        pfu_sent_date: pfuSentDate || null,
        pfu_case_number: pfuCaseNumber.trim() || null,
        pfu_case_url: pfuCaseUrl.trim() || null,

        decision_received: decisionReceived,
        decision_date: decisionDate || null,
        decision_result: decisionResult || null,
        decision_summary: decisionSummary.trim() || null,
        decision_text: decisionText.trim() || null,

        uploaded_file_path: fileData.filePath,
        uploaded_file_name: fileData.fileName,
        uploaded_file_type: fileData.fileType,

        next_step_interest: nextStepInterest || null,
      };

      if (decisionId) {
        const { error } = await supabase
          .from("pfu_decisions")
          .update(payload)
          .eq("id", decisionId);

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

      setSelectedFile(null);
      setSuccessMessage("PFU-avgjørelsen er lagret.");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Kunne ikke lagre PFU-avgjørelsen.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleOpenFile() {
    if (!uploadedFilePath) return;

    const { data, error } = await supabase.storage
      .from("case-documents")
      .createSignedUrl(uploadedFilePath, 60);

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
            <p className="text-lg font-bold text-slate-700">
              Laster PFU-avgjørelse...
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
              PFU-avgjørelse
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              PFU-avgjørelse
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Registrer om PFU-klagen er sendt, saksnummer, resultat,
              avgjørelse, dokumentasjon og eventuelle videre steg. Dette gjør
              saken enklere å følge opp senere.
            </p>
            <form
              onSubmit={handleSave}
              className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
            >
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              PFU-status
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              <span className="sm:hidden">PFU-status</span>
              <span className="hidden sm:inline">
                Klage, avgjørelse og dokumentasjon
              </span>
            </h2>

            <div className="mt-8 grid gap-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={pfuComplaintSent}
                    onChange={(event) =>
                      setPfuComplaintSent(event.target.checked)
                    }
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />
                  <span>
                    <span className="block font-black text-slate-950">
                      PFU-klage er sendt
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">
                      Huk av hvis klagen faktisk er sendt til PFU.
                    </span>
                  </span>
                </label>
              </div>

              <div>
                <label
                  htmlFor="pfuSentDate"
                  className="text-sm font-bold text-slate-800"
                >
                  Dato sendt
                </label>
                <input
                  id="pfuSentDate"
                  type="date"
                  value={pfuSentDate}
                  onChange={(event) => setPfuSentDate(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="pfuCaseNumber"
                  className="text-sm font-bold text-slate-800"
                >
                  PFU-saksnummer
                </label>
                <input
                  id="pfuCaseNumber"
                  type="text"
                  value={pfuCaseNumber}
                  onChange={(event) => setPfuCaseNumber(event.target.value)}
                  placeholder="F.eks. 123/26"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="pfuCaseUrl"
                  className="text-sm font-bold text-slate-800"
                >
                  Lenke til PFU-sak
                </label>
                <input
                  id="pfuCaseUrl"
                  type="url"
                  value={pfuCaseUrl}
                  onChange={(event) => setPfuCaseUrl(event.target.value)}
                  placeholder="https://..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={decisionReceived}
                    onChange={(event) =>
                      setDecisionReceived(event.target.checked)
                    }
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />
                  <span>
                    <span className="block font-black text-slate-950">
                      PFU-avgjørelse er mottatt
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">
                      Huk av når avgjørelsen er mottatt eller publisert.
                    </span>
                  </span>
                </label>
              </div>

              <div>
                <label
                  htmlFor="decisionDate"
                  className="text-sm font-bold text-slate-800"
                >
                  Dato for avgjørelse
                </label>
                <input
                  id="decisionDate"
                  type="date"
                  value={decisionDate}
                  onChange={(event) => setDecisionDate(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="decisionResult"
                  className="text-sm font-bold text-slate-800"
                >
                  Resultat
                </label>
                <select
                  id="decisionResult"
                  value={decisionResult}
                  onChange={(event) => setDecisionResult(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
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

              <div>
                <label
                  htmlFor="decisionSummary"
                  className="text-sm font-bold text-slate-800"
                >
                  Kort sammendrag
                </label>
                <textarea
                  id="decisionSummary"
                  rows={5}
                  value={decisionSummary}
                  onChange={(event) => setDecisionSummary(event.target.value)}
                  placeholder="Oppsummer kort hva PFU kom frem til..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="decisionText"
                  className="text-sm font-bold text-slate-800"
                >
                  Lim inn tekst eller utdrag fra avgjørelsen
                </label>
                <textarea
                  id="decisionText"
                  rows={7}
                  value={decisionText}
                  onChange={(event) => setDecisionText(event.target.value)}
                  placeholder="Lim inn hele eller deler av PFU-avgjørelsen..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="decisionFile"
                  className="text-sm font-bold text-slate-800"
                >
                  Last opp PFU-avgjørelse
                </label>
                <input
                  id="decisionFile"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,application/pdf,image/jpeg,image/png,image/webp,text/plain"
                  onChange={handleFileChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-4 file:py-3 file:font-bold file:text-white hover:file:bg-slate-800"
                />
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Tillatte filer: PDF, JPG, PNG, WEBP eller TXT. Maks 10 MB.
                </p>
              </div>

              <div>
                <label
                  htmlFor="nextStepInterest"
                  className="text-sm font-bold text-slate-800"
                >
                  Ønsker du å vurdere neste steg?
                </label>
                <select
                  id="nextStepInterest"
                  value={nextStepInterest}
                  onChange={(event) =>
                    setNextStepInterest(event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                >
                  <option value="">Ikke valgt</option>
                  <option value="need_review">Ja, vurder neste steg</option>
                  <option value="police_report_interest">
                    Ja, jeg vil vurdere politianmeldelse
                  </option>
                  <option value="not_now">Ikke nå</option>
                </select>
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800">
                  {successMessage}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="col-span-2 w-full rounded-2xl bg-slate-950 px-6 py-4 text-center font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-1 sm:w-auto"
                >
                  {isUploading
                    ? "Laster opp..."
                    : isSaving
                      ? "Lagrer..."
                      : "Lagre PFU-avgjørelse"}
                </button>

                <Link
                  href={`/min-side/saker/${params.id}`}
                  className="col-span-2 w-full rounded-2xl border border-slate-300 bg-white px-6 py-4 text-center font-black text-slate-950 hover:bg-slate-100 sm:col-span-1 sm:w-auto"
                >
                  Til saken
                </Link>
              </div>
            </div>
            </form>
          </section>

          <aside className="grid content-start gap-6">
            <CaseWorkflowCard
              caseId={params.id}
              statusLabel={caseItem ? statusLabel(caseItem.status) : "Utkast"}
              activeStep="pfu-avgjorelse"
              stepsDone={{
                caseRegistered: true,
                caseInputs: Boolean(caseInput),
                report: reports.some((report) => report.report_type !== "pfu_draft"),
                pfuDraft: reports.some((report) => report.report_type === "pfu_draft"),
                pfuDecision: Boolean(decisionReceived || uploadedFileName),
                policeReport: false,
              }}
            />

            <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
                Lagret status
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                {decisionReceived
                  ? decisionResultLabel(decisionResult)
                  : pfuComplaintSent
                    ? "PFU-klage sendt"
                    : "Ikke sendt"}
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                {uploadedFileName
                  ? `Fil lagret: ${uploadedFileName}`
                  : "Ingen PFU-avgjørelse er lastet opp ennå."}
              </p>

              {uploadedFilePath ? (
                <button
                  type="button"
                  onClick={handleOpenFile}
                  className="mt-6 rounded-xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800"
                >
                  Åpne opplastet fil
                </button>
              ) : null}
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Videre arbeid
              </p>
              <h2 className="mt-3 text-3xl font-black">
                Etter PFU
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                En PFU-avgjørelse kan være viktig dokumentasjon i saken. Etter
                avgjørelsen kan du vurdere retting, oppfølging, ny
                dokumentasjon eller andre mulige steg.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <LightPublicFooter />
    </main>
  );
}

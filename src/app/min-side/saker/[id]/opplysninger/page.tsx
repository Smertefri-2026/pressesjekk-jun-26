"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
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
};

type CaseReportRow = {
  id: string;
  report_type: "free_check" | "full_report" | "pfu_draft" | "police_draft" | "investigation_draft";
};

type PfuDecisionRow = {
  id: string;
  decision_received: boolean | null;
  uploaded_file_name: string | null;
};

type CaseDocumentRow = {
  id: string;
  title: string;
  document_type:
    | "article"
    | "journalist_email"
    | "reply_sent"
    | "editor_response"
    | "pfu_document"
    | "legal_document"
    | "other";
  description: string | null;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  deleted_at: string | null;
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

type DocumentMode = "active" | "trash";
type DocumentViewMode = "list" | "grid";
type DocumentSortKey = "name" | "type" | "size" | "date";

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

const documentTypeOptions = [
  { value: "article", label: "Artikkel" },
  { value: "journalist_email", label: "E-post fra journalist" },
  { value: "reply_sent", label: "Tilsvar sendt" },
  { value: "editor_response", label: "Svar fra redaksjonen" },
  { value: "pfu_document", label: "PFU-dokument" },
  { value: "legal_document", label: "Rettslig dokument" },
  { value: "other", label: "Annet vedlegg" },
] as const;

function documentTypeLabel(type: CaseDocumentRow["document_type"]) {
  return (
    documentTypeOptions.find((option) => option.value === type)?.label ??
    "Annet vedlegg"
  );
}

function formatFileSize(size: number | null) {
  if (!size) return "Ukjent størrelse";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDocumentDate(date: string | null) {
  if (!date) return "Ikke satt";

  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}
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


export default function CaseInputsPage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [caseAccessPackageId, setCaseAccessPackageId] =
    useState<PackagePlanId | null>(null);
  const [workflowType, setWorkflowType] = useState<"standard" | "journalist">("standard");
  const [caseItem, setCaseItem] = useState<CaseRow | null>(null);
  const [caseInputId, setCaseInputId] = useState<string | null>(null);
  const [reports, setReports] = useState<CaseReportRow[]>([]);
  const [pfuDecision, setPfuDecision] = useState<PfuDecisionRow | null>(null);
  const [documents, setDocuments] = useState<CaseDocumentRow[]>([]);
  const [trashedDocuments, setTrashedDocuments] = useState<CaseDocumentRow[]>([]);
  const [documentMode, setDocumentMode] = useState<DocumentMode>("active");
  const [documentViewMode, setDocumentViewMode] =
    useState<DocumentViewMode>("list");
  const [documentSortKey, setDocumentSortKey] =
    useState<DocumentSortKey>("date");
  const [documentSortDirection, setDocumentSortDirection] =
    useState<"asc" | "desc">("desc");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingInputs, setIsEditingInputs] = useState(true);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [documentMessage, setDocumentMessage] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [documentTitle, setDocumentTitle] = useState("");
  const [documentType, setDocumentType] =
    useState<CaseDocumentRow["document_type"]>("other");
  const [documentDescription, setDocumentDescription] = useState("");
  const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(
    null
  );

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
        .select("id,title,status,media_name,article_title")
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

      const { data: reportsData } = await supabase
        .from("case_reports")
        .select("id,report_type")
        .eq("case_id", params.id);

      setReports((reportsData ?? []) as CaseReportRow[]);

      const { data: pfuDecisionData } = await supabase
        .from("pfu_decisions")
        .select("id,decision_received,uploaded_file_name")
        .eq("case_id", params.id)
        .maybeSingle();

      setPfuDecision((pfuDecisionData as PfuDecisionRow | null) ?? null);

      const { data: documentsData } = await supabase
        .from("case_documents")
        .select(
          "id,title,document_type,description,file_name,file_path,file_size,mime_type,created_at,deleted_at"
        )
        .eq("case_id", params.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      setDocuments((documentsData ?? []) as CaseDocumentRow[]);

      const { data: trashedDocumentsData } = await supabase
        .from("case_documents")
        .select(
          "id,title,document_type,description,file_name,file_path,file_size,mime_type,created_at,deleted_at"
        )
        .eq("case_id", params.id)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      setTrashedDocuments((trashedDocumentsData ?? []) as CaseDocumentRow[]);

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

    setIsSaving(true);
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
      const { error } = await supabase
        .from("case_inputs")
        .update(payload)
        .eq("id", caseInputId);

      if (error) {
        setErrorMessage(error.message);
        setIsSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("case_inputs")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        setErrorMessage(error.message);
        setIsSaving(false);
        return;
      }

      setCaseInputId(data.id);
    }

    setSaveMessage("Saksopplysningene er lagret.");
    setIsEditingInputs(false);
    setIsSaving(false);
  }

  async function handleDocumentUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setDocumentError("Du må være innlogget for å laste opp dokumenter.");
      return;
    }

    if (!selectedDocumentFile) {
      setDocumentError("Velg en fil før du laster opp.");
      return;
    }

    if (selectedDocumentFile.size > 10 * 1024 * 1024) {
      setDocumentError("Filen er for stor. Maks filstørrelse i denne versjonen er 10 MB.");
      return;
    }

    setIsUploadingDocument(true);
    setDocumentMessage("");
    setDocumentError("");
    setErrorMessage("");

    const cleanFileName = selectedDocumentFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${user.id}/${params.id}/${Date.now()}-${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("case-documents")
      .upload(filePath, selectedDocumentFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setDocumentError(`Opplasting feilet: ${uploadError.message}`);
      setIsUploadingDocument(false);
      return;
    }

    const title =
      documentTitle.trim() ||
      selectedDocumentFile.name.replace(/\.[^/.]+$/, "") ||
      "Dokument";

    const { data, error: insertError } = await supabase
      .from("case_documents")
      .insert({
        case_id: params.id,
        user_id: user.id,
        title,
        document_type: documentType,
        description: documentDescription.trim() || null,
        file_name: selectedDocumentFile.name,
        file_path: filePath,
        file_size: selectedDocumentFile.size,
        mime_type: selectedDocumentFile.type || null,
      })
      .select(
        "id,title,document_type,description,file_name,file_path,file_size,mime_type,created_at,deleted_at"
      )
      .single();

    if (insertError) {
      await supabase.storage.from("case-documents").remove([filePath]);
      setDocumentError(`Dokumentet ble lastet opp, men kunne ikke lagres i saken: ${insertError.message}`);
      setIsUploadingDocument(false);
      return;
    }

    setDocuments((current) => [data as CaseDocumentRow, ...current]);
    setDocumentTitle("");
    setDocumentType("other");
    setDocumentDescription("");
    setSelectedDocumentFile(null);
    setDocumentError("");
    setDocumentMessage("Dokumentet er lastet opp.");
    setIsUploadingDocument(false);

    const fileInput = document.getElementById(
      "documentFile"
    ) as HTMLInputElement | null;
    if (fileInput) fileInput.value = "";
  }

  async function openDocument(document: CaseDocumentRow) {
    setDocumentError("");
    setErrorMessage("");

    const { data, error } = await supabase.storage
      .from("case-documents")
      .createSignedUrl(document.file_path, 60);

    if (error) {
      setDocumentError(`Kunne ikke åpne dokumentet: ${error.message}`);
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function deleteDocument(document: CaseDocumentRow) {
    const confirmed = window.confirm(
      `Vil du flytte dokumentet «${document.title}» til papirkurv?`
    );

    if (!confirmed) return;

    setErrorMessage("");
    setDocumentError("");
    setDocumentMessage("");

    const deletedAt = new Date().toISOString();

    const { error } = await supabase
      .from("case_documents")
      .update({ deleted_at: deletedAt })
      .eq("id", document.id);

    if (error) {
      setDocumentError(`Kunne ikke flytte dokumentet til papirkurv: ${error.message}`);
      return;
    }

    const trashedDocument: CaseDocumentRow = {
      ...document,
      deleted_at: deletedAt,
    };

    setDocuments((current) =>
      current.filter((item) => item.id !== document.id)
    );

    setTrashedDocuments((current) => [trashedDocument, ...current]);
    setDocumentMode("trash");
    setDocumentMessage("Dokumentet er flyttet til papirkurv.");
  }

  async function permanentlyDeleteDocument(document: CaseDocumentRow) {
    const confirmed = window.confirm(
      `Vil du slette dokumentet «${document.title}» permanent? Dette kan ikke angres.`
    );

    if (!confirmed) return;

    setErrorMessage("");
    setDocumentError("");
    setDocumentMessage("");

    const { error: storageError } = await supabase.storage
      .from("case-documents")
      .remove([document.file_path]);

    if (storageError) {
      setDocumentError(`Kunne ikke slette filen permanent: ${storageError.message}`);
      return;
    }

    const { error: deleteError } = await supabase
      .from("case_documents")
      .delete()
      .eq("id", document.id);

    if (deleteError) {
      setDocumentError(`Filen ble slettet, men dokumentraden kunne ikke slettes: ${deleteError.message}`);
      return;
    }

    setTrashedDocuments((current) =>
      current.filter((item) => item.id !== document.id)
    );
    setDocumentMessage("Dokumentet er slettet permanent.");
  }

  async function restoreDocument(document: CaseDocumentRow) {
    setErrorMessage("");
    setDocumentError("");
    setDocumentMessage("");

    const { error } = await supabase
      .from("case_documents")
      .update({ deleted_at: null })
      .eq("id", document.id);

    if (error) {
      setDocumentError(`Kunne ikke gjenopprette dokumentet: ${error.message}`);
      return;
    }

    const restoredDocument = { ...document, deleted_at: null };

    setTrashedDocuments((current) =>
      current.filter((item) => item.id !== document.id)
    );
    setDocuments((current) => [restoredDocument, ...current]);
    setDocumentMessage("Dokumentet er gjenopprettet.");
  }

  const documentItems = [
    ...(documentMode === "trash" ? trashedDocuments : documents),
  ].sort((a, b) => {
    const valueA =
      documentSortKey === "name"
        ? a.title.toLowerCase()
        : documentSortKey === "type"
          ? documentTypeLabel(a.document_type).toLowerCase()
          : documentSortKey === "size"
            ? String(a.file_size ?? 0).padStart(20, "0")
            : a.deleted_at ?? a.created_at;

    const valueB =
      documentSortKey === "name"
        ? b.title.toLowerCase()
        : documentSortKey === "type"
          ? documentTypeLabel(b.document_type).toLowerCase()
          : documentSortKey === "size"
            ? String(b.file_size ?? 0).padStart(20, "0")
            : b.deleted_at ?? b.created_at;

    if (valueA < valueB) return documentSortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return documentSortDirection === "asc" ? 1 : -1;
    return 0;
  });

  function handleDocumentSort(nextSortKey: DocumentSortKey) {
    if (documentSortKey === nextSortKey) {
      setDocumentSortDirection((current) =>
        current === "asc" ? "desc" : "asc"
      );
      return;
    }

    setDocumentSortKey(nextSortKey);
    setDocumentSortDirection(nextSortKey === "date" ? "desc" : "asc");
  }

  function documentSortLabel(key: DocumentSortKey) {
    if (documentSortKey !== key) return "";
    return documentSortDirection === "asc" ? " ↑" : " ↓";
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              Laster opplysninger...
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
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
              Feil
            </p>
            <h1 className="mt-3 text-3xl font-black text-red-950">
              Kunne ikke åpne opplysninger
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
              {isJournalist ? "Publiseringsgrunnlag" : "Saksopplysninger"}
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              {isJournalist ? "Publiseringsgrunnlag" : "Saksopplysninger"}
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              {isJournalist
                ? "Samle publiseringsgrunnlag, kilder, dokumentasjon, tilsvar og redaksjonelle vurderinger på ett sted. Dette brukes som grunnlag for redaksjonell kvalitetssikring før publisering eller videre arbeid."
                : "Samle det viktigste om saken på ett sted. Opplysningene brukes som grunnlag for rapport, dokumentasjonsliste, eventuell PFU-klage, politianmeldelse og utredning."}
            </p>

            {isEditingInputs ? (
            <form
              onSubmit={handleSubmit}
              className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
            >
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Opplysninger
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              {isJournalist ? "Hva skal kvalitetssikres?" : "Hva bør vurderes?"}
            </h2>

            <div className="mt-8 grid gap-6">
              <div>
                <label
                  htmlFor="articleText"
                  className="text-sm font-bold text-slate-800"
                >
                  {isJournalist ? "Publiseringsutkast eller artikkeltekst" : "Artikkeltekst eller utdrag"}
                </label>
                <textarea
                  id="articleText"
                  rows={7}
                  value={articleText}
                  onChange={(event) => setArticleText(event.target.value)}
                  placeholder={isJournalist ? "Lim inn publiseringsutkast, artikkeltekst eller relevante utdrag her..." : "Lim inn artikkeltekst eller relevante utdrag her..."}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="whatHappened"
                  className="text-sm font-bold text-slate-800"
                >
                  {isJournalist ? "Redaksjonell problemstilling" : "Hva skjedde?"}
                </label>
                <textarea
                  id="whatHappened"
                  rows={5}
                  value={whatHappened}
                  onChange={(event) => setWhatHappened(event.target.value)}
                  placeholder={isJournalist ? "Forklar hva som bør kvalitetssikres: fakta, kildegrunnlag, vinkling, tilsvar, identifisering eller publiseringsrisiko..." : "Forklar kort hva saken handler om, og hva du mener bør undersøkes..."}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              {!isJournalist ? (
                <div>
                  <label
                    htmlFor="yourRole"
                    className="text-sm font-bold text-slate-800"
                  >
                    Din rolle i saken
                  </label>
                  <select
                    id="yourRole"
                    value={yourRole}
                    onChange={(event) => setYourRole(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                  >
                    <option value="">Velg rolle i saken</option>
                    {yourRole && !caseRoleOptions.includes(yourRole) ? (
                      <option value={yourRole}>{yourRole}</option>
                    ) : null}
                    {caseRoleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Dette gjelder rollen din i denne konkrete saken. Profilrollen
                    din lagres separat på profilsiden.
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
                <label
                  htmlFor="replyText"
                  className="text-sm font-bold text-slate-800"
                >
                  {isJournalist ? "Kontakt med kilde eller berørt part" : "Tilsvar eller henvendelse til redaksjonen"}
                </label>
                <textarea
                  id="replyText"
                  rows={6}
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder={isJournalist ? "Lim inn eller oppsummer spørsmål, tilsvar, sitatsjekk, samtidig imøtegåelse eller kontakt med berørt part..." : "Lim inn eller oppsummer hva du sendte til redaksjonen..."}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="editorResponse"
                  className="text-sm font-bold text-slate-800"
                >
                  {isJournalist ? "Svar fra kilde eller berørt part" : "Svar fra redaksjonen"}
                </label>
                <textarea
                  id="editorResponse"
                  rows={5}
                  value={editorResponse}
                  onChange={(event) => setEditorResponse(event.target.value)}
                  placeholder={isJournalist ? "Skriv kort hva kilden eller den berørte parten svarte, eller lim inn relevant svar..." : "Skriv kort hva redaksjonen svarte, eller lim inn relevant svar..."}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="legalStatus"
                  className="text-sm font-bold text-slate-800"
                >
                  {isJournalist ? "Risiko/status" : "Rettsstatus"}
                </label>
                <select
                  id="legalStatus"
                  value={legalStatus}
                  onChange={(event) => setLegalStatus(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
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
                <label
                  htmlFor="legalStatusDetails"
                  className="text-sm font-bold text-slate-800"
                >
                  {isJournalist ? "Detaljer om risiko/status" : "Detaljer om rettsstatus"}
                </label>
                <textarea
                  id="legalStatusDetails"
                  rows={5}
                  value={legalStatusDetails}
                  onChange={(event) =>
                    setLegalStatusDetails(event.target.value)
                  }
                  placeholder={isJournalist ? "Forklar kort om det finnes publiseringsrisiko, uavklarte fakta, kildekonflikt, identifisering, rettslig prosess eller andre forhold..." : "Forklar kort om saken er anmeldt, henlagt, avgjort, påklaget eller annet..."}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="documentationSummary"
                  className="text-sm font-bold text-slate-800"
                >
                  Dokumentasjonsoppsummering
                </label>
                <textarea
                  id="documentationSummary"
                  rows={6}
                  value={documentationSummary}
                  onChange={(event) =>
                    setDocumentationSummary(event.target.value)
                  }
                  placeholder={isJournalist ? "List opp kilder, dokumenter, e-poster, sitatsjekk, tilsvar, faktagrunnlag, åpne kilder eller annen dokumentasjon..." : "List opp dokumenter, e-poster, SMS, vedlegg, skjermbilder eller andre bevis som finnes..."}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="desiredOutcome"
                  className="text-sm font-bold text-slate-800"
                >
                  {isJournalist ? "Ønsket redaksjonell avklaring" : "Hva ønsker du å oppnå?"}
                </label>
                <textarea
                  id="desiredOutcome"
                  rows={4}
                  value={desiredOutcome}
                  onChange={(event) => setDesiredOutcome(event.target.value)}
                  placeholder={isJournalist ? "F.eks. styrke faktagrunnlag, avklare vinkling, redusere publiseringsrisiko, sikre tilsvar eller dokumentere redaksjonelle vurderinger..." : "F.eks. retting, tilsvar, beklagelse, avindeksering, PFU-klage eller bedre dokumentasjon..."}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              {saveMessage ? (
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold leading-6 text-cyan-900">
                  {saveMessage}
                </div>
              ) : null}

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Lagrer..." : "Lagre opplysninger"}
                </button>

                <Link
                  href={`/min-side/saker/${params.id}/rapport`}
                  className="rounded-2xl border border-cyan-300 bg-cyan-50 px-6 py-4 font-black text-cyan-900 hover:bg-cyan-100"
                >
                  Gå til rapport
                </Link>

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
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Opplysninger
              </p>

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
                <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold leading-6 text-cyan-900">
                  {saveMessage}
                </div>
              ) : null}

              <div className="mt-8 grid gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    Artikkeltekst eller utdrag
                  </p>
                  <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">
                    {articleText || "Ikke lagt inn ennå."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    {isJournalist ? "Redaksjonell problemstilling" : "Hva skjedde?"}
                  </p>
                  <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">
                    {whatHappened || "Ikke lagt inn ennå."}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                      {isJournalist ? "Sjekkpunkt" : "Din rolle"}
                    </p>
                    <p className="mt-3 text-lg font-black text-slate-950">
                      {isJournalist ? "Redaksjonell vurdering" : yourRole || "Ikke satt"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                      {isJournalist ? "Berørt part kontaktet" : "Tilsvar sendt"}
                    </p>
                    <p className="mt-3 text-lg font-black text-slate-950">
                      {replySent ? "Ja" : "Nei / ikke registrert"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    {isJournalist ? "Kontakt med kilde eller berørt part" : "Tilsvar eller henvendelse"}
                  </p>
                  <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">
                    {replyText || "Ikke lagt inn ennå."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    {isJournalist ? "Svar fra kilde eller berørt part" : "Svar fra redaksjonen"}
                  </p>
                  <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">
                    {editorResponse || "Ikke lagt inn ennå."}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                      {isJournalist ? "Risiko/status" : "Rettsstatus"}
                    </p>
                    <p className="mt-3 text-lg font-black text-slate-950">
                      {legalStatusLabel(legalStatus)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                      Ønsket resultat
                    </p>
                    <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">
                      {desiredOutcome || "Ikke lagt inn ennå."}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    {isJournalist ? "Detaljer om risiko/status" : "Detaljer om rettsstatus"}
                  </p>
                  <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">
                    {legalStatusDetails || "Ikke lagt inn ennå."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    Dokumentasjonsoppsummering
                  </p>
                  <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">
                    {documentationSummary || "Ikke lagt inn ennå."}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/min-side/saker/${params.id}/rapport`}
                  className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800"
                >
                  Gå til rapport
                </Link>

                <Link
                  href={`/min-side/saker/${params.id}`}
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-4 font-black text-slate-950 hover:bg-slate-100"
                >
                  Til saken
                </Link>
              </div>
            </div>
            )}

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-0 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-8">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                    Dokumenter
                  </p>
                  <h2 className="mt-3 text-4xl font-black text-slate-950">
                    {documentMode === "trash"
                      ? "Dokumentpapirkurv"
                      : "Dokumenter"}
                  </h2>
                  <p className="mt-4 max-w-3xl leading-8 text-slate-700">
                    {documentMode === "trash"
                      ? "Slettede dokumenter ligger fortsatt lagret på saken og kan gjenopprettes eller slettes permanent."
                      : "Last opp og organiser dokumentasjon som hører til saken, for eksempel artikkel, e-post, tilsvar, svar fra redaksjonen, PFU-dokumenter eller andre vedlegg."}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setDocumentMode("active")}
                    className={`rounded-xl px-5 py-3 text-center text-sm font-black ${
                      documentMode === "active"
                        ? "bg-slate-950 text-white"
                        : "border border-slate-300 bg-white text-slate-950 hover:bg-slate-100"
                    }`}
                  >
                    Dokumenter
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocumentMode("trash")}
                    className={`rounded-xl px-5 py-3 text-center text-sm font-black ${
                      documentMode === "trash"
                        ? "bg-slate-950 text-white"
                        : "border border-slate-300 bg-white text-slate-950 hover:bg-slate-100"
                    }`}
                  >
                    Papirkurv
                  </button>
                </div>
              </div>

              {documentMode === "active" ? (
                <div className="border-b border-slate-200 p-5 sm:p-8">
                  <form onSubmit={handleDocumentUpload} className="grid gap-5">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="documentTitle"
                          className="text-sm font-bold text-slate-800"
                        >
                          Tittel
                        </label>
                        <input
                          id="documentTitle"
                          type="text"
                          value={documentTitle}
                          onChange={(event) =>
                            setDocumentTitle(event.target.value)
                          }
                          placeholder="F.eks. E-post fra journalist"
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="documentType"
                          className="text-sm font-bold text-slate-800"
                        >
                          Dokumenttype
                        </label>
                        <select
                          id="documentType"
                          value={documentType}
                          onChange={(event) =>
                            setDocumentType(
                              event.target
                                .value as CaseDocumentRow["document_type"]
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                        >
                          {documentTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="documentDescription"
                        className="text-sm font-bold text-slate-800"
                      >
                        Kort beskrivelse
                      </label>
                      <textarea
                        id="documentDescription"
                        rows={3}
                        value={documentDescription}
                        onChange={(event) =>
                          setDocumentDescription(event.target.value)
                        }
                        placeholder="Forklar kort hva dokumentet viser..."
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="documentFile"
                        className="text-sm font-bold text-slate-800"
                      >
                        Fil
                      </label>
                      <input
                        id="documentFile"
                        type="file"
                        onChange={(event) =>
                          setSelectedDocumentFile(event.target.files?.[0] ?? null)
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-black file:text-white focus:border-cyan-500 focus:bg-white"
                      />
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Start med PDF, bilder, tekstfiler eller e-postvedlegg.
                        Store saker kan senere organiseres som dokumentpakker.
                      </p>
                    </div>

                    {documentError ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">
                        {documentError}
                      </div>
                    ) : null}

                    {documentMessage ? (
                      <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold leading-6 text-cyan-900">
                        {documentMessage}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isUploadingDocument}
                      className="w-fit rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUploadingDocument
                        ? "Laster opp..."
                        : "Last opp dokument"}
                    </button>
                  </form>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <p className="hidden text-sm font-bold text-slate-500 sm:block">
                  {documentViewMode === "list" ? "Listevisning" : "Symbolvisning"}
                </p>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setDocumentViewMode("list")}
                    className={`rounded-xl px-3 py-2 text-sm font-black sm:px-4 ${
                      documentViewMode === "list"
                        ? "bg-slate-950 text-white"
                        : "border border-slate-300 bg-white text-slate-950 hover:bg-slate-100"
                    }`}
                  >
                    Liste
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocumentViewMode("grid")}
                    className={`rounded-xl px-3 py-2 text-sm font-black sm:px-4 ${
                      documentViewMode === "grid"
                        ? "bg-slate-950 text-white"
                        : "border border-slate-300 bg-white text-slate-950 hover:bg-slate-100"
                    }`}
                  >
                    Symboler
                  </button>
                </div>
              </div>

              {documentItems.length === 0 ? (
                <div className="p-6 sm:p-8">
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8">
                    <h3 className="text-2xl font-black text-slate-950">
                      {documentMode === "trash"
                        ? "Dokumentpapirkurven er tom"
                        : "Ingen dokumenter lastet opp"}
                    </h3>
                    <p className="mt-4 max-w-2xl leading-8 text-slate-700">
                      {documentMode === "trash"
                        ? "Dokumenter som flyttes til papirkurv vises her."
                        : "Last opp dokumenter som underbygger saken."}
                    </p>
                  </div>
                </div>
              ) : documentViewMode === "grid" ? (
                <div className="p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {documentItems.map((document) => (
                      <article
                        key={document.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-cyan-50 hover:shadow-md"
                      >
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                          {documentTypeLabel(document.document_type)}
                        </p>
                        <h3 className="mt-2 text-xl font-black text-slate-950">
                          {document.title}
                        </h3>
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          {document.file_name} ·{" "}
                          {formatFileSize(document.file_size)}
                        </p>
                        {document.description ? (
                          <p className="mt-3 line-clamp-3 leading-7 text-slate-700">
                            {document.description}
                          </p>
                        ) : null}

                        <div className="mt-5 flex flex-wrap gap-2">
                          {documentMode === "trash" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => restoreDocument(document)}
                                className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
                              >
                                Gjenopprett
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  permanentlyDeleteDocument(document)
                                }
                                className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-700 hover:bg-red-50"
                              >
                                Slett permanent
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => openDocument(document)}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 hover:bg-slate-100"
                              >
                                Åpne
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteDocument(document)}
                                className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-700 hover:bg-red-50"
                              >
                                Papirkurv
                              </button>
                            </>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <div className="grid grid-cols-[minmax(0,1fr)_112px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500 md:hidden">
                    <div>Dokument</div>
                    <div className="text-right">Handling</div>
                  </div>

                  <div className="hidden grid-cols-[1fr_130px_110px_110px_180px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500 md:grid">
                    <button
                      type="button"
                      onClick={() => handleDocumentSort("name")}
                      className="text-left hover:text-cyan-700"
                    >
                      Navn{documentSortLabel("name")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDocumentSort("type")}
                      className="text-left hover:text-cyan-700"
                    >
                      Type{documentSortLabel("type")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDocumentSort("size")}
                      className="text-left hover:text-cyan-700"
                    >
                      Størrelse{documentSortLabel("size")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDocumentSort("date")}
                      className="text-left hover:text-cyan-700"
                    >
                      Dato{documentSortLabel("date")}
                    </button>
                    <div className="text-right">Handling</div>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {documentItems.map((document) => (
                      <div
                        key={document.id}
                        className="grid grid-cols-[minmax(0,1fr)_112px] gap-3 px-5 py-4 transition hover:bg-cyan-50 md:grid-cols-[1fr_130px_110px_110px_180px] md:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-base font-black text-slate-950">
                            {document.title}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                            {document.file_name}
                          </p>
                        </div>

                        <div className="hidden text-sm font-bold text-slate-600 md:block">
                          {documentTypeLabel(document.document_type)}
                        </div>

                        <div className="hidden text-sm font-semibold text-slate-500 md:block">
                          {formatFileSize(document.file_size)}
                        </div>

                        <div className="hidden text-sm font-semibold text-slate-500 md:block">
                          {formatDocumentDate(
                            document.deleted_at ?? document.created_at
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 md:flex-row md:flex-wrap md:justify-end">
                          {documentMode === "trash" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => restoreDocument(document)}
                                className="rounded-lg border border-cyan-200 bg-white px-3 py-2 text-xs font-black text-cyan-700 hover:bg-cyan-50"
                              >
                                Gjenopprett
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  permanentlyDeleteDocument(document)
                                }
                                className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-black text-red-800 hover:bg-red-100"
                              >
                                Slett permanent
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => openDocument(document)}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-950 hover:bg-slate-100"
                              >
                                Åpne
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteDocument(document)}
                                className="text-xs font-black text-red-700 underline-offset-4 hover:underline"
                              >
                                Slett
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </section>

          <aside className="grid content-start gap-6">
          <CaseWorkflowCard
            caseId={params.id}
            statusLabel={caseItem ? statusLabel(caseItem.status) : "Utkast"}
            activeStep="opplysninger"
            workflowType={workflowType}
            currentPackageId={caseAccessPackageId ?? undefined}
            stepsDone={{
              caseRegistered: true,
              caseInputs: Boolean(caseInputId),
              report: reports.some(
                (report) =>
                  report.report_type === "free_check" ||
                  report.report_type === "full_report"
              ),
              pfuDraft: reports.some((report) => report.report_type === "pfu_draft"),
              pfuDecision: Boolean(
                pfuDecision?.decision_received || pfuDecision?.uploaded_file_name
              ),
              policeReport: reports.some((report) => report.report_type === "police_draft"),
              investigation: reports.some((report) => report.report_type === "investigation_draft"),
            }}
          />

            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Neste steg
              </p>
              <h2 className="mt-3 text-3xl font-black">
                Første rapportutkast
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                {isJournalist
                  ? "Når publiseringsgrunnlaget er lagret, kan du gå videre til redaksjonell sjekk og bruke rapporten som dokumentasjon i det videre arbeidet."
                  : "Når opplysninger er lagret, kan du gå videre til rapport. Derfra kan saken bygges videre med PFU-klage, PFU-avgjørelse, politianmeldelse eller utredning."}
              </p>
            </div>
          </aside>
        </div>

      </section>

      <LightPublicFooter />
    </main>
  );
}

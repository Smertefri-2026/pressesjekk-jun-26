"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, Badge, Button, LoadingState, EmptyState, ErrorBanner } from "@/components/design-system";
import type { BadgeTone } from "@/components/design-system";
import { MAX_DOCUMENT_FILE_SIZE_BYTES } from "@/lib/documents/validateUpload";

export type CaseDocument = {
  id: string;
  case_id: string;
  title: string;
  document_type: string;
  description: string | null;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  deleted_at: string | null;
  extraction_status: "pending" | "processing" | "completed" | "failed" | "unsupported";
  extraction_error: string | null;
  extracted_at: string | null;
  page_count: number | null;
};

export type DocumentTypeOption = { value: string; label: string };

const DEFAULT_DOCUMENT_TYPES: DocumentTypeOption[] = [
  { value: "article", label: "Artikkel" },
  { value: "journalist_email", label: "E-post fra journalist" },
  { value: "reply_sent", label: "Tilsvar sendt" },
  { value: "editor_response", label: "Svar fra redaksjonen" },
  { value: "pfu_document", label: "PFU-dokument" },
  { value: "legal_document", label: "Juridisk dokument" },
  { value: "other", label: "Annet" },
];

type Props = {
  caseId: string;
  title?: string;
  description?: string;
  documentTypeOptions?: DocumentTypeOption[];
  defaultDocumentType?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
};

function formatFileSize(bytes: number | null) {
  if (!bytes) return "Ukjent størrelse";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function extractionBadge(document: CaseDocument): { label: string; tone: BadgeTone } {
  if (document.extraction_status === "completed") {
    return {
      label: document.page_count ? `Tekst lest (${document.page_count} s.)` : "Tekst lest",
      tone: "success",
    };
  }
  if (document.extraction_status === "processing") return { label: "Leser tekst...", tone: "info" };
  if (document.extraction_status === "failed") return { label: "Tekst kunne ikke leses", tone: "danger" };
  if (document.extraction_status === "unsupported") return { label: "Uttrekk ikke støttet", tone: "neutral" };
  return { label: "Venter", tone: "neutral" };
}

function documentTypeLabel(options: DocumentTypeOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

/**
 * Remøy AI Design System / Platform — CaseAttachmentPanel.
 *
 * Generisk vedleggspanel for saksdokumenter. case_documents er eneste
 * kilde til sannhet (via /api/cases/[id]/documents-rutene, som validerer
 * filtype/størrelse server-side og krever innlogget eier av saken).
 * Produktnøytral - eneste PresseSjekk-spesifikke del er standard-listen med
 * dokumenttyper, som kan overstyres per bruksted/produkt via props.
 */
export function CaseAttachmentPanel({
  caseId,
  title = "Vedlegg",
  description,
  documentTypeOptions = DEFAULT_DOCUMENT_TYPES,
  defaultDocumentType = "other",
  emptyStateTitle = "Ingen vedlegg ennå",
  emptyStateDescription = "Last opp dokumentasjon som hører til denne saken.",
}: Props) {
  const [mode, setMode] = useState<"active" | "trash">("active");
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [trashedDocuments, setTrashedDocuments] = useState<CaseDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTrash, setIsLoadingTrash] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentType, setDocumentType] = useState(defaultDocumentType);
  const [documentDescription, setDocumentDescription] = useState("");

  const getAuthHeader = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Innloggingen kunne ikke bekreftes. Last siden på nytt.");
    }

    return { Authorization: `Bearer ${session.access_token}` };
  }, []);

  const loadActive = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/documents`, { headers });
      const result = await response.json();

      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke hente vedlegg.");

      setDocuments(result.documents ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke hente vedlegg.");
    } finally {
      setIsLoading(false);
    }
  }, [caseId, getAuthHeader]);

  const loadTrash = useCallback(async () => {
    setIsLoadingTrash(true);
    setErrorMessage("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/documents?includeDeleted=true`, {
        headers,
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke hente papirkurv.");

      setTrashedDocuments(result.documents ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke hente papirkurv.");
    } finally {
      setIsLoadingTrash(false);
    }
  }, [caseId, getAuthHeader]);

  useEffect(() => {
    async function loadOnMount() {
      await loadActive();
    }

    loadOnMount();
  }, [loadActive]);

  function switchToTrash() {
    setMode("trash");
    if (trashedDocuments.length === 0) loadTrash();
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setErrorMessage("Velg en fil før du laster opp.");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const headers = await getAuthHeader();
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", documentTitle);
      formData.append("documentType", documentType);
      formData.append("description", documentDescription);

      const response = await fetch(`/api/cases/${caseId}/documents`, {
        method: "POST",
        headers,
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result?.error ?? "Opplasting feilet.");

      setDocuments((current) => [result.document as CaseDocument, ...current]);
      setDocumentTitle("");
      setDocumentDescription("");
      setSelectedFile(null);
      setStatusMessage("Dokumentet er lastet opp.");

      const fileInput = window.document.getElementById(
        `case-attachment-file-${caseId}`
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Opplasting feilet.");
    } finally {
      setIsUploading(false);
    }
  }

  async function openDocument(document: CaseDocument) {
    setErrorMessage("");

    const { data, error } = await supabase.storage
      .from("case-documents")
      .createSignedUrl(document.file_path, 60);

    if (error || !data) {
      setErrorMessage(`Kunne ikke åpne dokumentet: ${error?.message ?? "ukjent feil"}`);
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function moveToTrash(document: CaseDocument) {
    setBusyDocumentId(document.id);
    setErrorMessage("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/documents/${document.id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trash" }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke flytte til papirkurv.");

      setDocuments((current) => current.filter((item) => item.id !== document.id));
      setTrashedDocuments((current) => [result.document as CaseDocument, ...current]);
      setStatusMessage("Dokumentet er flyttet til papirkurv.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Kunne ikke flytte til papirkurv."
      );
    } finally {
      setBusyDocumentId(null);
    }
  }

  async function restoreFromTrash(document: CaseDocument) {
    setBusyDocumentId(document.id);
    setErrorMessage("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/documents/${document.id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke gjenopprette.");

      setTrashedDocuments((current) => current.filter((item) => item.id !== document.id));
      setDocuments((current) => [result.document as CaseDocument, ...current]);
      setStatusMessage("Dokumentet er gjenopprettet.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke gjenopprette.");
    } finally {
      setBusyDocumentId(null);
    }
  }

  async function deletePermanently(document: CaseDocument) {
    const confirmed = window.confirm(
      `Slette «${document.title}» permanent? Dette kan ikke angres.`
    );
    if (!confirmed) return;

    setBusyDocumentId(document.id);
    setErrorMessage("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/documents/${document.id}`, {
        method: "DELETE",
        headers,
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke slette permanent.");

      setTrashedDocuments((current) => current.filter((item) => item.id !== document.id));
      setStatusMessage("Dokumentet er slettet permanent.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke slette permanent.");
    } finally {
      setBusyDocumentId(null);
    }
  }

  const visibleDocuments = mode === "active" ? documents : trashedDocuments;

  return (
    <Card as="aside" padding="md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">{title}</p>
          {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>

        <div className="flex gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode("active")}
            className={`rounded-full px-3 py-1.5 ${
              mode === "active" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            Aktive ({documents.length})
          </button>
          <button
            type="button"
            onClick={switchToTrash}
            className={`rounded-full px-3 py-1.5 ${
              mode === "trash" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            Papirkurv
          </button>
        </div>
      </div>

      {errorMessage ? <ErrorBanner message={errorMessage} className="mt-4" /> : null}
      {statusMessage ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
          {statusMessage}
        </div>
      ) : null}

      {mode === "active" ? (
        <form onSubmit={handleUpload} className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <label htmlFor={`case-attachment-file-${caseId}`} className="text-xs font-bold text-slate-700">
              Fil (PDF, JPG, PNG, WEBP eller TXT, maks {MAX_DOCUMENT_FILE_SIZE_BYTES / (1024 * 1024)} MB)
            </label>
            <input
              id={`case-attachment-file-${caseId}`}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,application/pdf,image/jpeg,image/png,image/webp,text/plain"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-700">Tittel</label>
              <input
                value={documentTitle}
                onChange={(event) => setDocumentTitle(event.target.value)}
                placeholder="Valgfritt - bruker filnavn hvis tomt"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Type</label>
              <select
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
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
            <label className="text-xs font-bold text-slate-700">Beskrivelse</label>
            <textarea
              value={documentDescription}
              onChange={(event) => setDocumentDescription(event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
            />
          </div>

          <Button type="submit" size="sm" disabled={isUploading || !selectedFile}>
            {isUploading ? "Laster opp..." : "Last opp"}
          </Button>
        </form>
      ) : null}

      <div className="mt-5 space-y-3">
        {mode === "active" && isLoading ? <LoadingState message="Laster vedlegg..." /> : null}
        {mode === "trash" && isLoadingTrash ? <LoadingState message="Laster papirkurv..." /> : null}

        {mode === "active" && !isLoading && visibleDocuments.length === 0 ? (
          <EmptyState title={emptyStateTitle} description={emptyStateDescription} />
        ) : null}

        {mode === "trash" && !isLoadingTrash && visibleDocuments.length === 0 ? (
          <EmptyState title="Papirkurven er tom" description="Slettede dokumenter dukker opp her." />
        ) : null}

        {visibleDocuments.map((document) => {
          const badge = extractionBadge(document);
          const isBusy = busyDocumentId === document.id;

          return (
            <div key={document.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-950">{document.title}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {documentTypeLabel(documentTypeOptions, document.document_type)} ·{" "}
                    {formatFileSize(document.file_size)} · {formatDate(document.created_at)}
                  </p>
                  {document.description ? (
                    <p className="mt-2 text-sm text-slate-600">{document.description}</p>
                  ) : null}
                </div>
                {document.mime_type === "application/pdf" ? (
                  <Badge tone={badge.tone} className="shrink-0">
                    {badge.label}
                  </Badge>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {mode === "active" ? (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => openDocument(document)}>
                      Åpne
                    </Button>
                    <Button
                      size="sm"
                      variant="danger-outline"
                      disabled={isBusy}
                      onClick={() => moveToTrash(document)}
                    >
                      Papirkurv
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isBusy}
                      onClick={() => restoreFromTrash(document)}
                    >
                      Gjenopprett
                    </Button>
                    <Button
                      size="sm"
                      variant="danger-outline"
                      disabled={isBusy}
                      onClick={() => deletePermanently(document)}
                    >
                      Slett permanent
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

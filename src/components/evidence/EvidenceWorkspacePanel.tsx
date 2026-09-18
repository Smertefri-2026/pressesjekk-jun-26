"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Badge, Button, Card, EmptyState, ErrorBanner, EvidenceCard, LoadingState } from "@/components/design-system";
import { DocumentFactsReview } from "./DocumentFactsReview";
import { formatEventDate } from "@/lib/evidence/dateFacts";
import type { DocumentFacts } from "@/lib/evidence/types";
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_OPTIONS, EXTRACTION_LABELS } from "@/lib/evidence/labels";

export type FocusedContext = { type: "claim" | "event" | "witness"; id: string; label: string } | null;

type WorkspaceDocumentLink = { id: string; text: string };
type WorkspaceDocumentEvent = { id: string; title: string };
type WorkspaceDocumentWitness = { id: string; accountId: string; label: string };

type WorkspaceDocument = {
  id: string;
  title: string;
  fileName: string;
  fileSize: number | null;
  documentType: string;
  description: string | null;
  extractionStatus: string;
  userIntentNote: string | null;
  facts: DocumentFacts | null;
  claims: WorkspaceDocumentLink[];
  events: WorkspaceDocumentEvent[];
  witnessAccounts: WorkspaceDocumentWitness[];
};

type TrashedDocument = {
  id: string;
  title: string;
  documentType: string;
  fileName: string;
  deletedAt: string | null;
};

type AvailableClaim = { id: string; text: string };
type AvailableEvent = { id: string; title: string; dateLabel: string };
type AvailableWitnessAccount = { accountId: string; witnessId: string; witnessName: string | null; description: string };
type GapSummary = { type: string; entityId: string; description: string };

type LinkTarget = "claim" | "event" | "witness";

function formatFileSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function getAuthHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Innloggingen kunne ikke bekreftes. Last siden på nytt.");
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

/**
 * Fase 5.1: Evidence Workspace er nå DEN ENESTE arbeidsflaten for
 * dokumentasjon - erstatter både den forrige, enklere EvidenceWorkspacePanel
 * OG den fulle, separate dokumentmanageren som tidligere lå i venstre
 * kolonne på opplysninger-siden. All dokumenthåndtering (opplasting, se,
 * filtrere, koble, bekrefte/rette fakta, papirkurv) skjer nå her, ett sted.
 *
 * Dokumentasjonssenteret forblir den samlede OVERSIKTEN over hele saken
 * (Evidence Map, hel tidslinje, alle claims/vitner/hull) - dette panelet er
 * bevisst IKKE en duplikat av det, det er selve arbeidsflyten.
 */
export function EvidenceWorkspacePanel({
  caseId,
  focusedContext,
  onClearFocus,
}: {
  caseId: string;
  focusedContext?: FocusedContext;
  onClearFocus?: () => void;
}) {
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [trashedDocuments, setTrashedDocuments] = useState<TrashedDocument[]>([]);
  const [availableClaims, setAvailableClaims] = useState<AvailableClaim[]>([]);
  const [availableEvents, setAvailableEvents] = useState<AvailableEvent[]>([]);
  const [availableWitnessAccounts, setAvailableWitnessAccounts] = useState<AvailableWitnessAccount[]>([]);
  const [gaps, setGaps] = useState<GapSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [viewMode, setViewMode] = useState<"active" | "trash">("active");
  // Dokumentasjonen tilhører hele saken, ikke ett steg - "Alle dokumenter" er
  // derfor standardvisningen. Filtrering til koblede dokumenter er et
  // sekundært verktøy for saker med mange dokumenter, ikke standarden.
  const [filter, setFilter] = useState<"relevant" | "all">("all");
  const [expandedDocumentId, setExpandedDocumentId] = useState<string | null>(null);
  const [linkingMode, setLinkingMode] = useState<LinkTarget | null>(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState<string>("other");
  const [uploadDescription, setUploadDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const headers = await getAuthHeader();
      const [documentsRes, gapsRes, claimsRes, eventsRes, witnessesRes] = await Promise.all([
        fetch(`/api/cases/${caseId}/documentation-center`, { headers }),
        fetch(`/api/cases/${caseId}/documentation-gaps`, { headers }),
        fetch(`/api/cases/${caseId}/claims`, { headers }),
        fetch(`/api/cases/${caseId}/events`, { headers }),
        fetch(`/api/cases/${caseId}/witnesses`, { headers }),
      ]);
      const [documentsJson, gapsJson, claimsJson, eventsJson, witnessesJson] = await Promise.all([
        documentsRes.json(),
        gapsRes.json(),
        claimsRes.json(),
        eventsRes.json(),
        witnessesRes.json(),
      ]);

      if (!documentsRes.ok) throw new Error(documentsJson?.error ?? "Kunne ikke hente dokumenter.");
      if (!gapsRes.ok) throw new Error(gapsJson?.error ?? "Kunne ikke hente dokumentasjonshull.");
      if (!claimsRes.ok) throw new Error(claimsJson?.error ?? "Kunne ikke hente påstander.");
      if (!eventsRes.ok) throw new Error(eventsJson?.error ?? "Kunne ikke hente hendelser.");
      if (!witnessesRes.ok) throw new Error(witnessesJson?.error ?? "Kunne ikke hente vitner.");

      type WitnessJson = {
        id: string;
        name: string | null;
        accounts: { id: string; description: string; documents: { documentId: string }[] }[];
      };
      const witnesses = (witnessesJson.witnesses ?? []) as WitnessJson[];

      const witnessAccountsByDocumentId = new Map<string, WorkspaceDocumentWitness[]>();
      const flattenedAccounts: AvailableWitnessAccount[] = [];
      for (const witness of witnesses) {
        for (const account of witness.accounts) {
          flattenedAccounts.push({
            accountId: account.id,
            witnessId: witness.id,
            witnessName: witness.name,
            description: account.description,
          });
          for (const link of account.documents) {
            const list = witnessAccountsByDocumentId.get(link.documentId) ?? [];
            list.push({ id: account.id, accountId: account.id, label: witness.name ?? "Vitne" });
            witnessAccountsByDocumentId.set(link.documentId, list);
          }
        }
      }
      setAvailableWitnessAccounts(flattenedAccounts);

      type DocJson = {
        id: string;
        title: string;
        fileName: string;
        fileSize: number | null;
        documentType: string;
        description: string | null;
        extractionStatus: string;
        userIntentNote: string | null;
        facts: DocumentFacts | null;
        claims: WorkspaceDocumentLink[];
        events: WorkspaceDocumentEvent[];
      };

      setDocuments(
        ((documentsJson.documents ?? []) as DocJson[]).map((doc) => ({
          id: doc.id,
          title: doc.title,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          documentType: doc.documentType,
          description: doc.description,
          extractionStatus: doc.extractionStatus,
          userIntentNote: doc.userIntentNote,
          facts: doc.facts,
          claims: doc.claims,
          events: doc.events,
          witnessAccounts: witnessAccountsByDocumentId.get(doc.id) ?? [],
        }))
      );

      setGaps(gapsJson.gaps ?? []);
      setAvailableClaims((claimsJson.claims ?? []).map((c: { id: string; text: string }) => ({ id: c.id, text: c.text })));

      type EventJson = { id: string; title: string; eventDate: string | null; eventTime: string | null; datePrecision: "exact" | "date_only" | "approximate" | "unknown"; approximateLabel: string | null };
      setAvailableEvents(
        ((eventsJson.events ?? []) as EventJson[]).map((event) => ({
          id: event.id,
          title: event.title,
          dateLabel: formatEventDate({
            eventDate: event.eventDate,
            eventTime: event.eventTime,
            datePrecision: event.datePrecision,
            approximateLabel: event.approximateLabel,
          }),
        }))
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke laste dokumentasjon.");
    }
  }, [caseId]);

  const loadTrash = useCallback(async () => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/documents?includeDeleted=true`, { headers });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke hente papirkurv.");

      type RawDoc = { id: string; title: string; document_type: string; file_name: string; deleted_at: string | null };
      setTrashedDocuments(
        ((result.documents ?? []) as RawDoc[]).map((doc) => ({
          id: doc.id,
          title: doc.title,
          documentType: doc.document_type,
          fileName: doc.file_name,
          deletedAt: doc.deleted_at,
        }))
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke hente papirkurv.");
    }
  }, [caseId]);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await loadAll();
      setIsLoading(false);
    }
    init();
  }, [loadAll]);

  function switchToTrashView() {
    setViewMode("trash");
    if (trashedDocuments.length === 0) void loadTrash();
  }

  function updateDocument(documentId: string, updater: (doc: WorkspaceDocument) => WorkspaceDocument) {
    setDocuments((current) => current.map((doc) => (doc.id === documentId ? updater(doc) : doc)));
  }

  const relevantDocuments = useMemo(
    () => documents.filter((doc) => doc.claims.length > 0 || doc.events.length > 0 || doc.witnessAccounts.length > 0),
    [documents]
  );

  const focusedDocuments = useMemo(() => {
    if (!focusedContext) return null;
    return documents.filter((doc) => {
      if (focusedContext.type === "claim") return doc.claims.some((c) => c.id === focusedContext.id);
      if (focusedContext.type === "event") return doc.events.some((e) => e.id === focusedContext.id);
      return doc.witnessAccounts.some((w) => w.accountId === focusedContext.id);
    });
  }, [documents, focusedContext]);

  const focusedGap = useMemo(() => {
    if (!focusedContext) return null;
    return gaps.find((gap) => gap.entityId === focusedContext.id) ?? null;
  }, [gaps, focusedContext]);

  const visibleDocuments = focusedContext ? (focusedDocuments ?? []) : filter === "relevant" ? relevantDocuments : documents;

  async function handleUpload() {
    if (!uploadFile) return;
    setIsUploading(true);
    setErrorMessage("");

    try {
      const headers = await getAuthHeader();
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle.trim() || uploadFile.name.replace(/\.[^/.]+$/, ""));
      formData.append("documentType", uploadType);
      formData.append("description", uploadDescription.trim());

      const uploadResponse = await fetch(`/api/cases/${caseId}/documents`, { method: "POST", headers, body: formData });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadResult?.error ?? "Opplasting feilet.");

      const newDoc: WorkspaceDocument = {
        id: uploadResult.document.id,
        title: uploadResult.document.title,
        fileName: uploadResult.document.file_name,
        fileSize: uploadResult.document.file_size ?? null,
        documentType: uploadResult.document.document_type,
        description: uploadResult.document.description ?? null,
        extractionStatus: uploadResult.document.extraction_status,
        userIntentNote: null,
        facts: null,
        claims: [],
        events: [],
        witnessAccounts: [],
      };

      setDocuments((current) => [newDoc, ...current]);
      setUploadFile(null);
      setUploadTitle("");
      setUploadDescription("");
      setIsUploadOpen(false);

      const fileInput = window.document.getElementById("workspaceDocumentFile") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";

      // Fase 5: utløs fakta-ekstraksjon eksplisitt med én gang.
      const factsHeaders = await getAuthHeader();
      const factsResponse = await fetch(`/api/cases/${caseId}/documents/${newDoc.id}/facts`, { method: "POST", headers: factsHeaders });
      const factsResult = await factsResponse.json();

      if (factsResponse.ok) {
        updateDocument(newDoc.id, (doc) => ({ ...doc, facts: factsResult.facts }));
      }

      setExpandedDocumentId(newDoc.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Opplasting feilet.");
    } finally {
      setIsUploading(false);
    }
  }

  async function ensureFactsLoaded(documentId: string) {
    const doc = documents.find((d) => d.id === documentId);
    if (doc?.facts) return;

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/documents/${documentId}/facts`, { headers });
      const result = await response.json();
      if (response.ok && result.facts) {
        updateDocument(documentId, (d) => ({ ...d, facts: result.facts }));
      }
    } catch {
      // Stille feil - fakta er en bonusvisning, ikke kritisk sti.
    }
  }

  async function openDocument(documentId: string) {
    setErrorMessage("");

    try {
      const { data: row, error: fetchError } = await supabase
        .from("case_documents")
        .select("file_path")
        .eq("id", documentId)
        .single();

      if (fetchError || !row) throw new Error(fetchError?.message ?? "Fant ikke dokumentet.");

      const { data, error } = await supabase.storage.from("case-documents").createSignedUrl(row.file_path, 60);
      if (error) throw new Error(error.message);

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke åpne dokumentet.");
    }
  }

  async function trashDocument(documentId: string) {
    setIsBusy(true);
    setErrorMessage("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/documents/${documentId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trash" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke flytte til papirkurv.");

      setDocuments((current) => current.filter((doc) => doc.id !== documentId));
      setTrashedDocuments([]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke flytte til papirkurv.");
    } finally {
      setIsBusy(false);
    }
  }

  async function restoreDocument(documentId: string) {
    setIsBusy(true);
    setErrorMessage("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/documents/${documentId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke gjenopprette.");

      setTrashedDocuments((current) => current.filter((doc) => doc.id !== documentId));
      await loadAll();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke gjenopprette.");
    } finally {
      setIsBusy(false);
    }
  }

  async function permanentlyDeleteDocument(documentId: string, title: string) {
    const confirmed = window.confirm(`Vil du slette dokumentet «${title}» permanent? Dette kan ikke angres.`);
    if (!confirmed) return;

    setIsBusy(true);
    setErrorMessage("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/documents/${documentId}`, { method: "DELETE", headers });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke slette permanent.");

      setTrashedDocuments((current) => current.filter((doc) => doc.id !== documentId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke slette permanent.");
    } finally {
      setIsBusy(false);
    }
  }

  async function linkToClaim(documentId: string, claimId: string) {
    setIsBusy(true);
    setErrorMessage("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/claims/${claimId}/evidence-links`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke koble påstanden.");

      const claim = availableClaims.find((c) => c.id === claimId);
      if (claim) updateDocument(documentId, (doc) => ({ ...doc, claims: [...doc.claims, { id: claim.id, text: claim.text }] }));
      setLinkingMode(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke koble påstanden.");
    } finally {
      setIsBusy(false);
    }
  }

  async function linkToEvent(documentId: string, eventId: string) {
    setIsBusy(true);
    setErrorMessage("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/events/${eventId}/document-links`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke koble hendelsen.");

      const event = availableEvents.find((e) => e.id === eventId);
      if (event) updateDocument(documentId, (doc) => ({ ...doc, events: [...doc.events, { id: event.id, title: event.title }] }));
      setLinkingMode(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke koble hendelsen.");
    } finally {
      setIsBusy(false);
    }
  }

  async function linkToWitness(documentId: string, accountId: string) {
    setIsBusy(true);
    setErrorMessage("");

    const account = availableWitnessAccounts.find((a) => a.accountId === accountId);
    if (!account) return;

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/witnesses/${account.witnessId}/accounts/${accountId}/document-links`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke koble vitnet.");

      updateDocument(documentId, (doc) => ({
        ...doc,
        witnessAccounts: [...doc.witnessAccounts, { id: accountId, accountId, label: account.witnessName ?? "Vitne" }],
      }));
      setLinkingMode(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke koble vitnet.");
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading) {
    return <LoadingState message="Laster dokumentasjon..." />;
  }

  return (
    <Card padding="md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">Dokumentasjon</p>
          <p className="mt-1 text-xs text-slate-500">
            {documents.length} {documents.length === 1 ? "dokument" : "dokumenter"} i saken - dette er bevisene bak påstandene
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setIsUploadOpen((current) => !current)}>
          {isUploadOpen ? "Lukk" : "+ Last opp dokumentasjon"}
        </Button>
      </div>

      {errorMessage ? <ErrorBanner message={errorMessage} className="mt-4" /> : null}

      {isUploadOpen ? (
        <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <input
            id="workspaceDocumentFile"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,application/pdf,image/jpeg,image/png,image/webp,text/plain"
            onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
            className="block w-full text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
          />
          <input
            value={uploadTitle}
            onChange={(event) => setUploadTitle(event.target.value)}
            placeholder="Tittel (valgfritt)"
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-red-500"
          />
          <select
            value={uploadType}
            onChange={(event) => setUploadType(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-red-500"
          >
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <textarea
            value={uploadDescription}
            onChange={(event) => setUploadDescription(event.target.value)}
            placeholder="Kort beskrivelse (valgfritt)"
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-red-500"
          />
          <Button size="sm" disabled={isUploading || !uploadFile} onClick={handleUpload}>
            {isUploading ? "Laster opp..." : "Last opp"}
          </Button>
        </div>
      ) : null}

      {focusedContext ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-red-800">
              Relevant dokumentasjon for: {focusedContext.label}
            </p>
            {onClearFocus ? (
              <button type="button" onClick={onClearFocus} className="text-xs font-bold text-red-700 hover:underline">
                ✕ Fjern fokus
              </button>
            ) : null}
          </div>
          {focusedGap ? <p className="mt-2 text-xs leading-5 text-amber-800">⚠ {focusedGap.description}</p> : null}
        </div>
      ) : (
        <>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode("active")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold ${viewMode === "active" ? "bg-slate-950 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}
            >
              Dokumenter ({documents.length})
            </button>
            <button
              type="button"
              onClick={switchToTrashView}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold ${viewMode === "trash" ? "bg-slate-950 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}
            >
              Papirkurv
            </button>
          </div>

          {viewMode === "active" ? (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold ${filter === "all" ? "bg-slate-100 text-slate-950" : "text-slate-500 hover:bg-slate-50"}`}
              >
                Alle dokumenter ({documents.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("relevant")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold ${filter === "relevant" ? "bg-slate-100 text-slate-950" : "text-slate-500 hover:bg-slate-50"}`}
              >
                Koblet til dette ({relevantDocuments.length})
              </button>
            </div>
          ) : null}
        </>
      )}

      <div className="mt-3 space-y-2">
        {viewMode === "trash" ? (
          trashedDocuments.length === 0 ? (
            <EmptyState title="Papirkurven er tom" description="Dokumenter som flyttes til papirkurv vises her." />
          ) : (
            trashedDocuments.map((doc) => (
              <EvidenceCard
                key={doc.id}
                title={doc.title}
                meta={DOCUMENT_TYPE_LABELS[doc.documentType] ?? "Annet vedlegg"}
                actions={
                  <>
                    <button type="button" disabled={isBusy} onClick={() => restoreDocument(doc.id)} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-slate-100 disabled:opacity-60">
                      Gjenopprett
                    </button>
                    <button type="button" disabled={isBusy} onClick={() => permanentlyDeleteDocument(doc.id, doc.title)} className="rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-800 hover:bg-red-100 disabled:opacity-60">
                      Slett permanent
                    </button>
                  </>
                }
              />
            ))
          )
        ) : visibleDocuments.length === 0 ? (
          <EmptyState
            title={focusedContext ? "Ingen dokumentasjon koblet ennå" : filter === "relevant" ? "Ingen koblede dokumenter ennå" : "Ingen dokumenter lastet opp ennå"}
            description={
              focusedContext
                ? "Last opp eller koble et dokument for å dokumentere dette."
                : filter === "relevant"
                  ? "Dokumenter vises her når de kobles til en påstand, hendelse eller et vitne i saken."
                  : "Last opp dokumentasjon for å komme i gang."
            }
          />
        ) : (
          visibleDocuments.map((doc) => {
            const extraction = EXTRACTION_LABELS[doc.extractionStatus] ?? EXTRACTION_LABELS.pending;
            const isExpanded = expandedDocumentId === doc.id;
            const linkedClaimIds = new Set(doc.claims.map((c) => c.id));
            const linkedEventIds = new Set(doc.events.map((e) => e.id));
            const linkedWitnessAccountIds = new Set(doc.witnessAccounts.map((w) => w.accountId));

            const meta = (
              <>
                {DOCUMENT_TYPE_LABELS[doc.documentType] ?? "Annet vedlegg"}
                {formatFileSize(doc.fileSize) ? ` · ${formatFileSize(doc.fileSize)}` : ""}
                {doc.claims.length > 0 ? ` · ${doc.claims.length} ${doc.claims.length === 1 ? "påstand" : "påstander"}` : ""}
                {doc.events.length > 0 ? ` · ${doc.events.length} ${doc.events.length === 1 ? "hendelse" : "hendelser"}` : ""}
                {doc.witnessAccounts.length > 0 ? ` · ${doc.witnessAccounts.length} ${doc.witnessAccounts.length === 1 ? "vitne" : "vitner"}` : ""}
              </>
            );

            return (
              <EvidenceCard
                key={doc.id}
                title={doc.title}
                meta={meta}
                badge={
                  <>
                    <Badge tone={extraction.tone}>{extraction.label}</Badge>
                    {doc.facts?.userConfirmed ? <Badge tone="success">Fakta bekreftet</Badge> : null}
                  </>
                }
                isExpanded={isExpanded}
                onToggle={() => {
                  const next = isExpanded ? null : doc.id;
                  setExpandedDocumentId(next);
                  setLinkingMode(null);
                  if (next) void ensureFactsLoaded(doc.id);
                }}
              >
                {doc.description ? <p className="mb-3 text-sm leading-6 text-slate-700">{doc.description}</p> : null}

                    <div className="mb-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => openDocument(doc.id)} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-slate-100">
                        Åpne
                      </button>
                      <button type="button" disabled={isBusy} onClick={() => trashDocument(doc.id)} className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-60">
                        Papirkurv
                      </button>
                    </div>

                    <div className="mb-3 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Koblet til</p>

                      {doc.claims.length > 0 || doc.events.length > 0 || doc.witnessAccounts.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {doc.claims.map((c) => (
                            <span key={c.id} className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                              {c.text}
                            </span>
                          ))}
                          {doc.events.map((e) => (
                            <span key={e.id} className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-800">
                              {e.title}
                            </span>
                          ))}
                          {doc.witnessAccounts.map((w) => (
                            <span key={w.accountId} className="rounded-lg bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-800">
                              {w.label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">Ikke koblet til noe ennå.</p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setLinkingMode(linkingMode === "claim" ? null : "claim")} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-slate-100">
                          + Koble påstand
                        </button>
                        <button type="button" onClick={() => setLinkingMode(linkingMode === "event" ? null : "event")} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-slate-100">
                          + Koble hendelse
                        </button>
                        <button type="button" onClick={() => setLinkingMode(linkingMode === "witness" ? null : "witness")} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-slate-100">
                          + Koble vitne
                        </button>
                      </div>

                      {linkingMode === "claim" ? (
                        <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                          {availableClaims.filter((c) => !linkedClaimIds.has(c.id)).length === 0 ? (
                            <p className="text-xs text-slate-600">Ingen flere påstander å koble.</p>
                          ) : (
                            availableClaims
                              .filter((c) => !linkedClaimIds.has(c.id))
                              .map((claim) => (
                                <button key={claim.id} type="button" disabled={isBusy} onClick={() => linkToClaim(doc.id, claim.id)} className="block w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-xs font-semibold text-slate-950 hover:bg-red-50 disabled:opacity-60">
                                  {claim.text}
                                </button>
                              ))
                          )}
                        </div>
                      ) : null}

                      {linkingMode === "event" ? (
                        <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                          {availableEvents.filter((e) => !linkedEventIds.has(e.id)).length === 0 ? (
                            <p className="text-xs text-slate-600">Ingen flere hendelser å koble.</p>
                          ) : (
                            availableEvents
                              .filter((e) => !linkedEventIds.has(e.id))
                              .map((event) => (
                                <button key={event.id} type="button" disabled={isBusy} onClick={() => linkToEvent(doc.id, event.id)} className="block w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-xs font-semibold text-slate-950 hover:bg-red-50 disabled:opacity-60">
                                  {event.dateLabel} — {event.title}
                                </button>
                              ))
                          )}
                        </div>
                      ) : null}

                      {linkingMode === "witness" ? (
                        <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                          {availableWitnessAccounts.filter((a) => !linkedWitnessAccountIds.has(a.accountId)).length === 0 ? (
                            <p className="text-xs text-slate-600">Ingen flere vitner å koble.</p>
                          ) : (
                            availableWitnessAccounts
                              .filter((a) => !linkedWitnessAccountIds.has(a.accountId))
                              .map((account) => (
                                <button key={account.accountId} type="button" disabled={isBusy} onClick={() => linkToWitness(doc.id, account.accountId)} className="block w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-xs font-semibold text-slate-950 hover:bg-red-50 disabled:opacity-60">
                                  {account.witnessName ?? "Vitne"} — {account.description}
                                </button>
                              ))
                          )}
                        </div>
                      ) : null}
                    </div>

                    {doc.facts ? (
                      <DocumentFactsReview
                        caseId={caseId}
                        documentId={doc.id}
                        facts={doc.facts}
                        intentNote={doc.userIntentNote}
                        onFactsUpdated={(facts) => updateDocument(doc.id, (d) => ({ ...d, facts }))}
                        onIntentUpdated={(note) => updateDocument(doc.id, (d) => ({ ...d, userIntentNote: note }))}
                        onError={setErrorMessage}
                      />
                    ) : (
                      <p className="text-sm text-slate-500">Ingen dokumentfakta hentet ut ennå.</p>
                    )}
              </EvidenceCard>
            );
          })
        )}
      </div>

      {!focusedContext && viewMode === "active" && gaps.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-800">
            {gaps.length} {gaps.length === 1 ? "dokumentasjonshull" : "dokumentasjonshull"}
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-900">{gaps[0].description}</p>
        </div>
      ) : null}

      <Link href="#dokumentasjonsstatus" className="mt-4 block text-center text-sm font-bold text-red-700 hover:text-red-900">
        Se dokumentasjonsstatus for saken →
      </Link>
    </Card>
  );
}

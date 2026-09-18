"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Card,
  Button,
  LoadingState,
  EmptyState,
  ErrorBanner,
} from "@/components/design-system";
import { EvidenceStatusBadge } from "./EvidenceStatusBadge";
import {
  deriveDisplayStatus,
  confidenceLabel,
} from "@/lib/evidence/statusLogic";
import { formatEventDate } from "@/lib/evidence/dateFacts";
import type {
  AssessmentConfidence,
  ClaimSourceType,
  DocumentationStatus,
  EvidenceVerdict,
  ObservationType,
} from "@/lib/evidence/types";

type EvidenceDocSummary = {
  id: string;
  title: string;
  documentType: string;
  fileName: string;
  extractionStatus: string;
  mimeType: string | null;
};

type ClaimEvidenceLinkView = {
  id: string;
  claimId: string;
  documentId: string;
  createdAt: string;
  document: EvidenceDocSummary | null;
};

type EvidenceBreakdownItemView = {
  documentId: string;
  verdict: EvidenceVerdict;
  note: string;
};

type WitnessBreakdownItemView = {
  witnessAccountId: string;
  verdict: EvidenceVerdict;
  note: string;
  observationType: ObservationType;
};

type ClaimAssessmentView = {
  id: string;
  claimId: string;
  whatItShows: string;
  supportsSummary: string | null;
  contradictsSummary: string | null;
  notDocumentedSummary: string;
  conflictsBetweenEvidence: string | null;
  timelineNote: string | null;
  corroborationNote: string | null;
  status: Exclude<DocumentationStatus, "not_assessed">;
  confidence: AssessmentConfidence;
  confidenceReasoning: string;
  evidenceBreakdown: EvidenceBreakdownItemView[];
  witnessBreakdown: WitnessBreakdownItemView[];
  createdAt: string;
};

type ClaimWitnessLinkView = {
  id: string;
  claimId: string;
  witnessAccountId: string;
  witnessAccount: { id: string; description: string; witnessName: string | null } | null;
};

type ClaimView = {
  id: string;
  caseId: string;
  text: string;
  sourceType: ClaimSourceType;
  noEvidenceConfirmedAt: string | null;
  createdAt: string;
  evidence: ClaimEvidenceLinkView[];
  witnesses: ClaimWitnessLinkView[];
  latestAssessment: ClaimAssessmentView | null;
};

type AvailableDocument = {
  id: string;
  title: string;
  document_type: string;
  file_name: string;
  extraction_status: string;
};

type AvailableEvent = { id: string; title: string; dateLabel: string };
type ClaimEventLinkView = { id: string; eventId: string; eventTitle: string };

type AvailableWitnessAccount = {
  accountId: string;
  witnessId: string;
  witnessName: string | null;
  description: string;
};

type DocumentationSuggestion = { label: string; description: string };

type Props = {
  caseId: string;
  title?: string;
  description?: string;
  onFocusClaim?: (claimId: string, claimText: string) => void;
};

function displayStatus(claim: ClaimView): DocumentationStatus {
  return deriveDisplayStatus(claim.evidence.length, claim.latestAssessment?.status ?? null);
}

function verdictLabel(verdict: EvidenceVerdict) {
  if (verdict === "supports") return "Støtter";
  if (verdict === "contradicts") return "Motsier";
  return "Sier ikke noe om dette";
}

function observationTypeLabel(type: ObservationType) {
  return type === "direct" ? "Direkte observasjon" : "Andrehåndsopplysning";
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

export function ClaimsPanel({
  caseId,
  title = "Påstander og dokumentasjon",
  description = "Legg inn opplysninger fra saken én om gangen. For hver opplysning kan du koble dokumentasjon og be om en KI-vurdering av hva dokumentasjonen faktisk viser.",
  onFocusClaim,
}: Props) {
  const [claims, setClaims] = useState<ClaimView[]>([]);
  const [availableDocuments, setAvailableDocuments] = useState<AvailableDocument[]>([]);
  const [availableWitnessAccounts, setAvailableWitnessAccounts] = useState<AvailableWitnessAccount[]>([]);
  const [availableEvents, setAvailableEvents] = useState<AvailableEvent[]>([]);
  const [eventLinksByClaimId, setEventLinksByClaimId] = useState<Record<string, ClaimEventLinkView[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [newClaimText, setNewClaimText] = useState("");
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  const loadClaims = useCallback(async () => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/claims`, { headers });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke hente opplysninger.");
      setClaims(result.claims ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke hente opplysninger.");
    }
  }, [caseId]);

  const loadAvailableDocuments = useCallback(async () => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/documents`, { headers });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke hente dokumenter.");
      setAvailableDocuments(result.documents ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke hente dokumenter.");
    }
  }, [caseId]);

  const loadAvailableWitnessAccounts = useCallback(async () => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/witnesses`, { headers });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke hente vitner.");

      type WitnessJson = {
        id: string;
        name: string | null;
        accounts: { id: string; description: string }[];
      };

      const flattened: AvailableWitnessAccount[] = (result.witnesses ?? []).flatMap((w: WitnessJson) =>
        w.accounts.map((account) => ({
          accountId: account.id,
          witnessId: w.id,
          witnessName: w.name,
          description: account.description,
        }))
      );

      setAvailableWitnessAccounts(flattened);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke hente vitner.");
    }
  }, [caseId]);

  const loadAvailableEvents = useCallback(async () => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/events`, { headers });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke hente hendelser.");

      type EventJson = {
        id: string;
        title: string;
        eventDate: string | null;
        eventTime: string | null;
        datePrecision: "exact" | "date_only" | "approximate" | "unknown";
        approximateLabel: string | null;
        claims: { id: string; claimId: string; claim: { id: string; text: string } | null }[];
      };

      const events = (result.events ?? []) as EventJson[];

      setAvailableEvents(
        events.map((event) => ({
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

      const byClaimId: Record<string, ClaimEventLinkView[]> = {};
      for (const event of events) {
        for (const link of event.claims) {
          const list = byClaimId[link.claimId] ?? [];
          list.push({ id: link.id, eventId: event.id, eventTitle: event.title });
          byClaimId[link.claimId] = list;
        }
      }
      setEventLinksByClaimId(byClaimId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke hente hendelser.");
    }
  }, [caseId]);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await Promise.all([loadClaims(), loadAvailableDocuments(), loadAvailableWitnessAccounts(), loadAvailableEvents()]);
      setIsLoading(false);
    }

    init();
  }, [loadClaims, loadAvailableDocuments, loadAvailableWitnessAccounts, loadAvailableEvents]);

  async function handleAddClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = newClaimText.trim();
    if (!text) return;

    setIsSubmittingClaim(true);
    setErrorMessage("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/claims`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke lagre opplysningen.");

      setClaims((current) => [
        ...current,
        { ...result.claim, evidence: [], witnesses: [], latestAssessment: null },
      ]);
      setNewClaimText("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke lagre opplysningen.");
    } finally {
      setIsSubmittingClaim(false);
    }
  }

  function updateClaimInState(claimId: string, updater: (claim: ClaimView) => ClaimView) {
    setClaims((current) => current.map((claim) => (claim.id === claimId ? updater(claim) : claim)));
  }

  return (
    <Card padding="lg">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">{title}</p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>

      {errorMessage ? <ErrorBanner message={errorMessage} className="mt-4" /> : null}

      <form
        onSubmit={handleAddClaim}
        className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4"
      >
        <label htmlFor={`new-claim-${caseId}`} className="text-xs font-bold text-slate-700">
          Legg til en opplysning
        </label>
        <textarea
          id={`new-claim-${caseId}`}
          value={newClaimText}
          onChange={(event) => setNewClaimText(event.target.value)}
          placeholder="F.eks: Journalisten fikk dokumentasjonen før publisering."
          rows={2}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
        />
        <Button type="submit" size="sm" className="mt-3" disabled={isSubmittingClaim || !newClaimText.trim()}>
          {isSubmittingClaim ? "Lagrer..." : "Legg til opplysning"}
        </Button>
      </form>

      <div className="mt-6 space-y-4">
        {isLoading ? <LoadingState message="Laster opplysninger..." /> : null}

        {!isLoading && claims.length === 0 ? (
          <EmptyState
            title="Ingen opplysninger lagt inn ennå"
            description="Legg til opplysninger fra saken over, én om gangen. Du kan koble dokumentasjon til hver av dem etter hvert."
          />
        ) : null}

        {claims.map((claim) => (
          <ClaimCard
            key={claim.id}
            caseId={caseId}
            claim={claim}
            availableDocuments={availableDocuments}
            availableWitnessAccounts={availableWitnessAccounts}
            availableEvents={availableEvents}
            linkedEvents={eventLinksByClaimId[claim.id] ?? []}
            onClaimUpdated={(updated) => updateClaimInState(claim.id, () => updated)}
            onError={setErrorMessage}
            onDocumentUploaded={loadAvailableDocuments}
            onEventLinksChanged={loadAvailableEvents}
            onFocusClaim={onFocusClaim}
          />
        ))}
      </div>
    </Card>
  );
}

function ClaimCard({
  caseId,
  claim,
  availableDocuments,
  availableWitnessAccounts,
  availableEvents,
  linkedEvents,
  onClaimUpdated,
  onError,
  onDocumentUploaded,
  onEventLinksChanged,
  onFocusClaim,
}: {
  caseId: string;
  claim: ClaimView;
  availableDocuments: AvailableDocument[];
  availableWitnessAccounts: AvailableWitnessAccount[];
  availableEvents: AvailableEvent[];
  linkedEvents: ClaimEventLinkView[];
  onFocusClaim?: (claimId: string, claimText: string) => void;
  onClaimUpdated: (claim: ClaimView) => void;
  onError: (message: string) => void;
  onDocumentUploaded: () => void;
  onEventLinksChanged: () => void;
}) {
  const [isLinking, setIsLinking] = useState(false);
  const [isLinkingWitness, setIsLinkingWitness] = useState(false);
  const [isLinkingEvent, setIsLinkingEvent] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isAssessmentExpanded, setIsAssessmentExpanded] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<DocumentationSuggestion[] | null>(null);

  const status = displayStatus(claim);
  const linkedDocumentIds = useMemo(
    () => new Set(claim.evidence.map((link) => link.documentId)),
    [claim.evidence]
  );
  const unlinkedDocuments = availableDocuments.filter((doc) => !linkedDocumentIds.has(doc.id));

  const linkedWitnessAccountIds = useMemo(
    () => new Set(claim.witnesses.map((link) => link.witnessAccountId)),
    [claim.witnesses]
  );
  const unlinkedWitnessAccounts = availableWitnessAccounts.filter(
    (account) => !linkedWitnessAccountIds.has(account.accountId)
  );

  const linkedEventIds = useMemo(() => new Set(linkedEvents.map((link) => link.eventId)), [linkedEvents]);
  const unlinkedEvents = availableEvents.filter((event) => !linkedEventIds.has(event.id));

  async function linkEvent(eventId: string) {
    setIsBusy(true);
    onError("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/events/${eventId}/claim-links`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ claimId: claim.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke koble hendelsen.");
      onEventLinksChanged();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke koble hendelsen.");
    } finally {
      setIsBusy(false);
    }
  }

  async function unlinkEvent(eventId: string, linkId: string) {
    setIsBusy(true);
    onError("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/events/${eventId}/claim-links/${linkId}`, {
        method: "DELETE",
        headers,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke fjerne koblingen.");
      onEventLinksChanged();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke fjerne koblingen.");
    } finally {
      setIsBusy(false);
    }
  }

  async function linkDocument(documentId: string) {
    setIsBusy(true);
    onError("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/claims/${claim.id}/evidence-links`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke koble dokumentet.");

      const document = availableDocuments.find((doc) => doc.id === documentId) ?? null;

      onClaimUpdated({
        ...claim,
        noEvidenceConfirmedAt: null,
        evidence: [
          ...claim.evidence,
          {
            id: result.link.id,
            claimId: claim.id,
            documentId,
            createdAt: result.link.createdAt,
            document: document
              ? {
                  id: document.id,
                  title: document.title,
                  documentType: document.document_type,
                  fileName: document.file_name,
                  extractionStatus: document.extraction_status,
                  mimeType: null,
                }
              : null,
          },
        ],
      });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke koble dokumentet.");
    } finally {
      setIsBusy(false);
    }
  }

  async function unlinkDocument(linkId: string) {
    setIsBusy(true);
    onError("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(
        `/api/cases/${caseId}/claims/${claim.id}/evidence-links/${linkId}`,
        { method: "DELETE", headers }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke fjerne koblingen.");

      onClaimUpdated({
        ...claim,
        evidence: claim.evidence.filter((link) => link.id !== linkId),
      });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke fjerne koblingen.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUpload() {
    if (!uploadFile) return;
    setIsBusy(true);
    onError("");

    try {
      const headers = await getAuthHeader();
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadFile.name.replace(/\.[^/.]+$/, ""));
      formData.append("documentType", "other");

      const uploadResponse = await fetch(`/api/cases/${caseId}/documents`, {
        method: "POST",
        headers,
        body: formData,
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadResult?.error ?? "Opplasting feilet.");

      setUploadFile(null);
      onDocumentUploaded();
      await linkDocument(uploadResult.document.id);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Opplasting feilet.");
      setIsBusy(false);
    }
  }

  async function linkWitness(witnessAccountId: string) {
    setIsBusy(true);
    onError("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/claims/${claim.id}/witness-links`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ witnessAccountId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke koble vitnet.");

      const account = availableWitnessAccounts.find((a) => a.accountId === witnessAccountId) ?? null;

      onClaimUpdated({
        ...claim,
        witnesses: [
          ...claim.witnesses,
          {
            id: result.link.id,
            claimId: claim.id,
            witnessAccountId,
            witnessAccount: account
              ? { id: account.accountId, description: account.description, witnessName: account.witnessName }
              : null,
          },
        ],
      });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke koble vitnet.");
    } finally {
      setIsBusy(false);
    }
  }

  async function unlinkWitness(linkId: string) {
    setIsBusy(true);
    onError("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/claims/${claim.id}/witness-links/${linkId}`, {
        method: "DELETE",
        headers,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke fjerne koblingen.");

      onClaimUpdated({ ...claim, witnesses: claim.witnesses.filter((link) => link.id !== linkId) });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke fjerne koblingen.");
    } finally {
      setIsBusy(false);
    }
  }

  async function requestSuggestions() {
    setIsSuggesting(true);
    onError("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/claims/${claim.id}/suggest-documentation`, {
        method: "POST",
        headers,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke hente forslag.");

      setSuggestions(result.suggestion.suggestions);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke hente forslag.");
    } finally {
      setIsSuggesting(false);
    }
  }

  async function confirmNoEvidence() {
    setIsBusy(true);
    onError("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/claims/${claim.id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm_no_evidence" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke lagre.");

      onClaimUpdated({ ...claim, noEvidenceConfirmedAt: result.claim.noEvidenceConfirmedAt });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke lagre.");
    } finally {
      setIsBusy(false);
    }
  }

  async function requestAssessment() {
    setIsAssessing(true);
    onError("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/claims/${claim.id}/assess`, {
        method: "POST",
        headers,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke gjennomføre vurderingen.");

      onClaimUpdated({ ...claim, latestAssessment: result.assessment });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke gjennomføre vurderingen.");
    } finally {
      setIsAssessing(false);
    }
  }

  const assessment = claim.latestAssessment;
  const isUndocumentedAndConfirmed = claim.evidence.length === 0 && claim.noEvidenceConfirmedAt;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <EvidenceStatusBadge status={status} />
        {onFocusClaim ? (
          <button
            type="button"
            onClick={() => onFocusClaim(claim.id, claim.text)}
            className="text-xs font-bold text-red-700 hover:underline"
          >
            🔍 Vis dokumentasjon
          </button>
        ) : null}
      </div>

      <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        Din opplysning
      </p>
      <p className="mt-1 text-base font-semibold leading-6 text-slate-950">{claim.text}</p>

      <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        Dokumentasjon {claim.evidence.length > 0 ? `(${claim.evidence.length})` : ""}
      </p>

      {isUndocumentedAndConfirmed ? (
        <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm italic leading-6 text-slate-600">
          Brukerens opplysning – foreløpig ikke dokumentert. Det betyr ikke at opplysningen er
          uriktig, bare at det ennå ikke finnes noe i saken som bekrefter den.
        </p>
      ) : null}

      {claim.evidence.length > 0 ? (
        <div className="mt-2 space-y-2">
          {claim.evidence.map((link) => {
            const verdict = assessment?.evidenceBreakdown.find(
              (item) => item.documentId === link.documentId
            );

            return (
              <div
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">
                    {link.document?.title ?? "Dokument"}
                  </p>
                  {verdict ? (
                    <p className="text-xs text-slate-600">
                      {verdictLabel(verdict.verdict)} — {verdict.note}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => unlinkDocument(link.id)}
                  disabled={isBusy}
                  className="shrink-0 text-xs font-bold text-red-700 hover:underline disabled:opacity-60"
                >
                  Fjern kobling
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIsLinking((current) => !current)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-950 hover:bg-slate-100"
        >
          {isLinking ? "Lukk" : "+ Koble dokumentasjon"}
        </button>
        {claim.evidence.length === 0 && !claim.noEvidenceConfirmedAt ? (
          <button
            type="button"
            onClick={confirmNoEvidence}
            disabled={isBusy}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            Jeg har ingen dokumentasjon
          </button>
        ) : null}
        {claim.evidence.length > 0 ? (
          <Button size="sm" variant="secondary" disabled={isAssessing} onClick={requestAssessment}>
            {isAssessing ? "Vurderer..." : assessment ? "Be om ny KI-vurdering" : "Be om KI-vurdering"}
          </Button>
        ) : null}
      </div>

      {isLinking ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {unlinkedDocuments.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Velg eksisterende dokumentasjon</p>
              {unlinkedDocuments.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  disabled={isBusy}
                  onClick={() => linkDocument(doc.id)}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-950 hover:bg-red-50 disabled:opacity-60"
                >
                  {doc.title}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">Ingen andre dokumenter i saken å velge blant ennå.</p>
          )}

          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="text-xs font-bold text-slate-700">Eller last opp nytt dokument</p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,application/pdf,image/jpeg,image/png,image/webp,text/plain"
              onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
              className="mt-2 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
            />
            <Button size="sm" className="mt-2" disabled={isBusy || !uploadFile} onClick={handleUpload}>
              Last opp og koble
            </Button>
          </div>
        </div>
      ) : null}

      <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        Vitner {claim.witnesses.length > 0 ? `(${claim.witnesses.length})` : ""}
      </p>

      {claim.witnesses.length > 0 ? (
        <div className="mt-2 space-y-2">
          {claim.witnesses.map((link) => {
            const verdict = assessment?.witnessBreakdown.find(
              (item) => item.witnessAccountId === link.witnessAccountId
            );

            return (
              <div
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">
                    {link.witnessAccount?.witnessName ?? "Vitne"}
                    {link.witnessAccount?.description ? ` — ${link.witnessAccount.description}` : ""}
                  </p>
                  {verdict ? (
                    <p className="text-xs text-slate-600">
                      {verdictLabel(verdict.verdict)} ({observationTypeLabel(verdict.observationType)}) —{" "}
                      {verdict.note}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => unlinkWitness(link.id)}
                  disabled={isBusy}
                  className="shrink-0 text-xs font-bold text-red-700 hover:underline disabled:opacity-60"
                >
                  Fjern kobling
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIsLinkingWitness((current) => !current)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-950 hover:bg-slate-100"
        >
          {isLinkingWitness ? "Lukk" : "+ Koble vitne"}
        </button>

        {!isUndocumentedAndConfirmed ? (
          <Button size="sm" variant="secondary" disabled={isSuggesting} onClick={requestSuggestions}>
            {isSuggesting ? "Henter forslag..." : "💡 Få forslag til dokumentasjon"}
          </Button>
        ) : null}
      </div>

      {isLinkingWitness ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {unlinkedWitnessAccounts.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Velg et vitne</p>
              {unlinkedWitnessAccounts.map((account) => (
                <button
                  key={account.accountId}
                  type="button"
                  disabled={isBusy}
                  onClick={() => linkWitness(account.accountId)}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-950 hover:bg-red-50 disabled:opacity-60"
                >
                  {account.witnessName ?? "Vitne"} — {account.description}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Ingen andre vitneopplysninger i saken å velge blant ennå. Legg til vitner i vitnepanelet.
            </p>
          )}
        </div>
      ) : null}

      <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        Hendelser {linkedEvents.length > 0 ? `(${linkedEvents.length})` : ""}
      </p>

      {linkedEvents.length > 0 ? (
        <div className="mt-2 space-y-2">
          {linkedEvents.map((link) => (
            <div
              key={link.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <p className="truncate text-sm font-bold text-slate-950">{link.eventTitle}</p>
              <button
                type="button"
                onClick={() => unlinkEvent(link.eventId, link.id)}
                disabled={isBusy}
                className="shrink-0 text-xs font-bold text-red-700 hover:underline disabled:opacity-60"
              >
                Fjern kobling
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setIsLinkingEvent((current) => !current)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-950 hover:bg-slate-100"
        >
          {isLinkingEvent ? "Lukk" : "+ Koble hendelse"}
        </button>
      </div>

      {isLinkingEvent ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {unlinkedEvents.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Velg en hendelse</p>
              {unlinkedEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  disabled={isBusy}
                  onClick={() => linkEvent(event.id)}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-950 hover:bg-red-50 disabled:opacity-60"
                >
                  {event.dateLabel} — {event.title}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">Ingen andre hendelser i saken å velge blant ennå. Legg til hendelser i tidslinjen.</p>
          )}
        </div>
      ) : null}

      {suggestions && suggestions.length > 0 ? (
        <div className="mt-3 space-y-1.5 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800">
            Kan være relevant å se etter
          </p>
          {suggestions.map((item, index) => (
            <p key={index} className="text-xs leading-5 text-amber-900">
              <span className="font-bold">{item.label}:</span> {item.description}
            </p>
          ))}
        </div>
      ) : null}

      {assessment ? (
        <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <button
            type="button"
            onClick={() => setIsAssessmentExpanded((current) => !current)}
            className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">KI-vurdering</p>
            <span className="text-xs font-bold text-violet-800">
              Sikkerhet: {confidenceLabel(assessment.confidence)} {isAssessmentExpanded ? "− Skjul detaljer" : "+ Vis detaljer"}
            </span>
          </button>

          {isAssessmentExpanded ? (
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-800">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Hva dokumentasjonen viser
              </p>
              <p>{assessment.whatItShows}</p>
            </div>

            {assessment.supportsSummary ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                  Hva dokumentasjonen støtter
                </p>
                <p>{assessment.supportsSummary}</p>
              </div>
            ) : null}

            {assessment.contradictsSummary ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-700">
                  Hva dokumentasjonen motsier
                </p>
                <p>{assessment.contradictsSummary}</p>
              </div>
            ) : null}

            {assessment.conflictsBetweenEvidence ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-700">
                  Konflikt mellom dokumentene
                </p>
                <p>{assessment.conflictsBetweenEvidence}</p>
              </div>
            ) : null}

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Hva dokumentasjonen ikke viser
              </p>
              <p>{assessment.notDocumentedSummary}</p>
            </div>

            {assessment.timelineNote ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Tidslinje
                </p>
                <p>{assessment.timelineNote}</p>
              </div>
            ) : null}

            {assessment.corroborationNote ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                  Samlet støtte fra flere kilder
                </p>
                <p>{assessment.corroborationNote}</p>
              </div>
            ) : null}
          </div>
          ) : null}

          {isAssessmentExpanded ? (
            <>
              <p className="mt-4 text-xs font-semibold text-violet-800">
                Sikkerhet: {confidenceLabel(assessment.confidence)} — {assessment.confidenceReasoning}
              </p>
              <p className="mt-2 text-xs text-violet-600">
                Dette er en KI-vurdering av dokumentasjonen, ikke en konklusjon om saken.
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

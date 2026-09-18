"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Card,
  Badge,
  Button,
  LoadingState,
  EmptyState,
  ErrorBanner,
} from "@/components/design-system";
import { formatEventDate, detectDateConflict } from "@/lib/evidence/dateFacts";
import type { DatePrecision } from "@/lib/evidence/types";

type EventClaimLinkView = {
  id: string;
  claimId: string;
  claim: { id: string; text: string } | null;
};

type EventDocumentLinkView = {
  id: string;
  documentId: string;
  document: { id: string; title: string } | null;
};

type EventView = {
  id: string;
  caseId: string;
  title: string;
  description: string | null;
  eventDate: string | null;
  eventTime: string | null;
  datePrecision: DatePrecision;
  approximateLabel: string | null;
  claims: EventClaimLinkView[];
  documents: EventDocumentLinkView[];
};

type AvailableClaim = { id: string; text: string };
type AvailableDocument = { id: string; title: string };
type DocumentFactsMap = Record<string, { occurredAtDate: string | null; extractionStatus: string }>;

type Props = {
  caseId: string;
  title?: string;
  description?: string;
  onFocusEvent?: (eventId: string, eventTitle: string) => void;
};

const PRECISION_OPTIONS: { value: DatePrecision; label: string }[] = [
  { value: "exact", label: "Eksakt dato og klokkeslett" },
  { value: "date_only", label: "Kun dato" },
  { value: "approximate", label: "Omtrent tidspunkt" },
  { value: "unknown", label: "Ukjent tidspunkt" },
];

async function getAuthHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Innloggingen kunne ikke bekreftes. Last siden på nytt.");
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

export function TimelinePanel({
  caseId,
  title = "Tidslinje",
  description = "Bygg opp hendelsene i saken i rekkefølge. Koble påstander og dokumentasjon til hver hendelse for å se helheten.",
  onFocusEvent,
}: Props) {
  const [events, setEvents] = useState<EventView[]>([]);
  const [availableClaims, setAvailableClaims] = useState<AvailableClaim[]>([]);
  const [availableDocuments, setAvailableDocuments] = useState<AvailableDocument[]>([]);
  const [documentFacts, setDocumentFacts] = useState<DocumentFactsMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrecision, setFormPrecision] = useState<DatePrecision>("date_only");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formApproximateLabel, setFormApproximateLabel] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const headers = await getAuthHeader();
      const [eventsRes, claimsRes, documentsRes] = await Promise.all([
        fetch(`/api/cases/${caseId}/events`, { headers }),
        fetch(`/api/cases/${caseId}/claims`, { headers }),
        fetch(`/api/cases/${caseId}/documents`, { headers }),
      ]);

      const [eventsJson, claimsJson, documentsJson] = await Promise.all([
        eventsRes.json(),
        claimsRes.json(),
        documentsRes.json(),
      ]);

      if (!eventsRes.ok) throw new Error(eventsJson?.error ?? "Kunne ikke hente tidslinjen.");
      if (!claimsRes.ok) throw new Error(claimsJson?.error ?? "Kunne ikke hente opplysninger.");
      if (!documentsRes.ok) throw new Error(documentsJson?.error ?? "Kunne ikke hente dokumenter.");

      setEvents(eventsJson.events ?? []);
      setAvailableClaims((claimsJson.claims ?? []).map((c: AvailableClaim) => ({ id: c.id, text: c.text })));
      setAvailableDocuments(
        (documentsJson.documents ?? []).map((d: { id: string; title: string }) => ({
          id: d.id,
          title: d.title,
        }))
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke laste tidslinjen.");
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

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = formTitle.trim();
    if (!trimmedTitle) return;

    setIsCreating(true);
    setErrorMessage("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/events`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          description: formDescription.trim() || undefined,
          datePrecision: formPrecision,
          eventDate: formDate || undefined,
          eventTime: formPrecision === "exact" ? formTime || undefined : undefined,
          approximateLabel: formApproximateLabel.trim() || undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke lagre hendelsen.");

      setEvents((current) =>
        [...current, { ...result.event, claims: [], documents: [] }].sort((a, b) => {
          if (!a.eventDate && !b.eventDate) return 0;
          if (!a.eventDate) return 1;
          if (!b.eventDate) return -1;
          return a.eventDate.localeCompare(b.eventDate);
        })
      );

      setFormTitle("");
      setFormDescription("");
      setFormDate("");
      setFormTime("");
      setFormApproximateLabel("");
      setShowCreateForm(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke lagre hendelsen.");
    } finally {
      setIsCreating(false);
    }
  }

  function updateEventInState(eventId: string, updater: (event: EventView) => EventView) {
    setEvents((current) => current.map((event) => (event.id === eventId ? updater(event) : event)));
  }

  return (
    <Card padding="lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">{title}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowCreateForm((current) => !current)}>
          {showCreateForm ? "Lukk" : "+ Ny hendelse"}
        </Button>
      </div>

      {errorMessage ? <ErrorBanner message={errorMessage} className="mt-4" /> : null}

      {showCreateForm ? (
        <form onSubmit={handleCreateEvent} className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <label className="text-xs font-bold text-slate-700">Hva skjedde?</label>
            <input
              value={formTitle}
              onChange={(event) => setFormTitle(event.target.value)}
              placeholder="F.eks: Journalisten sender spørsmål"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-700">Presisjon</label>
              <select
                value={formPrecision}
                onChange={(event) => setFormPrecision(event.target.value as DatePrecision)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
              >
                {PRECISION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {formPrecision === "exact" || formPrecision === "date_only" || formPrecision === "approximate" ? (
              <div>
                <label className="text-xs font-bold text-slate-700">Dato</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(event) => setFormDate(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
                />
              </div>
            ) : null}
          </div>

          {formPrecision === "exact" ? (
            <div>
              <label className="text-xs font-bold text-slate-700">Klokkeslett</label>
              <input
                type="time"
                value={formTime}
                onChange={(event) => setFormTime(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
              />
            </div>
          ) : null}

          {formPrecision === "approximate" || formPrecision === "unknown" ? (
            <div>
              <label className="text-xs font-bold text-slate-700">
                Beskriv tidspunktet (f.eks. &quot;midt i mars 2026&quot;)
              </label>
              <input
                value={formApproximateLabel}
                onChange={(event) => setFormApproximateLabel(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
              />
            </div>
          ) : null}

          <div>
            <label className="text-xs font-bold text-slate-700">Beskrivelse (valgfritt)</label>
            <textarea
              value={formDescription}
              onChange={(event) => setFormDescription(event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
            />
          </div>

          <Button type="submit" size="sm" disabled={isCreating || !formTitle.trim()}>
            {isCreating ? "Lagrer..." : "Legg til hendelse"}
          </Button>
        </form>
      ) : null}

      <div className="mt-6 space-y-3">
        {isLoading ? <LoadingState message="Laster tidslinje..." /> : null}

        {!isLoading && events.length === 0 ? (
          <EmptyState
            title="Ingen hendelser lagt inn ennå"
            description="Legg til hendelser i rekkefølge for å bygge opp tidslinjen i saken."
          />
        ) : null}

        {events.map((event) => (
          <EventRow
            key={event.id}
            caseId={caseId}
            event={event}
            isExpanded={expandedEventId === event.id}
            onToggle={() => setExpandedEventId((current) => (current === event.id ? null : event.id))}
            availableClaims={availableClaims}
            availableDocuments={availableDocuments}
            documentFacts={documentFacts}
            onDocumentFactsLoaded={(map) => setDocumentFacts((current) => ({ ...current, ...map }))}
            onEventUpdated={(updated) => updateEventInState(event.id, () => updated)}
            onError={setErrorMessage}
            onFocusEvent={onFocusEvent}
          />
        ))}
      </div>
    </Card>
  );
}

function EventRow({
  caseId,
  event,
  isExpanded,
  onToggle,
  availableClaims,
  availableDocuments,
  documentFacts,
  onDocumentFactsLoaded,
  onEventUpdated,
  onError,
  onFocusEvent,
}: {
  caseId: string;
  event: EventView;
  isExpanded: boolean;
  onFocusEvent?: (eventId: string, eventTitle: string) => void;
  onToggle: () => void;
  availableClaims: AvailableClaim[];
  availableDocuments: AvailableDocument[];
  documentFacts: DocumentFactsMap;
  onDocumentFactsLoaded: (map: DocumentFactsMap) => void;
  onEventUpdated: (event: EventView) => void;
  onError: (message: string) => void;
}) {
  const [isLinkingClaim, setIsLinkingClaim] = useState(false);
  const [isLinkingDocument, setIsLinkingDocument] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const dateLabel = formatEventDate({
    eventDate: event.eventDate,
    eventTime: event.eventTime,
    datePrecision: event.datePrecision,
    approximateLabel: event.approximateLabel,
  });

  const linkedClaimIds = new Set(event.claims.map((link) => link.claimId));
  const linkedDocumentIds = new Set(event.documents.map((link) => link.documentId));
  const unlinkedClaims = availableClaims.filter((claim) => !linkedClaimIds.has(claim.id));
  const unlinkedDocuments = availableDocuments.filter((doc) => !linkedDocumentIds.has(doc.id));

  const conflict = detectDateConflict([
    { label: "Hendelsen", date: event.eventDate },
    ...event.documents.map((link) => ({
      label: link.document?.title ?? "Dokument",
      date: documentFacts[link.documentId]?.occurredAtDate ?? null,
    })),
  ]);

  async function linkClaim(claimId: string) {
    setIsBusy(true);
    onError("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/events/${event.id}/claim-links`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ claimId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke koble opplysningen.");

      const claim = availableClaims.find((c) => c.id === claimId) ?? null;
      onEventUpdated({
        ...event,
        claims: [...event.claims, { id: result.link.id, claimId, claim }],
      });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke koble opplysningen.");
    } finally {
      setIsBusy(false);
    }
  }

  async function unlinkClaim(linkId: string) {
    setIsBusy(true);
    onError("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(
        `/api/cases/${caseId}/events/${event.id}/claim-links/${linkId}`,
        { method: "DELETE", headers }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke fjerne koblingen.");

      onEventUpdated({ ...event, claims: event.claims.filter((link) => link.id !== linkId) });
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
      const response = await fetch(`/api/cases/${caseId}/events/${event.id}/document-links`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke koble dokumentet.");

      const document = availableDocuments.find((d) => d.id === documentId) ?? null;
      onEventUpdated({
        ...event,
        documents: [...event.documents, { id: result.link.id, documentId, document }],
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
        `/api/cases/${caseId}/events/${event.id}/document-links/${linkId}`,
        { method: "DELETE", headers }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke fjerne koblingen.");

      onEventUpdated({ ...event, documents: event.documents.filter((link) => link.id !== linkId) });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke fjerne koblingen.");
    } finally {
      setIsBusy(false);
    }
  }

  // Hent dokumentfakta (kun dato) for koblede dokumenter, til konfliktvisning.
  useEffect(() => {
    let cancelled = false;

    async function loadFacts() {
      const missing = event.documents.filter((link) => !(link.documentId in documentFacts));
      if (missing.length === 0) return;

      try {
        const headers = await getAuthHeader();
        const entries = await Promise.all(
          missing.map(async (link) => {
            const response = await fetch(`/api/cases/${caseId}/documents/${link.documentId}/facts`, {
              headers,
            });
            if (!response.ok) return [link.documentId, { occurredAtDate: null, extractionStatus: "unavailable" }] as const;
            const result = await response.json();
            return [
              link.documentId,
              {
                occurredAtDate: result.facts?.occurredAtDate ?? null,
                extractionStatus: result.facts?.extractionStatus ?? "pending",
              },
            ] as const;
          })
        );

        if (!cancelled) onDocumentFactsLoaded(Object.fromEntries(entries));
      } catch {
        // Stille feil - konfliktvisning er en bonus, ikke kritisk sti.
      }
    }

    loadFacts();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.documents.length]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex w-full flex-wrap items-center justify-between gap-2 p-4">
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-700">{dateLabel}</p>
          <p className="mt-1 font-bold text-slate-950">{event.title}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {event.documents.length} {event.documents.length === 1 ? "dokument" : "dokumenter"} ·{" "}
            {event.claims.length} {event.claims.length === 1 ? "påstand" : "påstander"}
            {conflict.hasConflict ? " · Motstridende datoer" : ""}
          </p>
        </button>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {conflict.hasConflict ? <Badge tone="warning">Ulike datoer oppgitt</Badge> : null}
          {onFocusEvent ? (
            <button
              type="button"
              onClick={() => onFocusEvent(event.id, event.title)}
              className="text-xs font-bold text-red-700 hover:underline"
            >
              🔍 Vis dokumentasjon
            </button>
          ) : null}
          <button type="button" onClick={onToggle} className="text-slate-400">
            {isExpanded ? "−" : "+"}
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="border-t border-slate-200 p-4">
          {event.description ? <p className="text-sm leading-6 text-slate-700">{event.description}</p> : null}

          <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Koblede påstander</p>
          {event.claims.length > 0 ? (
            <div className="mt-2 space-y-2">
              {event.claims.map((link) => (
                <div key={link.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-sm text-slate-800">{link.claim?.text ?? "Opplysning"}</p>
                  <button
                    type="button"
                    onClick={() => unlinkClaim(link.id)}
                    disabled={isBusy}
                    className="shrink-0 text-xs font-bold text-red-700 hover:underline disabled:opacity-60"
                  >
                    Fjern
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-500">Ingen påstander koblet ennå.</p>
          )}
          <button
            type="button"
            onClick={() => setIsLinkingClaim((current) => !current)}
            className="mt-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-slate-100"
          >
            {isLinkingClaim ? "Lukk" : "+ Koble påstand"}
          </button>
          {isLinkingClaim ? (
            <div className="mt-2 space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {unlinkedClaims.length === 0 ? (
                <p className="text-sm text-slate-600">Ingen flere opplysninger å koble.</p>
              ) : (
                unlinkedClaims.map((claim) => (
                  <button
                    key={claim.id}
                    type="button"
                    disabled={isBusy}
                    onClick={() => linkClaim(claim.id)}
                    className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:bg-red-50 disabled:opacity-60"
                  >
                    {claim.text}
                  </button>
                ))
              )}
            </div>
          ) : null}

          <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Koblede dokumenter</p>
          {event.documents.length > 0 ? (
            <div className="mt-2 space-y-2">
              {event.documents.map((link) => (
                <div key={link.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-950">{link.document?.title ?? "Dokument"}</p>
                  <button
                    type="button"
                    onClick={() => unlinkDocument(link.id)}
                    disabled={isBusy}
                    className="shrink-0 text-xs font-bold text-red-700 hover:underline disabled:opacity-60"
                  >
                    Fjern
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-500">Ingen dokumenter koblet ennå.</p>
          )}
          <button
            type="button"
            onClick={() => setIsLinkingDocument((current) => !current)}
            className="mt-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-slate-100"
          >
            {isLinkingDocument ? "Lukk" : "+ Koble dokument"}
          </button>
          {isLinkingDocument ? (
            <div className="mt-2 space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {unlinkedDocuments.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Ingen flere dokumenter å koble. Last opp under Dokumenter eller Påstander først.
                </p>
              ) : (
                unlinkedDocuments.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    disabled={isBusy}
                    onClick={() => linkDocument(doc.id)}
                    className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:bg-red-50 disabled:opacity-60"
                  >
                    {doc.title}
                  </button>
                ))
              )}
            </div>
          ) : null}

          {conflict.hasConflict ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              Hendelsen og/eller koblede dokumenter oppgir ulike datoer ({conflict.distinctDates.join(", ")}).
              Dette skjules ikke - sjekk om det er en skrivefeil eller en reell uoverensstemmelse.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

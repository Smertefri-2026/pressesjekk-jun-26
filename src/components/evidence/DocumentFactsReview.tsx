"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Badge, Button } from "@/components/design-system";
import type { DocumentFacts } from "@/lib/evidence/types";
import { DOCUMENT_KIND_LABELS, SOURCE_CHARACTERISTIC_LABELS } from "@/lib/evidence/labels";

async function getAuthHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Innloggingen kunne ikke bekreftes. Last siden på nytt.");
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

function correctedOrOriginal(facts: DocumentFacts, field: string, original: string | null): string | null {
  return facts.userCorrections[field] ?? original;
}

/**
 * Fase 5: "Hva fant vi?" - kort, forståelig gjennomgang av KI-ekstraherte
 * dokumentfakta rett etter opplasting (eller når et dokument åpnes på
 * nytt). Viser KUN felt det faktisk finnes grunnlag for - ingen gjetting.
 * Bruker kan bekrefte eller korrigere; KI sin opprinnelige ekstraksjon
 * overskrives ALDRI, korreksjoner legges i et eget lag (se
 * documents/[documentId]/facts/route.ts).
 */
export function DocumentFactsReview({
  caseId,
  documentId,
  facts,
  intentNote,
  onFactsUpdated,
  onIntentUpdated,
  onError,
  onDismiss,
}: {
  caseId: string;
  documentId: string;
  facts: DocumentFacts;
  intentNote: string | null;
  onFactsUpdated: (facts: DocumentFacts) => void;
  onIntentUpdated: (note: string | null) => void;
  onError: (message: string) => void;
  onDismiss?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [intentDraft, setIntentDraft] = useState(intentNote ?? "");
  const [isSavingIntent, setIsSavingIntent] = useState(false);

  if (facts.extractionStatus === "unsupported") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Denne filtypen støttes ikke for automatisk tekstlesing ennå, så vi kunne ikke hente ut fakta automatisk.
      </div>
    );
  }

  if (facts.extractionStatus === "failed") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Automatisk gjennomgang av dokumentet feilet. Du kan fortsatt koble dokumentet til påstander manuelt.
        {facts.extractionError ? <p className="mt-1 text-xs text-amber-700">{facts.extractionError}</p> : null}
      </div>
    );
  }

  if (facts.extractionStatus === "pending" || facts.extractionStatus === "processing") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        KI analyserer dokumentet...
      </div>
    );
  }

  const rows: { field: string; label: string; value: string }[] = [];

  const kind = correctedOrOriginal(facts, "document_kind", facts.documentKind);
  if (kind) rows.push({ field: "document_kind", label: "Dokumenttype", value: DOCUMENT_KIND_LABELS[kind] ?? kind });

  const date = correctedOrOriginal(facts, "occurred_at_date", facts.occurredAtDate);
  if (date) {
    rows.push({
      field: "occurred_at_date",
      label: "Dato",
      value: facts.occurredAtTime ? `${date} kl. ${facts.occurredAtTime}` : date,
    });
  }

  for (const [field, entry] of Object.entries(facts.structuredFacts)) {
    const corrected = facts.userCorrections[field];
    const value = corrected ?? (Array.isArray(entry.value) ? entry.value.join(", ") : entry.value);
    if (!value) continue;
    rows.push({ field, label: field.replace(/_/g, " "), value });
  }

  const likelyEvent = correctedOrOriginal(facts, "likely_event_description", facts.likelyEventDescription);
  if (likelyEvent) rows.push({ field: "likely_event_description", label: "Kan gjelde hendelsen", value: likelyEvent });

  async function confirmFacts() {
    setIsBusy(true);
    onError("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/documents/${documentId}/facts`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke bekrefte.");
      onFactsUpdated(result.facts);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke bekrefte.");
    } finally {
      setIsBusy(false);
    }
  }

  function startEditing() {
    const seed: Record<string, string> = {};
    for (const row of rows) seed[row.field] = row.value;
    setEditValues(seed);
    setIsEditing(true);
  }

  async function saveCorrections() {
    setIsBusy(true);
    onError("");

    // Kun felt brukeren FAKTISK endret skal markeres som en rettelse - ikke
    // hele skjemaet, selv om alle feltene ble seedet med gjeldende verdi ved
    // start av redigering (ellers ville uendrede felt feilaktig vises som
    // "rettet av deg").
    const changedCorrections: Record<string, string> = {};
    for (const row of rows) {
      const edited = editValues[row.field];
      if (edited !== undefined && edited !== row.value) {
        changedCorrections[row.field] = edited;
      }
    }

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/documents/${documentId}/facts`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "correct", corrections: changedCorrections }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke lagre rettelsene.");
      onFactsUpdated(result.facts);
      setIsEditing(false);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke lagre rettelsene.");
    } finally {
      setIsBusy(false);
    }
  }

  async function saveIntent() {
    setIsSavingIntent(true);
    onError("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/documents/${documentId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_intent", userIntentNote: intentDraft }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke lagre.");
      onIntentUpdated(result.document.user_intent_note ?? null);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke lagre.");
    } finally {
      setIsSavingIntent(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Hva fant vi?</p>
        {facts.userConfirmed ? <Badge tone="success">Bekreftet</Badge> : <Badge tone="info">Ikke sett gjennom ennå</Badge>}
      </div>

      {facts.summary ? <p className="mt-2 text-sm leading-6 text-slate-700">{facts.summary}</p> : null}

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Vi fant ikke nok informasjon i dokumentet til å vise noe her ennå.</p>
      ) : isEditing ? (
        <div className="mt-3 space-y-2">
          {rows.map((row) => (
            <div key={row.field}>
              <label className="text-xs font-bold capitalize text-slate-600">{row.label}</label>
              <input
                value={editValues[row.field] ?? ""}
                onChange={(event) => setEditValues((current) => ({ ...current, [row.field]: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-red-500"
              />
            </div>
          ))}
        </div>
      ) : (
        <dl className="mt-3 space-y-1.5">
          {rows.map((row) => (
            <div key={row.field} className="flex flex-wrap gap-1.5 text-sm">
              <dt className="font-bold capitalize text-slate-600">{row.label}:</dt>
              <dd className="text-slate-800">
                {row.value}
                {facts.userCorrections[row.field] ? <span className="ml-1.5 text-xs text-emerald-700">(rettet av deg)</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {facts.sourceCharacteristics.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {facts.sourceCharacteristics.map((c) => (
            <Badge key={c} tone="neutral">
              {SOURCE_CHARACTERISTIC_LABELS[c] ?? c}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {isEditing ? (
          <>
            <Button size="sm" disabled={isBusy} onClick={saveCorrections}>
              {isBusy ? "Lagrer..." : "Lagre rettelser"}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setIsEditing(false)}>
              Avbryt
            </Button>
          </>
        ) : (
          <>
            {!facts.userConfirmed ? (
              <Button size="sm" disabled={isBusy} onClick={confirmFacts}>
                {isBusy ? "Lagrer..." : "Dette stemmer"}
              </Button>
            ) : null}
            {rows.length > 0 ? (
              <Button size="sm" variant="secondary" disabled={isBusy} onClick={startEditing}>
                Rett noe
              </Button>
            ) : null}
            {onDismiss ? (
              <Button size="sm" variant="secondary" onClick={onDismiss}>
                Lukk
              </Button>
            ) : null}
          </>
        )}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <label className="text-xs font-bold text-slate-700">
          Hva ønsker du at vi særlig skal se etter i dette dokumentet?
        </label>
        <p className="mt-0.5 text-xs text-slate-500">
          Dette er din egen forventning, ikke et faktum - KI-en vil senere si om dokumentet faktisk bekrefter, motsier eller ikke dekker dette.
        </p>
        <textarea
          value={intentDraft}
          onChange={(event) => setIntentDraft(event.target.value)}
          rows={2}
          placeholder="F.eks: At denne e-posten viser at journalisten fikk svaret vårt før publisering."
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-500"
        />
        <Button size="sm" variant="secondary" className="mt-2" disabled={isSavingIntent || intentDraft === (intentNote ?? "")} onClick={saveIntent}>
          {isSavingIntent ? "Lagrer..." : "Lagre"}
        </Button>
      </div>
    </div>
  );
}

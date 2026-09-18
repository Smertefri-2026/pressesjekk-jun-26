"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Button,
  Card,
  DocumentationGapCard,
  EmptyState,
  EvidenceRelationList,
  LoadingState,
  StatusSummary,
  type EvidenceRelationGroup,
} from "@/components/design-system";
import { computeDocumentationCenterOverview } from "@/lib/evidence/documentationCenterOverview";
import type { DocumentationGapType, DocumentationStatus } from "@/lib/evidence/types";

type ClaimAssessmentView = {
  status: Exclude<DocumentationStatus, "not_assessed">;
};

type ClaimEvidenceLinkView = { documentId: string; document: { id: string; title: string } | null };
type ClaimWitnessLinkView = {
  witnessAccountId: string;
  witnessAccount: { id: string; description: string; witnessName: string | null } | null;
};

type ClaimView = {
  id: string;
  text: string;
  noEvidenceConfirmedAt: string | null;
  evidence: ClaimEvidenceLinkView[];
  witnesses: ClaimWitnessLinkView[];
  latestAssessment: ClaimAssessmentView | null;
};

type EventClaimLinkView = { claimId: string; claim: { id: string; text: string } | null };
type EventDocumentLinkView = { documentId: string; document: { id: string; title: string } | null };

type EventView = {
  id: string;
  title: string;
  claims: EventClaimLinkView[];
  documents: EventDocumentLinkView[];
};

type GapView = { type: DocumentationGapType; entityId: string; description: string };

type CaseSummaryView = {
  bestDocumentedSummary: string | null;
  partiallyDocumentedSummary: string | null;
  conflictsSummary: string | null;
  keyGapsSummary: string | null;
  strengthenAreasSummary: string | null;
} | null;

type Suggestion = { label: string; description: string };

const GAP_TYPE_LABELS: Record<DocumentationGapType, string> = {
  undocumented_claim: "Dokumentasjon mangler",
  partially_documented_claim: "Kun delvis dokumentert",
  conflicting_claim: "Motstridende opplysninger",
  unanchored_claim: "Ikke knyttet til tidslinjen",
  undocumented_event: "Hendelse uten dokumentasjon",
  unconfirmed_witness: "Vitne uten skriftlig erklæring",
};

const SUBTABS = [
  { key: "oversikt", label: "Oversikt" },
  { key: "hull", label: "Dokumentasjonshull" },
  { key: "kart", label: "Bevisoversikt" },
] as const;

type SubtabKey = (typeof SUBTABS)[number]["key"];

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
 * Dokumentasjonsoversikt, -hull og bevisoversikt for saken - flyttet inn i
 * Full rapport fra det tidligere frittstående Dokumentasjonssenteret.
 * Påstander/Dokumenter/Tidslinje/Vitner dupliseres bevisst ikke her - de
 * finnes allerede lenger opp på siden.
 */
export function DocumentationInsightsPanel({ caseId }: { caseId: string }) {
  const [claims, setClaims] = useState<ClaimView[]>([]);
  const [events, setEvents] = useState<EventView[]>([]);
  const [gaps, setGaps] = useState<GapView[]>([]);
  const [summary, setSummary] = useState<CaseSummaryView>(null);
  const [documentCount, setDocumentCount] = useState(0);
  const [witnessCount, setWitnessCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeSubtab, setActiveSubtab] = useState<SubtabKey>("oversikt");

  const loadAll = useCallback(async () => {
    try {
      const headers = await getAuthHeader();

      const [claimsRes, documentsRes, eventsRes, witnessesRes, gapsRes, summaryRes] = await Promise.all([
        fetch(`/api/cases/${caseId}/claims`, { headers }),
        fetch(`/api/cases/${caseId}/documents`, { headers }),
        fetch(`/api/cases/${caseId}/events`, { headers }),
        fetch(`/api/cases/${caseId}/witnesses`, { headers }),
        fetch(`/api/cases/${caseId}/documentation-gaps`, { headers }),
        fetch(`/api/cases/${caseId}/case-summary`, { headers }),
      ]);

      const [claimsJson, documentsJson, eventsJson, witnessesJson, gapsJson, summaryJson] = await Promise.all([
        claimsRes.json(),
        documentsRes.json(),
        eventsRes.json(),
        witnessesRes.json(),
        gapsRes.json(),
        summaryRes.json(),
      ]);

      if (!claimsRes.ok) throw new Error(claimsJson?.error ?? "Kunne ikke hente påstander.");
      if (!documentsRes.ok) throw new Error(documentsJson?.error ?? "Kunne ikke hente dokumenter.");
      if (!eventsRes.ok) throw new Error(eventsJson?.error ?? "Kunne ikke hente tidslinjen.");
      if (!witnessesRes.ok) throw new Error(witnessesJson?.error ?? "Kunne ikke hente vitner.");
      if (!gapsRes.ok) throw new Error(gapsJson?.error ?? "Kunne ikke hente dokumentasjonshull.");
      if (!summaryRes.ok) throw new Error(summaryJson?.error ?? "Kunne ikke hente oppsummeringen.");

      setClaims(claimsJson.claims ?? []);
      setDocumentCount((documentsJson.documents ?? []).length);
      setEvents(eventsJson.events ?? []);
      setWitnessCount((witnessesJson.witnesses ?? []).length);
      setGaps(gapsJson.gaps ?? []);
      setSummary(summaryJson.summary ?? null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke laste dokumentasjonsstatus.");
    }
  }, [caseId]);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await loadAll();
      setIsLoading(false);
    }

    if (caseId) init();
  }, [caseId, loadAll]);

  const overview = useMemo(
    () =>
      computeDocumentationCenterOverview({
        documentCount,
        claims: claims.map((claim) => ({
          evidenceCount: claim.evidence.length,
          latestAssessmentStatus: claim.latestAssessment?.status ?? null,
        })),
        witnessCount,
        gapCount: gaps.length,
      }),
    [documentCount, claims, witnessCount, gaps.length]
  );

  return (
    <div id="dokumentasjonsstatus" className="mt-8 scroll-mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">Dokumentasjon</p>
      <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">Dokumentasjonsstatus</h2>
      <p className="mt-4 max-w-3xl leading-8 text-slate-700">
        Hva som er dokumentert, hva som mangler, og hvordan hendelser, påstander og dokumenter henger sammen i saken.
      </p>

      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{errorMessage}</div>
      ) : null}

      {isLoading ? (
        <div className="mt-6">
          <LoadingState message="Laster dokumentasjonsstatus..." />
        </div>
      ) : (
        <>
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1" role="tablist">
            {SUBTABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeSubtab === tab.key}
                onClick={() => setActiveSubtab(tab.key)}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-black transition ${
                  activeSubtab === tab.key
                    ? "bg-slate-950 text-white"
                    : "border border-slate-300 bg-white text-slate-950 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {activeSubtab === "oversikt" ? (
              <OversiktSection caseId={caseId} overview={overview} summary={summary} onSummaryGenerated={setSummary} onError={setErrorMessage} />
            ) : null}
            {activeSubtab === "hull" ? <HullSection caseId={caseId} claims={claims} gaps={gaps} onError={setErrorMessage} /> : null}
            {activeSubtab === "kart" ? <EvidenceMapSection events={events} claims={claims} /> : null}
          </div>
        </>
      )}
    </div>
  );
}

function OversiktSection({
  caseId,
  overview,
  summary,
  onSummaryGenerated,
  onError,
}: {
  caseId: string;
  overview: ReturnType<typeof computeDocumentationCenterOverview>;
  summary: CaseSummaryView;
  onSummaryGenerated: (summary: CaseSummaryView) => void;
  onError: (message: string) => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function requestSummary() {
    setIsGenerating(true);
    onError("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/case-summary`, {
        method: "POST",
        headers,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke lage oppsummeringen.");
      onSummaryGenerated(result.summary);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke lage oppsummeringen.");
    } finally {
      setIsGenerating(false);
    }
  }

  const summaryFields: { label: string; value: string | null }[] = summary
    ? [
        { label: "Best dokumentert", value: summary.bestDocumentedSummary },
        { label: "Delvis dokumentert", value: summary.partiallyDocumentedSummary },
        { label: "Motstridende opplysninger", value: summary.conflictsSummary },
        { label: "Sentrale dokumentasjonshull", value: summary.keyGapsSummary },
        { label: "Dette kan styrke saken", value: summary.strengthenAreasSummary },
      ]
    : [];

  return (
    <div className="space-y-6">
      <StatusSummary
        items={[
          { label: "Dokumenter", count: overview.documentCount, tone: "neutral" },
          { label: "Påstander", count: overview.claimCount, tone: "neutral" },
          { label: "Godt dokumentert", count: overview.claimStatusCounts.well_documented, tone: "success" },
          { label: "Delvis dokumentert", count: overview.claimStatusCounts.partially_documented, tone: "warning" },
          { label: "Motstridende", count: overview.claimStatusCounts.conflicting, tone: "danger" },
          { label: "Mangler dokumentasjon", count: overview.claimStatusCounts.undocumented, tone: "neutral" },
          { label: "Ikke vurdert", count: overview.claimStatusCounts.not_assessed, tone: "info" },
          { label: "Vitner", count: overview.witnessCount, tone: "info" },
          { label: "Dokumentasjonshull", count: overview.gapCount, tone: "warning" },
        ]}
      />

      <Card padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">KI-oppsummering</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              En saksbred oppsummering basert på det som allerede er vurdert per påstand - ingen ny lesning av
              dokumentene, og aldri en samlet konklusjon om saken.
            </p>
          </div>
          <Button size="sm" variant="secondary" disabled={isGenerating} onClick={requestSummary}>
            {isGenerating ? "Lager oppsummering..." : summary ? "Oppdater oppsummering" : "Lag oppsummering"}
          </Button>
        </div>

        {summary ? (
          <div className="mt-5 space-y-4">
            {summaryFields
              .filter((field) => field.value)
              .map((field) => (
                <div key={field.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{field.label}</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-800">{field.value}</p>
                </div>
              ))}
            {summaryFields.every((field) => !field.value) ? (
              <p className="text-sm text-slate-500">Ingen av kategoriene hadde noe å oppsummere ennå.</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Ingen oppsummering laget ennå.</p>
        )}
      </Card>
    </div>
  );
}

function HullSection({
  caseId,
  claims,
  gaps,
  onError,
}: {
  caseId: string;
  claims: ClaimView[];
  gaps: GapView[];
  onError: (message: string) => void;
}) {
  const [suggestionsByClaimId, setSuggestionsByClaimId] = useState<Record<string, Suggestion[]>>({});
  const [loadingClaimId, setLoadingClaimId] = useState<string | null>(null);

  const CLAIM_GAP_TYPES = new Set<DocumentationGapType>([
    "undocumented_claim",
    "partially_documented_claim",
    "conflicting_claim",
    "unanchored_claim",
  ]);

  const confirmedClaims = claims.filter((claim) => claim.noEvidenceConfirmedAt);

  async function requestSuggestions(claimId: string) {
    setLoadingClaimId(claimId);
    onError("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/claims/${claimId}/suggest-documentation`, {
        method: "POST",
        headers,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke hente forslag.");
      setSuggestionsByClaimId((current) => ({ ...current, [claimId]: result.suggestion.suggestions }));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke hente forslag.");
    } finally {
      setLoadingClaimId(null);
    }
  }

  if (gaps.length === 0) {
    return (
      <EmptyState
        title="Ingen dokumentasjonshull identifisert"
        description="Så langt dekker dokumentasjonen det som er registrert i saken. Dette betyr ikke at saken er ferdig - bare at det ikke er identifisert noe åpenbart hull akkurat nå."
      />
    );
  }

  return (
    <div className="space-y-3">
      {gaps.map((gap, index) => {
        const isClaimGap = CLAIM_GAP_TYPES.has(gap.type);
        const claim = isClaimGap ? claims.find((c) => c.id === gap.entityId) : undefined;
        const suggestions = claim ? suggestionsByClaimId[claim.id] : undefined;

        return (
          <DocumentationGapCard
            key={index}
            typeLabel={GAP_TYPE_LABELS[gap.type]}
            description={gap.description}
            suggestions={suggestions}
            action={
              claim ? (
                <Button size="sm" variant="secondary" disabled={loadingClaimId === claim.id} onClick={() => requestSuggestions(claim.id)}>
                  {loadingClaimId === claim.id ? "Henter..." : "💡 Få forslag"}
                </Button>
              ) : undefined
            }
          />
        );
      })}

      {confirmedClaims.length > 0 ? (
        <p className="mt-2 text-xs italic text-slate-500">
          {`${confirmedClaims.length} ${confirmedClaims.length === 1 ? "påstand er" : "påstander er"} markert med "ingen mer dokumentasjon finnes" og vises derfor ikke som hull her.`}
        </p>
      ) : null}
    </div>
  );
}

function EvidenceMapSection({ events, claims }: { events: EventView[]; claims: ClaimView[] }) {
  const claimById = useMemo(() => new Map(claims.map((claim) => [claim.id, claim])), [claims]);
  const anchoredClaimIds = useMemo(() => new Set(events.flatMap((event) => event.claims.map((link) => link.claimId))), [events]);
  const unanchoredClaims = claims.filter((claim) => !anchoredClaimIds.has(claim.id));

  if (events.length === 0 && claims.length === 0) {
    return <EmptyState title="Ingenting å vise ennå" description="Legg til påstander, hendelser og dokumentasjon for å se sammenhengene i saken." />;
  }

  return (
    <div className="space-y-6">
      <Card padding="md">
        <p className="text-sm leading-6 text-slate-600">
          Viser hvordan hendelser, påstander, dokumenter og vitner henger sammen i saken - fra hendelse til påstand
          til det som støtter eller motsier den.
        </p>
      </Card>

      {events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-700">Hendelse</p>
              <p className="mt-1 font-bold text-slate-950">{event.title}</p>

              {event.claims.length === 0 ? (
                <p className="mt-3 border-l-2 border-slate-200 pl-4 text-sm text-slate-500">Ingen påstander koblet.</p>
              ) : (
                <div className="mt-3 space-y-3 border-l-2 border-slate-200 pl-4">
                  {event.claims.map((link) => {
                    const claim = link.claimId ? claimById.get(link.claimId) : undefined;
                    return (
                      <div key={link.claimId}>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">↳ Påstand</p>
                        <p className="text-sm font-semibold text-slate-950">{link.claim?.text ?? "Påstand"}</p>
                        {claim ? (
                          <div className="mt-2 border-l-2 border-slate-100 pl-4">
                            <EvidenceRelationList
                              groups={[
                                {
                                  label: "Dokumenter",
                                  items: claim.evidence.map((e) => ({ id: e.documentId, label: e.document?.title ?? "Dokument" })),
                                },
                                {
                                  label: "Vitner",
                                  items: claim.witnesses.map((w) => ({
                                    id: w.witnessAccountId,
                                    label: w.witnessAccount?.witnessName ?? w.witnessAccount?.description ?? "Vitne",
                                  })),
                                },
                              ]}
                              emptyLabel="Ingen dokumenter eller vitner koblet ennå."
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {unanchoredClaims.length > 0 ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Påstander uten hendelse på tidslinjen</p>
          <div className="mt-3 space-y-3">
            {unanchoredClaims.map((claim) => (
              <div key={claim.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-950">{claim.text}</p>
                <div className="mt-2 border-l-2 border-slate-100 pl-4">
                  <EvidenceRelationList
                    groups={
                      [
                        { label: "Dokumenter", items: claim.evidence.map((e) => ({ id: e.documentId, label: e.document?.title ?? "Dokument" })) },
                        {
                          label: "Vitner",
                          items: claim.witnesses.map((w) => ({
                            id: w.witnessAccountId,
                            label: w.witnessAccount?.witnessName ?? w.witnessAccount?.description ?? "Vitne",
                          })),
                        },
                      ] as EvidenceRelationGroup[]
                    }
                    emptyLabel="Ingen dokumenter eller vitner koblet ennå."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

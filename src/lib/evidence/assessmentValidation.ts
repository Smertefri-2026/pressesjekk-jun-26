import type {
  AssessmentConfidence,
  DocumentationStatus,
  EvidenceBreakdownItem,
  EvidenceVerdict,
  WitnessBreakdownItem,
} from "./types";

export type ValidatedAssessmentPayload = {
  whatItShows: string;
  supportsSummary: string | null;
  contradictsSummary: string | null;
  notDocumentedSummary: string;
  conflictsBetweenEvidence: string | null;
  /** Fase 2A: kun satt når hendelser var del av vurderingsgrunnlaget. */
  timelineNote: string | null;
  /** Fase 2B: kun satt når uavhengige kildetyper samlet peker samme vei. */
  corroborationNote: string | null;
  status: Exclude<DocumentationStatus, "not_assessed">;
  confidence: AssessmentConfidence;
  confidenceReasoning: string;
  evidenceBreakdown: EvidenceBreakdownItem[];
  /** Fase 2B: strukturelt atskilt fra evidenceBreakdown - aldri blandet sammen. */
  witnessBreakdown: WitnessBreakdownItem[];
};

const VALID_STATUSES = new Set<string>([
  "well_documented",
  "partially_documented",
  "conflicting",
  "undocumented",
]);

const VALID_CONFIDENCE = new Set<string>(["high", "medium", "low"]);
const VALID_VERDICTS = new Set<string>(["supports", "contradicts", "silent"]);
const VALID_OBSERVATION_TYPES = new Set<string>(["direct", "secondhand"]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || value === undefined || typeof value === "string";
}

/**
 * Validerer at et rått KI-JSON-svar faktisk har formen en
 * bevisvurdering skal ha, FØR den lagres. Et modellsvar som ikke består
 * denne sjekken skal aldri nå databasen som en gyldig vurdering - det er
 * nøyaktig samme prinsipp som resten av sikkerhetsarbeidet i denne
 * kodebasen: aldri stole blindt på KI-output.
 *
 * validDocumentIds/validWitnessAccountIds brukes til å luke ut
 * breakdown-oppføringer som refererer til noe som ikke faktisk var del av
 * vurderingsgrunnlaget (KI kan hallusinere en ID) - og, avgjørende: en
 * witness_breakdown-oppføring med en dokument-ID (eller omvendt) lukes ut
 * her, ikke bare stolt på at KI holdt dem atskilt.
 */
export function validateAssessmentPayload(
  raw: unknown,
  validDocumentIds: string[],
  validWitnessAccountIds: string[] = []
): ValidatedAssessmentPayload | null {
  if (!raw || typeof raw !== "object") return null;

  const value = raw as Record<string, unknown>;

  if (!isNonEmptyString(value.what_it_shows)) return null;
  if (!isNonEmptyString(value.not_documented_summary)) return null;
  if (!isNonEmptyString(value.confidence_reasoning)) return null;
  if (!isNullableString(value.supports_summary)) return null;
  if (!isNullableString(value.contradicts_summary)) return null;
  if (!isNullableString(value.conflicts_between_evidence)) return null;
  if (!isNullableString(value.timeline_note)) return null;
  if (!isNullableString(value.corroboration_note)) return null;

  if (typeof value.status !== "string" || !VALID_STATUSES.has(value.status)) return null;
  if (typeof value.confidence !== "string" || !VALID_CONFIDENCE.has(value.confidence)) return null;

  const validDocIds = new Set(validDocumentIds);
  const rawBreakdown = Array.isArray(value.evidence_breakdown) ? value.evidence_breakdown : [];

  const evidenceBreakdown: EvidenceBreakdownItem[] = [];

  for (const entry of rawBreakdown) {
    if (!entry || typeof entry !== "object") continue;

    const item = entry as Record<string, unknown>;
    const documentId = item.document_id;
    const verdict = item.verdict;
    const note = item.note;

    // Streng atskillelse: en oppføring som refererer til en vitne-ID hører
    // ikke hjemme her, uansett hva feltnavnet ellers ser riktig ut.
    if (typeof documentId !== "string" || !validDocIds.has(documentId)) continue;
    if (typeof verdict !== "string" || !VALID_VERDICTS.has(verdict)) continue;
    if (!isNonEmptyString(note)) continue;

    evidenceBreakdown.push({
      documentId,
      verdict: verdict as EvidenceVerdict,
      note,
    });
  }

  const validWitnessIds = new Set(validWitnessAccountIds);
  const rawWitnessBreakdown = Array.isArray(value.witness_breakdown) ? value.witness_breakdown : [];

  const witnessBreakdown: WitnessBreakdownItem[] = [];

  for (const entry of rawWitnessBreakdown) {
    if (!entry || typeof entry !== "object") continue;

    const item = entry as Record<string, unknown>;
    const witnessAccountId = item.witness_account_id;
    const verdict = item.verdict;
    const note = item.note;
    const observationType = item.observation_type;

    if (typeof witnessAccountId !== "string" || !validWitnessIds.has(witnessAccountId)) continue;
    if (typeof verdict !== "string" || !VALID_VERDICTS.has(verdict)) continue;
    if (!isNonEmptyString(note)) continue;

    witnessBreakdown.push({
      witnessAccountId,
      verdict: verdict as EvidenceVerdict,
      note,
      observationType:
        typeof observationType === "string" && VALID_OBSERVATION_TYPES.has(observationType)
          ? (observationType as WitnessBreakdownItem["observationType"])
          : "direct",
    });
  }

  return {
    whatItShows: (value.what_it_shows as string).trim(),
    supportsSummary: value.supports_summary ? (value.supports_summary as string).trim() : null,
    contradictsSummary: value.contradicts_summary
      ? (value.contradicts_summary as string).trim()
      : null,
    notDocumentedSummary: (value.not_documented_summary as string).trim(),
    conflictsBetweenEvidence: value.conflicts_between_evidence
      ? (value.conflicts_between_evidence as string).trim()
      : null,
    timelineNote: value.timeline_note ? (value.timeline_note as string).trim() : null,
    corroborationNote: value.corroboration_note ? (value.corroboration_note as string).trim() : null,
    status: value.status as Exclude<DocumentationStatus, "not_assessed">,
    confidence: value.confidence as AssessmentConfidence,
    confidenceReasoning: (value.confidence_reasoning as string).trim(),
    evidenceBreakdown,
    witnessBreakdown,
  };
}

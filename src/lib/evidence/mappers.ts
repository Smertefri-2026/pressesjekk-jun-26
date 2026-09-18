import type {
  CaseSummary,
  Claim,
  ClaimAssessment,
  ClaimDocumentationSuggestion,
  ClaimEvidenceLink,
  DocumentFacts,
  DocumentFactConfidence,
  DocumentKind,
  DocumentationSuggestionItem,
  EvidenceBreakdownItem,
  CaseEvent,
  EventClaimLink,
  EventDocumentLink,
  SourceCharacteristic,
  StructuredFactValue,
  Witness,
  WitnessAccount,
  WitnessAccountClaimLink,
  WitnessAccountDocumentLink,
  WitnessBreakdownItem,
} from "./types";

export type ClaimRow = {
  id: string;
  case_id: string;
  user_id: string;
  text: string;
  source_type: Claim["sourceType"];
  no_evidence_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function mapClaimRow(row: ClaimRow): Claim {
  return {
    id: row.id,
    caseId: row.case_id,
    userId: row.user_id,
    text: row.text,
    sourceType: row.source_type,
    noEvidenceConfirmedAt: row.no_evidence_confirmed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export type ClaimEvidenceLinkRow = {
  id: string;
  claim_id: string;
  document_id: string;
  linked_by: string | null;
  created_at: string;
};

export function mapEvidenceLinkRow(row: ClaimEvidenceLinkRow): ClaimEvidenceLink {
  return {
    id: row.id,
    claimId: row.claim_id,
    documentId: row.document_id,
    linkedBy: row.linked_by,
    createdAt: row.created_at,
  };
}

export type ClaimAssessmentRow = {
  id: string;
  claim_id: string;
  what_it_shows: string;
  supports_summary: string | null;
  contradicts_summary: string | null;
  not_documented_summary: string;
  conflicts_between_evidence: string | null;
  status: ClaimAssessment["status"];
  confidence: ClaimAssessment["confidence"];
  confidence_reasoning: string;
  evidence_breakdown: unknown;
  evidence_ids_considered: string[] | null;
  timeline_note?: string | null;
  witness_breakdown?: unknown;
  corroboration_note?: string | null;
  model: string | null;
  created_at: string;
};

function isEvidenceBreakdownArray(value: unknown): value is EvidenceBreakdownItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).documentId === "string"
    )
  );
}

function normalizeWitnessBreakdown(value: unknown): WitnessBreakdownItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const witnessAccountId = record.witness_account_id ?? record.witnessAccountId;
      const verdict = record.verdict;
      const note = record.note;
      const observationType = record.observation_type ?? record.observationType;

      if (typeof witnessAccountId !== "string" || typeof verdict !== "string") return null;

      return {
        witnessAccountId,
        verdict: verdict as WitnessBreakdownItem["verdict"],
        note: typeof note === "string" ? note : "",
        observationType:
          observationType === "secondhand" ? "secondhand" : ("direct" as WitnessBreakdownItem["observationType"]),
      };
    })
    .filter((item): item is WitnessBreakdownItem => item !== null);
}

export function mapAssessmentRow(row: ClaimAssessmentRow): ClaimAssessment {
  const rawBreakdown = row.evidence_breakdown;

  // evidence_breakdown lagres med samme snake_case nøkler som resten av
  // databasen (document_id, ikke documentId) - normaliser ved lesing.
  const breakdown: EvidenceBreakdownItem[] = Array.isArray(rawBreakdown)
    ? rawBreakdown
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const record = item as Record<string, unknown>;
          const documentId = record.document_id ?? record.documentId;
          const verdict = record.verdict;
          const note = record.note;

          if (typeof documentId !== "string" || typeof verdict !== "string") return null;

          return {
            documentId,
            verdict: verdict as EvidenceBreakdownItem["verdict"],
            note: typeof note === "string" ? note : "",
          };
        })
        .filter((item): item is EvidenceBreakdownItem => item !== null)
    : isEvidenceBreakdownArray(rawBreakdown)
      ? rawBreakdown
      : [];

  return {
    id: row.id,
    claimId: row.claim_id,
    whatItShows: row.what_it_shows,
    supportsSummary: row.supports_summary,
    contradictsSummary: row.contradicts_summary,
    notDocumentedSummary: row.not_documented_summary,
    conflictsBetweenEvidence: row.conflicts_between_evidence,
    status: row.status,
    confidence: row.confidence,
    confidenceReasoning: row.confidence_reasoning,
    evidenceBreakdown: breakdown,
    evidenceIdsConsidered: row.evidence_ids_considered ?? [],
    timelineNote: row.timeline_note ?? null,
    witnessBreakdown: normalizeWitnessBreakdown(row.witness_breakdown),
    corroborationNote: row.corroboration_note ?? null,
    model: row.model,
    createdAt: row.created_at,
  };
}

// --- Fase 2B: vitner, dokumentasjonshull, forslag --------------------------

export type WitnessRow = {
  id: string;
  case_id: string;
  user_id: string;
  identity_status: Witness["identityStatus"];
  name: string | null;
  contact_info: string | null;
  relationship_to_case: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function mapWitnessRow(row: WitnessRow): Witness {
  return {
    id: row.id,
    caseId: row.case_id,
    userId: row.user_id,
    identityStatus: row.identity_status,
    name: row.name,
    contactInfo: row.contact_info,
    relationshipToCase: row.relationship_to_case,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export type WitnessAccountRow = {
  id: string;
  witness_id: string;
  case_id: string;
  user_id: string;
  description: string;
  observation_type: WitnessAccount["observationType"];
  event_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function mapWitnessAccountRow(row: WitnessAccountRow): WitnessAccount {
  return {
    id: row.id,
    witnessId: row.witness_id,
    caseId: row.case_id,
    userId: row.user_id,
    description: row.description,
    observationType: row.observation_type,
    eventId: row.event_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export type WitnessAccountClaimLinkRow = {
  id: string;
  witness_account_id: string;
  claim_id: string;
  linked_by: string | null;
  created_at: string;
};

export function mapWitnessAccountClaimLinkRow(row: WitnessAccountClaimLinkRow): WitnessAccountClaimLink {
  return {
    id: row.id,
    witnessAccountId: row.witness_account_id,
    claimId: row.claim_id,
    linkedBy: row.linked_by,
    createdAt: row.created_at,
  };
}

export type WitnessAccountDocumentLinkRow = {
  id: string;
  witness_account_id: string;
  document_id: string;
  linked_by: string | null;
  created_at: string;
};

export function mapWitnessAccountDocumentLinkRow(
  row: WitnessAccountDocumentLinkRow
): WitnessAccountDocumentLink {
  return {
    id: row.id,
    witnessAccountId: row.witness_account_id,
    documentId: row.document_id,
    linkedBy: row.linked_by,
    createdAt: row.created_at,
  };
}

export type ClaimDocumentationSuggestionRow = {
  id: string;
  claim_id: string;
  suggestions: unknown;
  model: string | null;
  created_at: string;
};

function normalizeSuggestions(value: unknown): DocumentationSuggestionItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const label = record.label;
      const description = record.description;
      if (typeof label !== "string" || typeof description !== "string") return null;
      return { label, description };
    })
    .filter((item): item is DocumentationSuggestionItem => item !== null);
}

export function mapSuggestionRow(row: ClaimDocumentationSuggestionRow): ClaimDocumentationSuggestion {
  return {
    id: row.id,
    claimId: row.claim_id,
    suggestions: normalizeSuggestions(row.suggestions),
    model: row.model,
    createdAt: row.created_at,
  };
}

// --- Fase 3: Dokumentasjonssenter, saksbred AI-oppsummering ----------------

export type CaseSummaryRow = {
  id: string;
  case_id: string;
  best_documented_summary: string | null;
  partially_documented_summary: string | null;
  conflicts_summary: string | null;
  key_gaps_summary: string | null;
  strengthen_areas_summary: string | null;
  model: string | null;
  created_at: string;
};

export function mapCaseSummaryRow(row: CaseSummaryRow): CaseSummary {
  return {
    id: row.id,
    caseId: row.case_id,
    bestDocumentedSummary: row.best_documented_summary,
    partiallyDocumentedSummary: row.partially_documented_summary,
    conflictsSummary: row.conflicts_summary,
    keyGapsSummary: row.key_gaps_summary,
    strengthenAreasSummary: row.strengthen_areas_summary,
    model: row.model,
    createdAt: row.created_at,
  };
}

// --- Fase 2A: hendelser, tidslinje, dokumentfakta --------------------------

export type EventRow = {
  id: string;
  case_id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  date_precision: CaseEvent["datePrecision"];
  approximate_label: string | null;
  source_type: CaseEvent["sourceType"];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function mapEventRow(row: EventRow): CaseEvent {
  return {
    id: row.id,
    caseId: row.case_id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    eventDate: row.event_date,
    eventTime: row.event_time,
    datePrecision: row.date_precision,
    approximateLabel: row.approximate_label,
    sourceType: row.source_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export type EventClaimLinkRow = {
  id: string;
  event_id: string;
  claim_id: string;
  linked_by: string | null;
  created_at: string;
};

export function mapEventClaimLinkRow(row: EventClaimLinkRow): EventClaimLink {
  return {
    id: row.id,
    eventId: row.event_id,
    claimId: row.claim_id,
    linkedBy: row.linked_by,
    createdAt: row.created_at,
  };
}

export type EventDocumentLinkRow = {
  id: string;
  event_id: string;
  document_id: string;
  linked_by: string | null;
  created_at: string;
};

export function mapEventDocumentLinkRow(row: EventDocumentLinkRow): EventDocumentLink {
  return {
    id: row.id,
    eventId: row.event_id,
    documentId: row.document_id,
    linkedBy: row.linked_by,
    createdAt: row.created_at,
  };
}

export type DocumentFactsRow = {
  id: string;
  document_id: string;
  case_id: string;
  extraction_status: DocumentFacts["extractionStatus"];
  extraction_error: string | null;
  document_kind: DocumentKind | null;
  summary: string | null;
  occurred_at_date: string | null;
  occurred_at_time: string | null;
  date_confidence: DocumentFactConfidence | null;
  date_note: string | null;
  structured_facts: unknown;
  source_characteristics: unknown;
  source_characteristics_note: string | null;
  likely_event_description: string | null;
  model: string | null;
  extracted_at: string | null;
  created_at: string;
  user_confirmed?: boolean;
  user_corrections?: unknown;
};

function normalizeUserCorrections(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === "string") result[key] = entry;
  }
  return result;
}

function normalizeStructuredFacts(value: unknown): Record<string, StructuredFactValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const result: Record<string, StructuredFactValue> = {};

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const factValue = record.value;
    const confidence = record.confidence;

    if (
      (typeof factValue === "string" || Array.isArray(factValue)) &&
      typeof confidence === "string"
    ) {
      result[key] = {
        value: factValue as string | string[],
        confidence: confidence as DocumentFactConfidence,
      };
    }
  }

  return result;
}

export function mapDocumentFactsRow(row: DocumentFactsRow): DocumentFacts {
  return {
    id: row.id,
    documentId: row.document_id,
    caseId: row.case_id,
    extractionStatus: row.extraction_status,
    extractionError: row.extraction_error,
    documentKind: row.document_kind,
    summary: row.summary,
    occurredAtDate: row.occurred_at_date,
    occurredAtTime: row.occurred_at_time,
    dateConfidence: row.date_confidence,
    dateNote: row.date_note,
    structuredFacts: normalizeStructuredFacts(row.structured_facts),
    sourceCharacteristics: Array.isArray(row.source_characteristics)
      ? (row.source_characteristics as SourceCharacteristic[])
      : [],
    sourceCharacteristicsNote: row.source_characteristics_note,
    likelyEventDescription: row.likely_event_description,
    model: row.model,
    extractedAt: row.extracted_at,
    createdAt: row.created_at,
    userConfirmed: row.user_confirmed ?? false,
    userCorrections: normalizeUserCorrections(row.user_corrections),
  };
}

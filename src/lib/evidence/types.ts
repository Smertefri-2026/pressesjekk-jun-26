// Remøy AI Evidence Engine — delte typer.
//
// Produktnøytralt: ingen PresseSjekk-spesifikk logikk her. Et produkt som
// Skattetap kan bruke disse typene direkte, forutsatt egen case_id-kilde og
// egen dokumenttype-liste for evidence-panelet.

export type ClaimSourceType =
  | "user_statement"
  | "witness_statement"
  | "third_party_statement"
  | "ai_inference";

export type EvidenceVerdict = "supports" | "contradicts" | "silent";

export type DocumentationStatus =
  | "well_documented"
  | "partially_documented"
  | "conflicting"
  | "undocumented"
  | "not_assessed";

export type AssessmentConfidence = "high" | "medium" | "low";

export type EvidenceBreakdownItem = {
  documentId: string;
  verdict: EvidenceVerdict;
  note: string;
};

export type Claim = {
  id: string;
  caseId: string;
  userId: string;
  text: string;
  sourceType: ClaimSourceType;
  noEvidenceConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ClaimEvidenceLink = {
  id: string;
  claimId: string;
  documentId: string;
  linkedBy: string | null;
  createdAt: string;
};

export type WitnessVerdict = "supports" | "contradicts" | "silent";

export type WitnessBreakdownItem = {
  witnessAccountId: string;
  verdict: WitnessVerdict;
  note: string;
  observationType: "direct" | "secondhand";
};

export type ClaimAssessment = {
  id: string;
  claimId: string;
  whatItShows: string;
  supportsSummary: string | null;
  contradictsSummary: string | null;
  notDocumentedSummary: string;
  conflictsBetweenEvidence: string | null;
  status: Exclude<DocumentationStatus, "not_assessed">;
  confidence: AssessmentConfidence;
  confidenceReasoning: string;
  evidenceBreakdown: EvidenceBreakdownItem[];
  evidenceIdsConsidered: string[];
  /** Fase 2A: kort notat om tidsrekkefølge, når relevante hendelser er koblet. */
  timelineNote: string | null;
  /** Fase 2B: vitneopplysninger holdes strukturelt atskilt fra dokumentbevis. */
  witnessBreakdown: WitnessBreakdownItem[];
  /** Fase 2B: notat når uavhengige kildetyper samlet peker samme vei. */
  corroborationNote: string | null;
  model: string | null;
  createdAt: string;
};

/** Minimal shape needed from a linked document to build an AI prompt or a summary. */
export type EvidenceDocumentInput = {
  id: string;
  title: string;
  documentType: string;
  extractedText: string | null;
  extractionStatus: string;
  /** Fase 2A: forhåndsekstraherte dokumentfakta, hvis de finnes. */
  facts?: DocumentFacts | null;
  /**
   * Fase 5: brukerens egen hensikt/hypotese med dette dokumentet ("hva
   * ønsker du at vi særlig skal se etter"). ALDRI et faktum - kun til at KI
   * kan si om dokumentet faktisk innfrir, motsier eller ikke dekker
   * forventningen.
   */
  userIntentNote?: string | null;
};

/** Minimal, allerede formatert hendelseskontekst for en påstandsvurdering. */
export type TimelineContextEvent = {
  title: string;
  dateLabel: string;
  description: string | null;
};

// --- Fase 2A: hendelser, tidslinje, dokumentfakta --------------------------

export type DatePrecision = "exact" | "date_only" | "approximate" | "unknown";
export type EventSourceType = "user" | "ai_suggested";

export type CaseEvent = {
  id: string;
  caseId: string;
  userId: string;
  title: string;
  description: string | null;
  eventDate: string | null;
  eventTime: string | null;
  datePrecision: DatePrecision;
  approximateLabel: string | null;
  sourceType: EventSourceType;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type EventClaimLink = {
  id: string;
  eventId: string;
  claimId: string;
  linkedBy: string | null;
  createdAt: string;
};

export type EventDocumentLink = {
  id: string;
  eventId: string;
  documentId: string;
  linkedBy: string | null;
  createdAt: string;
};

export type DocumentFactConfidence = AssessmentConfidence;

export type StructuredFactValue = {
  value: string | string[];
  confidence: DocumentFactConfidence;
};

export type DocumentKind =
  | "email"
  | "agreement"
  | "article"
  | "message"
  | "call_log"
  | "other"
  | "unknown";

export type SourceCharacteristic =
  | "contemporaneous"
  | "third_party"
  | "public_document"
  | "signed"
  | "user_own_note"
  | "screenshot"
  | "original_file"
  | "copy_or_export"
  | "unknown_origin";

export type DocumentFacts = {
  id: string;
  documentId: string;
  caseId: string;
  extractionStatus: "pending" | "processing" | "completed" | "failed" | "unsupported";
  extractionError: string | null;
  documentKind: DocumentKind | null;
  summary: string | null;
  occurredAtDate: string | null;
  occurredAtTime: string | null;
  dateConfidence: DocumentFactConfidence | null;
  dateNote: string | null;
  structuredFacts: Record<string, StructuredFactValue>;
  sourceCharacteristics: SourceCharacteristic[];
  sourceCharacteristicsNote: string | null;
  likelyEventDescription: string | null;
  model: string | null;
  extractedAt: string | null;
  createdAt: string;
  /** Fase 5: bruker har sett gjennom og bekreftet KI-ekstraksjonen som korrekt. */
  userConfirmed: boolean;
  /**
   * Fase 5: brukerens rettelser til enkeltfelt. Overskriver ALDRI de
   * opprinnelige KI-ekstraherte feltene over - lagres separat slik at
   * både KI sin opprinnelige ekstraksjon og brukerens rettelse alltid kan
   * ses (kilde/historikk bevart).
   */
  userCorrections: Record<string, string>;
};

// --- Fase 2B: vitner, dokumentasjonshull, forslag --------------------------

export type WitnessIdentityStatus = "possible" | "named" | "anonymous";
export type ObservationType = "direct" | "secondhand";

export type Witness = {
  id: string;
  caseId: string;
  userId: string;
  identityStatus: WitnessIdentityStatus;
  name: string | null;
  contactInfo: string | null;
  relationshipToCase: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type WitnessAccount = {
  id: string;
  witnessId: string;
  caseId: string;
  userId: string;
  description: string;
  observationType: ObservationType;
  eventId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type WitnessAccountClaimLink = {
  id: string;
  witnessAccountId: string;
  claimId: string;
  linkedBy: string | null;
  createdAt: string;
};

export type WitnessAccountDocumentLink = {
  id: string;
  witnessAccountId: string;
  documentId: string;
  linkedBy: string | null;
  createdAt: string;
};

/** Minimal shape brukt til å bygge vitne-seksjonen i en vurderingsprompt. */
export type WitnessAccountInput = {
  id: string;
  witnessName: string | null;
  identityStatus: WitnessIdentityStatus;
  observationType: ObservationType;
  description: string;
  hasWrittenStatement: boolean;
};

export type DocumentationGapType =
  | "undocumented_claim"
  | "partially_documented_claim"
  | "conflicting_claim"
  | "unanchored_claim"
  | "undocumented_event"
  | "unconfirmed_witness";

export type DocumentationGap = {
  type: DocumentationGapType;
  entityId: string;
  /** Nøytral, ikke-anklagende beskrivelse - se prinsippet i fase 2B-spesifikasjonen. */
  description: string;
};

export type DocumentationSuggestionItem = {
  label: string;
  description: string;
};

export type ClaimDocumentationSuggestion = {
  id: string;
  claimId: string;
  suggestions: DocumentationSuggestionItem[];
  model: string | null;
  createdAt: string;
};

// --- Fase 3: Dokumentasjonssenter, saksbred AI-oppsummering ----------------

export type CaseSummary = {
  id: string;
  caseId: string;
  bestDocumentedSummary: string | null;
  partiallyDocumentedSummary: string | null;
  conflictsSummary: string | null;
  keyGapsSummary: string | null;
  strengthenAreasSummary: string | null;
  model: string | null;
  createdAt: string;
};

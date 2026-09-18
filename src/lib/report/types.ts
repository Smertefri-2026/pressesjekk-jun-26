// Remøy AI rapportmotor — generiske, produktnøytrale typer.
//
// Ingen PresseSjekk-spesifikk tekst her. Regelverk (VVP/norsk lov for
// PresseSjekk, skattelovgivning for Skattetap osv.) leveres som et
// LegalRule[]-parameter utenfra - kjernen vet ingenting om hvilket produkt
// den brukes i.

import type {
  AssessmentConfidence,
  DatePrecision,
  DocumentationGapType,
  DocumentationStatus,
  EvidenceBreakdownItem,
  ObservationType,
  WitnessIdentityStatus,
} from "@/lib/evidence/types";

/** Stabil dokumentreferanse innenfor ÉN rapportversjon ("Dokument 3" osv). */
export type ReportDocumentRef = {
  documentId: string;
  label: string;
  title: string;
};

export type ReportTimelineEntry = {
  eventId: string;
  dateLabel: string;
  datePrecision: DatePrecision;
  title: string;
  description: string | null;
  documentRefs: ReportDocumentRef[];
  witnessLabels: string[];
  hasDateConflict: boolean;
  conflictNote: string | null;
};

export type ReportClaimFinding = {
  claimId: string;
  claimText: string;
  status: Exclude<DocumentationStatus, "not_assessed">;
  whatItShows: string | null;
  supportsSummary: string | null;
  contradictsSummary: string | null;
  notDocumentedSummary: string | null;
  conflictsBetweenEvidence: string | null;
  confidence: AssessmentConfidence | null;
  confidenceReasoning: string | null;
  documentRefs: ReportDocumentRef[];
  timelineNote: string | null;
  corroborationNote: string | null;
};

export type ReportWitnessAccountEntry = {
  description: string;
  observationType: ObservationType;
  hasWrittenStatement: boolean;
  linkedClaimTexts: string[];
};

export type ReportWitnessEntry = {
  witnessId: string;
  name: string | null;
  identityStatus: WitnessIdentityStatus;
  relationshipToCase: string | null;
  accounts: ReportWitnessAccountEntry[];
};

export type ReportGapEntry = {
  type: DocumentationGapType;
  description: string;
};

export type ReportLegalAssessmentItem = {
  ruleId: string;
  ruleTitle: string;
  commentary: string;
  documentRefs: ReportDocumentRef[];
};

/**
 * Diskriminert union - hver variant bærer kun det den trenger. UI/PDF kan
 * iterere generisk over `kind` uten å vite noe om regelverk eller produkt.
 * Seksjoner bygget av kode (ikke KI) bærer alltid de fulle, strukturerte
 * dataene - KI brukes kun til `summary`, `background`, `legal_assessment`
 * (kommentarteksten) og `conclusion`.
 */
export type ReportSection =
  | { kind: "summary"; heading: string; text: string }
  | { kind: "background"; heading: string; text: string }
  | { kind: "timeline"; heading: string; entries: ReportTimelineEntry[] }
  | { kind: "key_user_statements"; heading: string; statements: { claimId: string; text: string }[] }
  | { kind: "documented_findings"; heading: string; findings: ReportClaimFinding[] }
  | { kind: "partially_documented"; heading: string; findings: ReportClaimFinding[] }
  | { kind: "conflicts"; heading: string; findings: ReportClaimFinding[] }
  | { kind: "witnesses"; heading: string; witnesses: ReportWitnessEntry[] }
  | { kind: "documentation_gaps"; heading: string; gaps: ReportGapEntry[]; confirmedNoEvidenceCount: number }
  | { kind: "legal_assessment"; heading: string; items: ReportLegalAssessmentItem[] }
  | {
      kind: "ai_assessment";
      heading: string;
      bestDocumented: string | null;
      partiallyDocumented: string | null;
      conflicts: string | null;
      keyGaps: string | null;
      strengthenAreas: string | null;
    }
  | { kind: "conclusion"; heading: string; text: string };

export type ReportSectionKind = ReportSection["kind"];

/** Et regelverkspunkt levert av produktets regelverksmodul (ikke kjernen). */
export type LegalRule = {
  id: string;
  title: string;
  summary: string;
  relevance: string;
};

/**
 * Liten snapshot av Evidence Engine-tilstanden rapporten ble bygget fra -
 * IKKE en full datadump. Nok til at en eldre rapportversjon senere kan
 * forklares uten å måtte rekonstruere alt fra bunnen (append-only versjonering,
 * jf. fase 4-kravet).
 */
export type ReportBuiltFrom = {
  generatedAt: string;
  claimCount: number;
  documentedCount: number;
  partiallyDocumentedCount: number;
  conflictingCount: number;
  undocumentedCount: number;
  witnessCount: number;
  gapCount: number;
  caseSummaryId: string | null;
  documentRefs: ReportDocumentRef[];
};

/** Rådata evidence_breakdown-elementer trenger for dokumentreferanser. */
export type ReportEvidenceBreakdownItem = EvidenceBreakdownItem;

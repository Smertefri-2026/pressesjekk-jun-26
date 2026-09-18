import { compareEventsChronologically, detectDateConflict, formatEventDate } from "@/lib/evidence/dateFacts";
import type {
  AssessmentConfidence,
  DatePrecision,
  DocumentationGap,
  DocumentationStatus,
  EvidenceBreakdownItem,
  ObservationType,
  WitnessIdentityStatus,
} from "@/lib/evidence/types";
import type {
  ReportBuiltFrom,
  ReportClaimFinding,
  ReportDocumentRef,
  ReportGapEntry,
  ReportSection,
  ReportTimelineEntry,
  ReportWitnessEntry,
} from "./types";

export type ReportClaimInput = {
  id: string;
  text: string;
  noEvidenceConfirmedAt: string | null;
  evidenceDocumentIds: string[];
  latestAssessment: {
    status: Exclude<DocumentationStatus, "not_assessed">;
    whatItShows: string;
    supportsSummary: string | null;
    contradictsSummary: string | null;
    notDocumentedSummary: string;
    conflictsBetweenEvidence: string | null;
    confidence: AssessmentConfidence;
    confidenceReasoning: string;
    evidenceBreakdown: EvidenceBreakdownItem[];
    timelineNote: string | null;
    corroborationNote: string | null;
  } | null;
};

export type ReportEventInput = {
  id: string;
  title: string;
  description: string | null;
  eventDate: string | null;
  eventTime: string | null;
  datePrecision: DatePrecision;
  approximateLabel: string | null;
  documentIds: string[];
};

export type ReportDocumentInput = {
  id: string;
  title: string;
  occurredAtDate: string | null;
};

export type ReportWitnessAccountInput = {
  description: string;
  observationType: ObservationType;
  hasWrittenStatement: boolean;
  eventId: string | null;
  linkedClaimIds: string[];
};

export type ReportWitnessInput = {
  id: string;
  name: string | null;
  identityStatus: WitnessIdentityStatus;
  relationshipToCase: string | null;
  accounts: ReportWitnessAccountInput[];
};

export type BuildReportSectionsInput = {
  claims: ReportClaimInput[];
  events: ReportEventInput[];
  documents: ReportDocumentInput[];
  witnesses: ReportWitnessInput[];
  gaps: DocumentationGap[];
  caseSummaryId: string | null;
};

export type BuildReportSectionsResult = {
  sections: ReportSection[];
  documentRefs: ReportDocumentRef[];
  builtFrom: ReportBuiltFrom;
};

function deriveStatus(claim: ReportClaimInput): DocumentationStatus {
  if (claim.evidenceDocumentIds.length === 0) return "undocumented";
  return claim.latestAssessment?.status ?? "not_assessed";
}

function toClaimFinding(claim: ReportClaimInput, docRefsByDocumentId: Map<string, ReportDocumentRef>): ReportClaimFinding {
  const assessment = claim.latestAssessment;

  const documentRefs = claim.evidenceDocumentIds
    .map((id) => docRefsByDocumentId.get(id))
    .filter((ref): ref is ReportDocumentRef => Boolean(ref));

  return {
    claimId: claim.id,
    claimText: claim.text,
    status: deriveStatus(claim) as Exclude<DocumentationStatus, "not_assessed">,
    whatItShows: assessment?.whatItShows ?? null,
    supportsSummary: assessment?.supportsSummary ?? null,
    contradictsSummary: assessment?.contradictsSummary ?? null,
    notDocumentedSummary: assessment?.notDocumentedSummary ?? null,
    conflictsBetweenEvidence: assessment?.conflictsBetweenEvidence ?? null,
    confidence: assessment?.confidence ?? null,
    confidenceReasoning: assessment?.confidenceReasoning ?? null,
    documentRefs,
    timelineNote: assessment?.timelineNote ?? null,
    corroborationNote: assessment?.corroborationNote ?? null,
  };
}

/**
 * Bygger de deterministiske rapportseksjonene direkte fra strukturerte
 * Evidence Engine-data - ingen KI-kall her. KI brukes kun til de fire
 * seksjonene (summary, background, legal_assessment, conclusion) som
 * bygges separat i buildReportAiPrompt/reportValidation og spleises inn av
 * kalleren.
 *
 * Dokumentreferanser ("Dokument 3") tildeles ÉN gang her, i rekkefølgen
 * `documents` gis inn (forventet sortert etter opplastingsrekkefølge av
 * kalleren) - denne tildelingen er stabil for HELE denne rapportversjonen,
 * jf. kravet om én konsekvent referansemodell gjennom rapporten.
 */
export function buildReportSections(input: BuildReportSectionsInput): BuildReportSectionsResult {
  const documentRefs: ReportDocumentRef[] = input.documents.map((doc, index) => ({
    documentId: doc.id,
    label: `Dokument ${index + 1}`,
    title: doc.title,
  }));
  const docRefsByDocumentId = new Map(documentRefs.map((ref) => [ref.documentId, ref]));
  const documentsById = new Map(input.documents.map((doc) => [doc.id, doc]));
  const claimTextById = new Map(input.claims.map((claim) => [claim.id, claim.text]));

  const sections: ReportSection[] = [];

  // --- Tidslinje ---
  if (input.events.length > 0) {
    const witnessLabelsByEventId = new Map<string, string[]>();
    for (const witness of input.witnesses) {
      for (const account of witness.accounts) {
        if (!account.eventId) continue;
        const list = witnessLabelsByEventId.get(account.eventId) ?? [];
        list.push(witness.name ?? "Vitne");
        witnessLabelsByEventId.set(account.eventId, list);
      }
    }

    const sortedEvents = [...input.events].sort((a, b) =>
      compareEventsChronologically(
        { eventDate: a.eventDate, eventTime: a.eventTime, datePrecision: a.datePrecision, approximateLabel: a.approximateLabel, createdAt: a.id },
        { eventDate: b.eventDate, eventTime: b.eventTime, datePrecision: b.datePrecision, approximateLabel: b.approximateLabel, createdAt: b.id }
      )
    );

    const entries: ReportTimelineEntry[] = sortedEvents.map((event) => {
      const conflict = detectDateConflict([
        { label: "Hendelsen", date: event.eventDate },
        ...event.documentIds.map((id) => ({
          label: documentsById.get(id)?.title ?? "Dokument",
          date: documentsById.get(id)?.occurredAtDate ?? null,
        })),
      ]);

      return {
        eventId: event.id,
        dateLabel: formatEventDate({
          eventDate: event.eventDate,
          eventTime: event.eventTime,
          datePrecision: event.datePrecision,
          approximateLabel: event.approximateLabel,
        }),
        datePrecision: event.datePrecision,
        title: event.title,
        description: event.description,
        documentRefs: event.documentIds.map((id) => docRefsByDocumentId.get(id)).filter((ref): ref is ReportDocumentRef => Boolean(ref)),
        witnessLabels: witnessLabelsByEventId.get(event.id) ?? [],
        hasDateConflict: conflict.hasConflict,
        conflictNote: conflict.hasConflict
          ? `Hendelsen og/eller koblede dokumenter oppgir ulike datoer (${conflict.distinctDates.join(", ")}).`
          : null,
      };
    });

    sections.push({ kind: "timeline", heading: "Tidslinje", entries });
  }

  // --- Brukerens sentrale opplysninger ---
  if (input.claims.length > 0) {
    sections.push({
      kind: "key_user_statements",
      heading: "Brukerens sentrale opplysninger",
      statements: input.claims.map((claim) => ({ claimId: claim.id, text: claim.text })),
    });
  }

  // --- Dokumenterte / delvis dokumenterte / motstridende forhold ---
  const documented = input.claims.filter((c) => deriveStatus(c) === "well_documented");
  const partiallyDocumented = input.claims.filter((c) => deriveStatus(c) === "partially_documented");
  const conflicting = input.claims.filter((c) => deriveStatus(c) === "conflicting");

  if (documented.length > 0) {
    sections.push({
      kind: "documented_findings",
      heading: "Dokumenterte forhold",
      findings: documented.map((c) => toClaimFinding(c, docRefsByDocumentId)),
    });
  }

  if (partiallyDocumented.length > 0) {
    sections.push({
      kind: "partially_documented",
      heading: "Delvis dokumenterte forhold",
      findings: partiallyDocumented.map((c) => toClaimFinding(c, docRefsByDocumentId)),
    });
  }

  if (conflicting.length > 0) {
    sections.push({
      kind: "conflicts",
      heading: "Motstridende opplysninger",
      findings: conflicting.map((c) => toClaimFinding(c, docRefsByDocumentId)),
    });
  }

  // --- Vitneopplysninger ---
  if (input.witnesses.length > 0) {
    const witnesses: ReportWitnessEntry[] = input.witnesses.map((witness) => ({
      witnessId: witness.id,
      name: witness.name,
      identityStatus: witness.identityStatus,
      relationshipToCase: witness.relationshipToCase,
      accounts: witness.accounts.map((account) => ({
        description: account.description,
        observationType: account.observationType,
        hasWrittenStatement: account.hasWrittenStatement,
        linkedClaimTexts: account.linkedClaimIds
          .map((id) => claimTextById.get(id))
          .filter((text): text is string => Boolean(text)),
      })),
    }));

    sections.push({ kind: "witnesses", heading: "Vitneopplysninger", witnesses });
  }

  // --- Dokumentasjonshull ---
  const confirmedNoEvidenceCount = input.claims.filter((c) => c.noEvidenceConfirmedAt).length;

  if (input.gaps.length > 0 || confirmedNoEvidenceCount > 0) {
    const gaps: ReportGapEntry[] = input.gaps.map((gap) => ({ type: gap.type, description: gap.description }));
    sections.push({ kind: "documentation_gaps", heading: "Dokumentasjonshull", gaps, confirmedNoEvidenceCount });
  }

  const builtFrom: ReportBuiltFrom = {
    generatedAt: new Date().toISOString(),
    claimCount: input.claims.length,
    documentedCount: documented.length,
    partiallyDocumentedCount: partiallyDocumented.length,
    conflictingCount: conflicting.length,
    undocumentedCount: input.claims.filter((c) => deriveStatus(c) === "undocumented").length,
    witnessCount: input.witnesses.length,
    gapCount: input.gaps.length,
    caseSummaryId: input.caseSummaryId,
    documentRefs,
  };

  return { sections, documentRefs, builtFrom };
}

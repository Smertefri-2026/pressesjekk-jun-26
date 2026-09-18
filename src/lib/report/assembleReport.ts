import type { ValidatedReportAiPayload } from "./reportValidation";
import type { LegalRule, ReportDocumentRef, ReportSection } from "./types";

export type CaseSummaryForReport = {
  bestDocumentedSummary: string | null;
  partiallyDocumentedSummary: string | null;
  conflictsSummary: string | null;
  keyGapsSummary: string | null;
  strengthenAreasSummary: string | null;
} | null;

/**
 * Setter sammen de fire KI-forfattede seksjonene og de allerede bygde
 * deterministiske seksjonene i den rekkefølgen fase 4-spesifikasjonen ber
 * om (sammendrag, bakgrunn, tidslinje, ..., regelverk, KI-vurdering,
 * konklusjon). Tomme seksjoner utelates konsekvent på dette nivået også -
 * ikke bare i buildReportSections.
 */
export function assembleReportSections({
  deterministicSections,
  ai,
  legalRules,
  documentRefs,
  caseSummary,
}: {
  deterministicSections: ReportSection[];
  ai: ValidatedReportAiPayload;
  legalRules: LegalRule[];
  documentRefs: ReportDocumentRef[];
  caseSummary: CaseSummaryForReport;
}): ReportSection[] {
  const ruleById = new Map(legalRules.map((rule) => [rule.id, rule]));
  const documentRefById = new Map(documentRefs.map((ref) => [ref.documentId, ref]));

  const sections: ReportSection[] = [];

  sections.push({ kind: "summary", heading: "Sammendrag", text: ai.summary });

  if (ai.background.trim().length > 0) {
    sections.push({ kind: "background", heading: "Sakens bakgrunn", text: ai.background });
  }

  sections.push(...deterministicSections);

  if (ai.legalAssessment.length > 0) {
    sections.push({
      kind: "legal_assessment",
      heading: "Regelverksvurdering",
      items: ai.legalAssessment.map((item) => ({
        ruleId: item.ruleId,
        ruleTitle: ruleById.get(item.ruleId)?.title ?? item.ruleId,
        commentary: item.commentary,
        documentRefs: item.documentIds.map((id) => documentRefById.get(id)).filter((ref): ref is ReportDocumentRef => Boolean(ref)),
      })),
    });
  }

  if (
    caseSummary &&
    (caseSummary.bestDocumentedSummary ||
      caseSummary.partiallyDocumentedSummary ||
      caseSummary.conflictsSummary ||
      caseSummary.keyGapsSummary ||
      caseSummary.strengthenAreasSummary)
  ) {
    sections.push({
      kind: "ai_assessment",
      heading: "KI-vurdering",
      bestDocumented: caseSummary.bestDocumentedSummary,
      partiallyDocumented: caseSummary.partiallyDocumentedSummary,
      conflicts: caseSummary.conflictsSummary,
      keyGaps: caseSummary.keyGapsSummary,
      strengthenAreas: caseSummary.strengthenAreasSummary,
    });
  }

  sections.push({ kind: "conclusion", heading: "Konklusjon og videre punkter", text: ai.conclusion });

  return sections;
}

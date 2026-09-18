import { deriveDisplayStatus } from "./statusLogic";
import type { DocumentationStatus } from "./types";

export type OverviewClaimInput = {
  evidenceCount: number;
  latestAssessmentStatus: Exclude<DocumentationStatus, "not_assessed"> | null;
};

export type DocumentationCenterOverviewInput = {
  documentCount: number;
  claims: OverviewClaimInput[];
  witnessCount: number;
  gapCount: number;
};

export type DocumentationCenterOverview = {
  documentCount: number;
  claimCount: number;
  claimStatusCounts: Record<DocumentationStatus, number>;
  witnessCount: number;
  gapCount: number;
};

const EMPTY_STATUS_COUNTS: Record<DocumentationStatus, number> = {
  well_documented: 0,
  partially_documented: 0,
  conflicting: 0,
  undocumented: 0,
  not_assessed: 0,
};

/**
 * Ren aggregering for oversikten øverst i Dokumentasjonssenteret. Gjenbruker
 * deriveDisplayStatus (samme statuslogikk som resten av motoren, aldri
 * duplisert) slik at tallene her aldri kan avvike fra statusen som vises på
 * den enkelte påstanden andre steder i UI.
 *
 * Bevisst INGEN samlet prosent/score - kun konkrete, forklarbare antall per
 * kategori, i tråd med "ikke lag falsk score"-prinsippet.
 */
export function computeDocumentationCenterOverview(
  input: DocumentationCenterOverviewInput
): DocumentationCenterOverview {
  const claimStatusCounts: Record<DocumentationStatus, number> = { ...EMPTY_STATUS_COUNTS };

  for (const claim of input.claims) {
    const status = deriveDisplayStatus(claim.evidenceCount, claim.latestAssessmentStatus);
    claimStatusCounts[status] += 1;
  }

  return {
    documentCount: input.documentCount,
    claimCount: input.claims.length,
    claimStatusCounts,
    witnessCount: input.witnessCount,
    gapCount: input.gapCount,
  };
}

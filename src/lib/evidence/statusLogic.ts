import type {
  AssessmentConfidence,
  DocumentationStatus,
  EvidenceBreakdownItem,
} from "./types";

/**
 * Rene, deterministiske regler som ikke krever KI. Brukes til å unngå
 * unødvendige AI-kall (ingen dokumentasjon koblet -> vi vet svaret uten å
 * spørre modellen) og til å validere/forklare KI sitt statusvalg i UI.
 */
export function deriveDeterministicStatus(
  linkedDocumentCount: number
): DocumentationStatus | null {
  if (linkedDocumentCount <= 0) return "undocumented";
  return null; // krever faktisk vurdering av innholdet
}

/**
 * Statusen som faktisk vises i UI for en påstand: deterministisk regel
 * først (ingen dokumentasjon -> udokumentert, uten unntak), ellers siste
 * KI-vurdering, ellers "ikke vurdert" (dokumentasjon finnes, men ingen
 * vurdering er kjørt ennå). Delt mellom ClaimCard og
 * dokumentasjonssammendraget slik at de aldri kan vise ulik status for
 * samme påstand.
 */
export function deriveDisplayStatus(
  linkedDocumentCount: number,
  latestAssessmentStatus: Exclude<DocumentationStatus, "not_assessed"> | null
): DocumentationStatus {
  const deterministic = deriveDeterministicStatus(linkedDocumentCount);
  if (deterministic) return deterministic;
  return latestAssessmentStatus ?? "not_assessed";
}

export type EvidenceBreakdownSummary = {
  supportsCount: number;
  contradictsCount: number;
  silentCount: number;
  hasConflict: boolean;
};

/**
 * Oppsummerer per-dokument-utfallet fra en KI-vurdering til enkle tall UI
 * og statuslogikk kan bruke uten å måtte tolke fritekst.
 */
export function summarizeEvidenceBreakdown(
  breakdown: EvidenceBreakdownItem[]
): EvidenceBreakdownSummary {
  const supportsCount = breakdown.filter((item) => item.verdict === "supports").length;
  const contradictsCount = breakdown.filter((item) => item.verdict === "contradicts").length;
  const silentCount = breakdown.filter((item) => item.verdict === "silent").length;

  return {
    supportsCount,
    contradictsCount,
    silentCount,
    // Motstridende hvis noe faktisk motsier påstanden, ELLER hvis bevisene
    // peker ulik vei seg imellom (fanges opp separat av
    // conflicts_between_evidence i selve vurderingen - dette er kun et
    // konsistenssjekk-signal for UI, ikke fasiten).
    hasConflict: contradictsCount > 0,
  };
}

/**
 * Konsistenssjekk: gir en advarsel hvis KI sitt valgte status-felt
 * åpenbart ikke stemmer med dens egen per-dokument-oppsummering (f.eks.
 * status="well_documented" men ingen dokumenter faktisk støtter påstanden).
 * Brukes til å fange opp dårlige KI-svar før de lagres, ikke til å overstyre
 * gyldige vurderinger.
 */
export function findStatusInconsistency(
  status: DocumentationStatus,
  breakdown: EvidenceBreakdownItem[]
): string | null {
  const summary = summarizeEvidenceBreakdown(breakdown);

  if (status === "undocumented" && (summary.supportsCount > 0 || summary.contradictsCount > 0)) {
    return "Status er 'undocumented', men vurderingen inneholder dokumenter som faktisk sier noe om påstanden.";
  }

  if (status === "well_documented" && summary.supportsCount === 0) {
    return "Status er 'well_documented', men ingen koblede dokumenter er vurdert som støttende.";
  }

  if (status === "well_documented" && summary.contradictsCount > 0) {
    return "Status er 'well_documented', men minst ett dokument motsier påstanden - bør normalt være 'conflicting'.";
  }

  if (status === "conflicting" && summary.contradictsCount === 0) {
    return "Status er 'conflicting', men ingen dokumenter er vurdert som motstridende.";
  }

  return null;
}

const STATUS_LABELS: Record<DocumentationStatus, string> = {
  well_documented: "Godt dokumentert",
  partially_documented: "Delvis dokumentert",
  conflicting: "Motstridende dokumentasjon",
  undocumented: "Ikke dokumentert",
  not_assessed: "Ikke vurdert",
};

export function statusLabel(status: DocumentationStatus): string {
  return STATUS_LABELS[status];
}

const CONFIDENCE_LABELS: Record<AssessmentConfidence, string> = {
  high: "Høy",
  medium: "Middels",
  low: "Lav",
};

export function confidenceLabel(confidence: AssessmentConfidence): string {
  return CONFIDENCE_LABELS[confidence];
}

import type { DocumentationGap, DocumentationStatus } from "./types";

export type GapClaimInput = {
  id: string;
  text: string;
  noEvidenceConfirmedAt: string | null;
  evidenceCount: number;
  eventCount: number;
  latestAssessmentStatus: Exclude<DocumentationStatus, "not_assessed"> | null;
};

export type GapEventInput = {
  id: string;
  title: string;
  documentCount: number;
};

export type GapWitnessAccountInput = {
  id: string;
  witnessName: string | null;
  documentCount: number;
};

export type GapAnalysisInput = {
  claims: GapClaimInput[];
  events: GapEventInput[];
  witnessAccounts: GapWitnessAccountInput[];
};

function truncate(text: string, max = 80): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

/**
 * Beregner dokumentasjonshull direkte fra sakens nåværende tilstand -
 * det finnes bevisst ingen egen "gaps"-tabell å synkronisere. Et hull
 * forsvinner automatisk i det underliggende forholdet endrer seg (f.eks.
 * et dokument kobles til), uten noen egen oppryddingslogikk.
 *
 * Et hull betyr aldri at brukerens opplysning er feil - kun at den
 * foreløpig ikke er tilstrekkelig dokumentert. Språket her er derfor
 * gjennomgående nøytralt, aldri anklagende.
 */
export function identifyDocumentationGaps(input: GapAnalysisInput): DocumentationGap[] {
  const gaps: DocumentationGap[] = [];

  for (const claim of input.claims) {
    // Bevisst utelatt hvis brukeren allerede har bekreftet at det ikke
    // finnes mer dokumentasjon - da er spørsmålet stilt og besvart, og
    // skal ikke fortsette å dukke opp som et "hull" å adressere.
    if (claim.evidenceCount === 0 && !claim.noEvidenceConfirmedAt) {
      gaps.push({
        type: "undocumented_claim",
        entityId: claim.id,
        description: `«${truncate(claim.text)}» er foreløpig ikke støttet av dokumentasjon.`,
      });
    }

    if (claim.latestAssessmentStatus === "partially_documented") {
      gaps.push({
        type: "partially_documented_claim",
        entityId: claim.id,
        description: `Dokumentasjonen dekker foreløpig bare deler av «${truncate(claim.text)}».`,
      });
    }

    if (claim.latestAssessmentStatus === "conflicting") {
      gaps.push({
        type: "conflicting_claim",
        entityId: claim.id,
        description: `Dokumentasjonen knyttet til «${truncate(claim.text)}» er motstridende.`,
      });
    }

    if (claim.eventCount === 0) {
      gaps.push({
        type: "unanchored_claim",
        entityId: claim.id,
        description: `«${truncate(claim.text)}» er ikke koblet til noe punkt på tidslinjen ennå.`,
      });
    }
  }

  for (const event of input.events) {
    if (event.documentCount === 0) {
      gaps.push({
        type: "undocumented_event",
        entityId: event.id,
        description: `Hendelsen «${truncate(event.title)}» har ingen koblet dokumentasjon ennå.`,
      });
    }
  }

  for (const account of input.witnessAccounts) {
    if (account.documentCount === 0) {
      gaps.push({
        type: "unconfirmed_witness",
        entityId: account.id,
        description: `${
          account.witnessName ?? "Vitnet"
        } er oppgitt som mulig kilde, men det finnes ingen skriftlig erklæring ennå.`,
      });
    }
  }

  return gaps;
}

/** Grov prioritering til kompakt UI - motstridende og udokumentert vises først. */
const GAP_PRIORITY: Record<DocumentationGap["type"], number> = {
  conflicting_claim: 0,
  undocumented_claim: 1,
  unconfirmed_witness: 2,
  partially_documented_claim: 3,
  undocumented_event: 4,
  unanchored_claim: 5,
};

export function sortGapsByPriority(gaps: DocumentationGap[]): DocumentationGap[] {
  return [...gaps].sort((a, b) => GAP_PRIORITY[a.type] - GAP_PRIORITY[b.type]);
}

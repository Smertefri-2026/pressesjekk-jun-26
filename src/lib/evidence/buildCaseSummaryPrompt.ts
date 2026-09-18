import type { DocumentationGapType, DocumentationStatus } from "./types";

const RESPONSE_SCHEMA = `Svar KUN med et JSON-objekt på nøyaktig denne formen (ingen tekst utenfor JSON):
{
  "best_documented_summary": "Kort, konkret oppsummering av hva som er best dokumentert i saken - nevn hvilke forhold, ikke bare at 'mye er dokumentert'. Null hvis ingenting er godt dokumentert ennå.",
  "partially_documented_summary": "Hvilke forhold er delvis dokumentert, og hva mangler for at de skal bli fullt dokumentert. Null hvis ingen forhold er delvis dokumentert.",
  "conflicts_summary": "Hvilke motstridende opplysninger finnes i saken, uten å avgjøre hvem som har rett. Null hvis ingen konflikter finnes.",
  "key_gaps_summary": "De mest sentrale dokumentasjonshullene i saken samlet sett - prioriter de viktigste, ikke en fullstendig liste. Null hvis ingen hull finnes.",
  "strengthen_areas_summary": "Konkrete områder brukeren kan styrke saken på, basert på hullene og de delvis dokumenterte forholdene. Null hvis det ikke er noe åpenbart å styrke."
}`;

const STATUS_LABELS: Record<DocumentationStatus, string> = {
  well_documented: "Godt dokumentert",
  partially_documented: "Delvis dokumentert",
  conflicting: "Motstridende dokumentasjon",
  undocumented: "Ikke dokumentert",
  not_assessed: "Ikke vurdert ennå",
};

const GAP_TYPE_LABELS: Record<DocumentationGapType, string> = {
  undocumented_claim: "Udokumentert påstand",
  partially_documented_claim: "Delvis dokumentert påstand",
  conflicting_claim: "Motstridende dokumentasjon",
  unanchored_claim: "Ikke knyttet til tidslinjen",
  undocumented_event: "Hendelse uten dokumentasjon",
  unconfirmed_witness: "Vitne uten skriftlig erklæring",
};

export type CaseSummaryClaimInput = {
  text: string;
  status: DocumentationStatus;
  whatItShows: string | null;
  supportsSummary: string | null;
  contradictsSummary: string | null;
  corroborationNote: string | null;
};

export type CaseSummaryGapInput = {
  type: DocumentationGapType;
  description: string;
};

function truncate(text: string, max = 200): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function formatClaim(claim: CaseSummaryClaimInput, index: number): string {
  const lines = [`Påstand ${index + 1}: «${truncate(claim.text)}»`, `Status: ${STATUS_LABELS[claim.status]}`];

  if (claim.whatItShows) lines.push(`Hva dokumentasjonen viser: ${truncate(claim.whatItShows)}`);
  if (claim.supportsSummary) lines.push(`Støtter: ${truncate(claim.supportsSummary)}`);
  if (claim.contradictsSummary) lines.push(`Motsier: ${truncate(claim.contradictsSummary)}`);
  if (claim.corroborationNote) lines.push(`Samlet støtte: ${truncate(claim.corroborationNote)}`);

  return lines.join("\n");
}

/**
 * Bygger prompten for den saksbrede AI-oppsummeringen. Bevisst bygget fra
 * ALLEREDE STRUKTURERTE data - påstandstekst, status og de allerede
 * KI-genererte assessment-sammendragene, samt beregnede dokumentasjonshull
 * - aldri fra rå, uthentet dokumenttekst direkte. Dette holder
 * oppsummeringen ett resonneringssteg unna det ubetrodde dokumentinnholdet,
 * og sikrer at den bygger på det samme grunnlaget brukeren allerede har
 * sett per påstand, ikke en ny, uavhengig lesning av kildene.
 *
 * Produktnøytralt: ingen pressebegreper her.
 */
export function buildCaseSummaryPrompt({
  claims,
  gaps,
}: {
  claims: CaseSummaryClaimInput[];
  gaps: CaseSummaryGapInput[];
}): string {
  const claimsBlock =
    claims.length === 0
      ? "Ingen påstander er registrert i saken ennå."
      : claims.map((claim, index) => formatClaim(claim, index)).join("\n\n");

  const gapsBlock =
    gaps.length === 0
      ? "Ingen dokumentasjonshull er identifisert i saken."
      : gaps.map((gap) => `- (${GAP_TYPE_LABELS[gap.type]}) ${gap.description}`).join("\n");

  return [
    "PÅSTANDER I SAKEN (strukturert grunnlag, allerede KI-vurdert per påstand)",
    claimsBlock,
    "",
    "DOKUMENTASJONSHULL I SAKEN (beregnet fra nåværende koblinger)",
    gapsBlock,
    "",
    RESPONSE_SCHEMA,
  ].join("\n");
}

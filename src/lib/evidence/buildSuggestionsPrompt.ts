const RESPONSE_SCHEMA = `Svar KUN med et JSON-objekt på nøyaktig denne formen (ingen tekst utenfor JSON):
{
  "suggestions": [
    { "label": "Kort, konkret tittel (2-4 ord)", "description": "Én setning om hvorfor akkurat dette kunne vært relevant for DENNE påstanden." }
  ]
}`;

/**
 * Bygger prompten for kontekstuelle dokumentasjonsforslag. Ingen
 * produktspesifikke begreper her - bare påstandsteksten og hva som
 * allerede er koblet, slik at motoren forblir generisk på tvers av
 * Remøy AI-produktene (se DOCUMENTATION_SUGGESTIONS_INSTRUCTIONS for
 * grunnreglene selve KI-kallet følger).
 */
export function buildSuggestionsPrompt({
  claimText,
  alreadyLinkedSummary,
}: {
  claimText: string;
  alreadyLinkedSummary?: string;
}): string {
  return [
    "PÅSTAND SOM TRENGER STERKERE DOKUMENTASJON",
    claimText.trim(),
    "",
    alreadyLinkedSummary
      ? `ALLEREDE KOBLET (ikke foreslå dette på nytt):\n${alreadyLinkedSummary}`
      : "Ingenting er koblet til denne påstanden ennå.",
    "",
    RESPONSE_SCHEMA,
  ].join("\n");
}

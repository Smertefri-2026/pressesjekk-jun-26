import { wrapUntrustedContent } from "@/lib/ai/openai";
import type { EvidenceDocumentInput, TimelineContextEvent, WitnessAccountInput } from "./types";

const RESPONSE_SCHEMA = `Svar KUN med et JSON-objekt på nøyaktig denne formen (ingen tekst utenfor JSON):
{
  "what_it_shows": "Nøytral, konkret beskrivelse av hva dokumentasjonen som helhet faktisk viser - fakta, ikke tolkning av brukerens påstand.",
  "supports_summary": "Kort forklaring av hva som støtter påstanden, eller null hvis ingenting støtter den.",
  "contradicts_summary": "Kort forklaring av hva som motsier påstanden, eller null hvis ingenting motsier den.",
  "not_documented_summary": "Hva ved påstanden som IKKE er dekket av dokumentasjonen, selv om noe annet er det. Skriv alltid noe her - det finnes nesten alltid en del av en påstand som ikke er fullt dokumentert.",
  "conflicts_between_evidence": "Hvis to eller flere KILDER (dokumenter, vitner, eller tidslinjen) motsier HVERANDRE, forklar det her. Ellers null.",
  "timeline_note": "Kun hvis hendelser er listet under: kort, forsiktig notat om hva tidsrekkefølgen betyr for påstanden (bruk 'forenlig med', 'i strid med' - aldri 'beviser'). Ellers null.",
  "corroboration_note": "Kun hvis minst to UAVHENGIGE kildetyper (dokument, vitne, tidslinje) samlet støtter det samme forholdet: kort, forsiktig notat om dette ('flere uavhengige opplysninger støtter ...'). Ellers null.",
  "status": "well_documented | partially_documented | conflicting | undocumented",
  "confidence": "high | medium | low",
  "confidence_reasoning": "Én til to setninger som begrunner sikkerhetsnivået.",
  "evidence_breakdown": [
    { "document_id": "<nøyaktig ID fra dokumentlisten under>", "verdict": "supports | contradicts | silent", "note": "Kort, konkret begrunnelse for dette enkeltdokumentet." }
  ],
  "witness_breakdown": [
    { "witness_account_id": "<nøyaktig ID fra vitnelisten under>", "verdict": "supports | contradicts | silent", "note": "Kort, konkret begrunnelse - nevn eksplisitt om dette er direkte observasjon eller annenhåndsinformasjon." }
  ]
}`;

function formatDocumentFacts(document: EvidenceDocumentInput): string {
  const facts = document.facts;

  if (!facts || facts.extractionStatus !== "completed") {
    return "";
  }

  const lines: string[] = [
    "AI-UTLEDEDE DOKUMENTFAKTA FRA TIDLIGERE EKSTRAKSJON (kan inneholde unøyaktigheter - sikkerhetsgrad er oppgitt per felt, stol mer på felt merket 'high' enn 'low'):",
  ];

  if (facts.documentKind) lines.push(`- Type dokumentet fremstår som: ${facts.documentKind}`);
  if (facts.occurredAtDate) {
    lines.push(
      `- Dato dokumentet trolig gjelder: ${facts.occurredAtDate}${facts.occurredAtTime ? ` kl. ${facts.occurredAtTime}` : ""} (sikkerhet: ${facts.dateConfidence ?? "ukjent"})`
    );
  }

  for (const [field, entry] of Object.entries(facts.structuredFacts)) {
    const value = Array.isArray(entry.value) ? entry.value.join(", ") : entry.value;
    lines.push(`- ${field}: ${value} (sikkerhet: ${entry.confidence})`);
  }

  if (facts.sourceCharacteristicsNote) {
    lines.push(`- Kildeegenskaper: ${facts.sourceCharacteristicsNote}`);
  }

  return lines.join("\n");
}

function formatWitnessSection(witnessAccounts: WitnessAccountInput[]): string | null {
  if (witnessAccounts.length === 0) return null;

  const lines = witnessAccounts.map((account, index) => {
    const who =
      account.identityStatus === "named"
        ? account.witnessName ?? "Navngitt vitne"
        : account.identityStatus === "anonymous"
          ? "Anonymisert vitne"
          : "Mulig vitne (ikke bekreftet)";

    const observation =
      account.observationType === "direct"
        ? "DIREKTE OBSERVASJON (vitnet var selv til stede)"
        : "ANNENHÅNDSINFORMASJON (vitnet har hørt dette fra andre, var ikke selv til stede)";

    const statement = account.hasWrittenStatement
      ? "Det finnes en faktisk skriftlig erklæring/dokumentasjon fra dette vitnet."
      : "Dette er brukerens gjengivelse av hva vitnet kan bekrefte - IKKE en faktisk innhentet erklæring fra vitnet selv.";

    return [
      `Vitneopplysning ${index + 1} - ID: ${account.id} - ${who}`,
      `Type: ${observation}`,
      `Status: ${statement}`,
      `Hva brukeren rapporterer at vitnet kan si: ${account.description.trim()}`,
    ].join("\n");
  });

  return [
    "VITNEOPPLYSNINGER KOBLET TIL DENNE PÅSTANDEN",
    "(Dette er en EGEN kildetype, ikke dokumentbevis. Behandles ALDRI som dokumentfakta og skal ALDRI plasseres i evidence_breakdown - bruk witness_breakdown. Skill alltid mellom direkte observasjon og annenhåndsinformasjon, og mellom en faktisk skriftlig erklæring og en ubekreftet påstand om at vitnet 'kan bekrefte noe'.)",
    ...lines,
  ].join("\n");
}

/**
 * Bygger prompten for én bevisvurdering. Brukerens påstand, hvert dokuments
 * uthentede tekst, relevante hendelser, og vitneopplysninger holdes i
 * tydelig merkede, atskilte blokker - samme avgrensningsprinsipp som resten
 * av AI-sikkerheten i kodebasen (wrapUntrustedContent), nå brukt til å
 * hindre at KI-en blander brukerens ord, dokumentets ord, tidslinjekontekst
 * og vitneopplysninger.
 *
 * Fase 2A: documents kan bære forhåndsekstraherte "facts", og events gir
 * kronologisk kontekst. Fase 2B: witnessAccounts gir en egen, tydelig
 * atskilt kildetype. Alle tre er valgfrie for å ikke bryte eksisterende
 * kall fra tidligere faser.
 */
export function buildAssessmentPrompt({
  claimText,
  documents,
  events = [],
  witnessAccounts = [],
}: {
  claimText: string;
  documents: EvidenceDocumentInput[];
  events?: TimelineContextEvent[];
  witnessAccounts?: WitnessAccountInput[];
}): string {
  const claimBlock = [
    "BRUKERENS PÅSTAND",
    "(Dette er brukerens egen fremstilling. Det er IKKE et faktum og IKKE noe du skal bekrefte eller avkrefte - det er gjenstanden for vurderingen.)",
    claimText.trim(),
  ].join("\n");

  const documentBlocks =
    documents.length === 0
      ? "Ingen dokumenter er koblet til denne påstanden."
      : documents
          .map((document, index) => {
            const meta = `Dokument ${index + 1} - ID: ${document.id} - Type: ${document.documentType} - Tittel: ${document.title}`;
            const factsBlock = formatDocumentFacts(document);
            const intentBlock = document.userIntentNote?.trim()
              ? `Brukerens hensikt med dette dokumentet (IKKE et faktum, kun brukerens egen forventning - vurder om dokumentet faktisk innfrir, motsier, eller ikke dekker dette): ${document.userIntentNote.trim()}`
              : "";

            if (document.extractionStatus !== "completed" || !document.extractedText) {
              return [
                meta,
                '(Teksten i dette dokumentet er ikke tilgjengelig for automatisk lesing ennå - vurder det som "silent" med en note om at teksten ikke kunne leses.)',
                factsBlock,
                intentBlock,
              ]
                .filter(Boolean)
                .join("\n");
            }

            return [
              meta,
              factsBlock,
              intentBlock,
              wrapUntrustedContent("Uthentet tekst fra dette dokumentet", document.extractedText),
            ]
              .filter(Boolean)
              .join("\n");
          })
          .join("\n\n");

  const eventsBlock =
    events.length === 0
      ? null
      : [
          "TIDSLINJE - HENDELSER KOBLET TIL DENNE PÅSTANDEN",
          "(Brukeropprettede tidslinjepunkter. Bruk disse KUN til å vurdere om rekkefølgen i tid er forenlig med eller strider mot påstanden - dette er kontekst, ikke bevis i seg selv.)",
          ...events.map((event) => `- ${event.dateLabel}: ${event.title}${event.description ? ` — ${event.description}` : ""}`),
        ].join("\n");

  const witnessBlock = formatWitnessSection(witnessAccounts);

  return [
    claimBlock,
    "",
    "KOBLEDE DOKUMENTER",
    documentBlocks,
    ...(eventsBlock ? ["", eventsBlock] : []),
    ...(witnessBlock ? ["", witnessBlock] : []),
    "",
    RESPONSE_SCHEMA,
  ].join("\n");
}

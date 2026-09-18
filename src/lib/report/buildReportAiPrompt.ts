import type { LegalRule, ReportClaimFinding, ReportDocumentRef, ReportGapEntry, ReportTimelineEntry } from "./types";

const RESPONSE_SCHEMA = `Svar KUN med et JSON-objekt på nøyaktig denne formen (ingen tekst utenfor JSON):
{
  "summary": "Kort, nøytralt sammendrag (3-5 setninger) av hvor saken står: hva som er godt dokumentert, hva som mangler, om det finnes motstrid. Aldri en konklusjon om utfallet av saken.",
  "background": "Ett til to avsnitt som gjengir brukerens egen fremstilling av bakgrunnen. Bruk ALLTID formuleringer som 'Brukeren opplyser at ...' - aldri fremstill dette som etablert faktum.",
  "legal_assessment": [
    { "rule_id": "<nøyaktig ID fra regelverkslisten under>", "commentary": "Forsiktig, konkret kommentar om hvordan DENNE saken kan være relevant for akkurat dette regelverkspunktet - bruk forsiktig språk, aldri konkluder med brudd.", "related_document_ids": ["<nøyaktig dokument-ID fra dokumentlisten under, kun hvis faktisk relevant>"] }
  ],
  "conclusion": "Ett avsnitt med naturlige neste steg basert på hullene og de delvis dokumenterte forholdene som er listet under. Ingen ny påstand om fakta - kun forslag til videre arbeid."
}
Ta kun med regelverkspunkter i legal_assessment som er reelt relevante for denne konkrete saken - ikke list opp alle punktene mekanisk. Tom liste er et gyldig svar hvis intet er relevant.`;

function formatFindings(label: string, findings: ReportClaimFinding[]): string | null {
  if (findings.length === 0) return null;

  const lines = findings.map((f) => {
    const refs = f.documentRefs.map((r) => r.label).join(", ") || "ingen dokumenter";
    return `- «${f.claimText}» (${refs})${f.conflictsBetweenEvidence ? ` — konflikt: ${f.conflictsBetweenEvidence}` : ""}`;
  });

  return [label, ...lines].join("\n");
}

function formatGaps(gaps: ReportGapEntry[]): string | null {
  if (gaps.length === 0) return null;
  return ["DOKUMENTASJONSHULL", ...gaps.map((g) => `- ${g.description}`)].join("\n");
}

function formatTimeline(entries: ReportTimelineEntry[]): string | null {
  if (entries.length === 0) return null;
  return [
    "TIDSLINJE",
    ...entries.map((e) => `- ${e.dateLabel}: ${e.title}${e.hasDateConflict ? " (motstridende datoer oppgitt)" : ""}`),
  ].join("\n");
}

function formatDocuments(documentRefs: ReportDocumentRef[]): string {
  if (documentRefs.length === 0) return "Ingen dokumenter i saken.";
  return documentRefs.map((ref) => `${ref.label} - ID: ${ref.documentId} - ${ref.title}`).join("\n");
}

function formatLegalRules(rules: LegalRule[]): string {
  if (rules.length === 0) return "Ingen regelverkspunkter tilgjengelig.";
  return rules.map((rule) => `ID: ${rule.id}\nTittel: ${rule.title}\nSammendrag: ${rule.summary}\nRelevans: ${rule.relevance}`).join("\n\n");
}

/**
 * Bygger prompten for de fire KI-forfattede seksjonene (summary, background,
 * legal_assessment, conclusion). Alt annet i rapporten (tidslinje,
 * dokumenterte funn, vitner, hull) er ALLEREDE bygget deterministisk fra
 * Evidence Engine-data og gis inn her kun som KONTEKST - KI skal aldri finne
 * opp nye funn, kun formulere/vurdere/sammenstille det som allerede finnes.
 *
 * Produktnøytral: regelverket (`legalRules`) er et rent parameter, ingen
 * PresseSjekk-spesifikke begreper i selve malen.
 */
export function buildReportAiPrompt({
  caseTitle,
  background,
  documented,
  partiallyDocumented,
  conflicting,
  gaps,
  timelineEntries,
  documentRefs,
  legalRules,
}: {
  caseTitle: string;
  background: {
    whatHappened: string | null;
    yourRole: string | null;
    replySent: boolean;
    replyText: string | null;
    editorResponse: string | null;
    legalStatus: string | null;
    legalStatusDetails: string | null;
    desiredOutcome: string | null;
  };
  documented: ReportClaimFinding[];
  partiallyDocumented: ReportClaimFinding[];
  conflicting: ReportClaimFinding[];
  gaps: ReportGapEntry[];
  timelineEntries: ReportTimelineEntry[];
  documentRefs: ReportDocumentRef[];
  legalRules: LegalRule[];
}): string {
  const backgroundBlock = [
    "BRUKERENS EGEN FREMSTILLING (rådata - dette er IKKE fakta, kun brukerens fremstilling)",
    background.whatHappened ? `Hva skjedde: ${background.whatHappened}` : null,
    background.yourRole ? `Brukerens rolle: ${background.yourRole}` : null,
    `Tilsvar/henvendelse sendt: ${background.replySent ? "ja" : "ikke registrert"}`,
    background.replyText ? `Tilsvar/henvendelse: ${background.replyText}` : null,
    background.editorResponse ? `Svar mottatt: ${background.editorResponse}` : null,
    background.legalStatus ? `Rettsstatus: ${background.legalStatus}${background.legalStatusDetails ? ` - ${background.legalStatusDetails}` : ""}` : null,
    background.desiredOutcome ? `Ønsket resultat: ${background.desiredOutcome}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const contextBlocks = [
    formatTimeline(timelineEntries),
    formatFindings("DOKUMENTERTE FORHOLD", documented),
    formatFindings("DELVIS DOKUMENTERTE FORHOLD", partiallyDocumented),
    formatFindings("MOTSTRIDENDE OPPLYSNINGER", conflicting),
    formatGaps(gaps),
  ].filter((block): block is string => Boolean(block));

  return [
    `SAK: ${caseTitle.trim()}`,
    "",
    backgroundBlock,
    "",
    ...contextBlocks,
    "",
    "TILGJENGELIGE DOKUMENTER (bruk KUN disse ID-ene hvis du refererer til dokumenter)",
    formatDocuments(documentRefs),
    "",
    "TILGJENGELIGE REGELVERKSPUNKTER (bruk KUN disse ID-ene i legal_assessment)",
    formatLegalRules(legalRules),
    "",
    RESPONSE_SCHEMA,
  ].join("\n");
}

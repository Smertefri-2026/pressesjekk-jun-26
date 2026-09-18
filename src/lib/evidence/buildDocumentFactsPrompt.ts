import { wrapUntrustedContent } from "@/lib/ai/openai";

const RESPONSE_SCHEMA = `Svar KUN med et JSON-objekt på nøyaktig denne formen (ingen tekst utenfor JSON). Utelat felt du ikke finner grunnlag for i teksten - ikke gjett:
{
  "document_kind": "email | agreement | article | message | call_log | other | unknown",
  "summary": "Ett nøytralt avsnitt om hva dokumentet ER - ikke hva det beviser.",
  "occurred_at_date": "YYYY-MM-DD eller null hvis ingen dato finnes i teksten",
  "occurred_at_time": "HH:MM eller null",
  "date_confidence": "high | medium | low - kun hvis occurred_at_date er satt",
  "date_note": "Kort forklaring på hvor datoen kommer fra, eller hvorfor den er usikker.",
  "structured_facts": {
    "<felt, f.eks. sender, recipient, subject, attachments, names_mentioned, key_quotes, parties, signature_status, key_terms, publication, byline>": {
      "value": "tekst eller liste med tekst",
      "confidence": "high | medium | low"
    }
  },
  "source_characteristics": ["velg kun blant: contemporaneous, third_party, public_document, signed, user_own_note, screenshot, original_file, copy_or_export, unknown_origin"],
  "source_characteristics_note": "Én-to nøytrale setninger om dokumentets egenskaper, uten å konkludere om bevisstyrke.",
  "likely_event_description": "Kort forslag til hvilken hendelse i saken dette dokumentet trolig gjelder, eller null."
}

Eksempel på felt for en e-post: sender, recipient, subject, attachments, names_mentioned, key_quotes.
Eksempel på felt for en avtale: parties, signature_status, key_terms.
Eksempel på felt for en artikkel: publication, byline, headline, claims_made.
Dette er eksempler, ikke en fast liste - bruk feltnavn som faktisk passer dokumentet.`;

/**
 * Bygger prompten for dokumentfakta-ekstraksjon. Dette er det FØRSTE
 * stedet et dokuments rå, uthentede tekst når en språkmodell - strammere
 * avgrensning her er derfor viktigere enn noe annet AI-kall i kodebasen.
 */
export function buildDocumentFactsPrompt({
  title,
  documentType,
  extractedText,
}: {
  title: string;
  documentType: string;
  extractedText: string;
}): string {
  return [
    `DOKUMENT - Tittel: ${title} - Brukerens kategori: ${documentType}`,
    wrapUntrustedContent("Uthentet tekst fra dokumentet", extractedText),
    "",
    RESPONSE_SCHEMA,
  ].join("\n");
}

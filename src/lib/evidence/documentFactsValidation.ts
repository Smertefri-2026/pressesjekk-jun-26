import type {
  DocumentFactConfidence,
  DocumentKind,
  SourceCharacteristic,
  StructuredFactValue,
} from "./types";

export type ValidatedDocumentFacts = {
  documentKind: DocumentKind;
  summary: string;
  occurredAtDate: string | null;
  occurredAtTime: string | null;
  dateConfidence: DocumentFactConfidence | null;
  dateNote: string | null;
  structuredFacts: Record<string, StructuredFactValue>;
  sourceCharacteristics: SourceCharacteristic[];
  sourceCharacteristicsNote: string | null;
  likelyEventDescription: string | null;
};

const VALID_DOCUMENT_KINDS = new Set<string>([
  "email",
  "agreement",
  "article",
  "message",
  "call_log",
  "other",
  "unknown",
]);

const VALID_CONFIDENCE = new Set<string>(["high", "medium", "low"]);

const VALID_SOURCE_CHARACTERISTICS = new Set<string>([
  "contemporaneous",
  "third_party",
  "public_document",
  "signed",
  "user_own_note",
  "screenshot",
  "original_file",
  "copy_or_export",
  "unknown_origin",
]);

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// Gyldige klokkeslettverdier, ikke bare riktig antall siffer - "25:99" har
// riktig FORM men er ikke et gyldig klokkeslett.
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime());
}

function normalizeConfidence(value: unknown): DocumentFactConfidence {
  // Usikker/manglende sikkerhetsgrad -> "low", aldri "high". En KI som ikke
  // eksplisitt sier den er sikker, skal aldri fremstå sikrere enn den er.
  if (typeof value === "string" && VALID_CONFIDENCE.has(value)) {
    return value as DocumentFactConfidence;
  }
  return "low";
}

/**
 * Validerer et rått KI-JSON-svar fra dokumentfakta-ekstraksjonen.
 *
 * Bevisst mer feiltolerant enn validateAssessmentPayload: en
 * fakta-ekstraksjon er "best effort" over et vilkårlig dokument, og skal
 * degradere gradvis (uklare felt droppes/nedgraderes til lav sikkerhet)
 * fremfor å kaste hele resultatet - i motsetning til en påstandsvurdering,
 * der et ugyldig status/confidence-felt er alvorlig nok til å forkastes i
 * sin helhet. "summary" er likevel et hardt krav - uten den er resultatet
 * ikke brukbart i det hele tatt.
 */
export function validateDocumentFactsPayload(raw: unknown): ValidatedDocumentFacts | null {
  if (!raw || typeof raw !== "object") return null;

  const value = raw as Record<string, unknown>;

  if (!isNonEmptyString(value.summary)) return null;

  const documentKind: DocumentKind =
    typeof value.document_kind === "string" && VALID_DOCUMENT_KINDS.has(value.document_kind)
      ? (value.document_kind as DocumentKind)
      : "unknown";

  const occurredAtDate = isValidIsoDate(value.occurred_at_date) ? (value.occurred_at_date as string) : null;
  const occurredAtTime =
    typeof value.occurred_at_time === "string" && TIME_PATTERN.test(value.occurred_at_time)
      ? value.occurred_at_time
      : null;

  // Ingen dato -> gir ikke mening å oppgi sikkerhet for en dato som ikke finnes.
  const dateConfidence = occurredAtDate
    ? normalizeConfidence(value.date_confidence)
    : null;

  const structuredFactsRaw =
    value.structured_facts && typeof value.structured_facts === "object"
      ? (value.structured_facts as Record<string, unknown>)
      : {};

  const structuredFacts: Record<string, StructuredFactValue> = {};

  for (const [key, entry] of Object.entries(structuredFactsRaw)) {
    if (!entry || typeof entry !== "object") continue;

    const record = entry as Record<string, unknown>;
    const rawValue = record.value;

    let normalizedValue: string | string[] | null = null;

    if (typeof rawValue === "string" && rawValue.trim()) {
      normalizedValue = rawValue.trim();
    } else if (Array.isArray(rawValue)) {
      const items = rawValue.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      if (items.length > 0) normalizedValue = items;
    }

    if (normalizedValue === null) continue;

    structuredFacts[key] = {
      value: normalizedValue,
      confidence: normalizeConfidence(record.confidence),
    };
  }

  const sourceCharacteristics: SourceCharacteristic[] = Array.isArray(value.source_characteristics)
    ? value.source_characteristics.filter(
        (item): item is SourceCharacteristic =>
          typeof item === "string" && VALID_SOURCE_CHARACTERISTICS.has(item)
      )
    : [];

  return {
    documentKind,
    summary: (value.summary as string).trim(),
    occurredAtDate,
    occurredAtTime,
    dateConfidence,
    dateNote: isNonEmptyString(value.date_note) ? value.date_note.trim() : null,
    structuredFacts,
    sourceCharacteristics,
    sourceCharacteristicsNote: isNonEmptyString(value.source_characteristics_note)
      ? value.source_characteristics_note.trim()
      : null,
    likelyEventDescription: isNonEmptyString(value.likely_event_description)
      ? value.likely_event_description.trim()
      : null,
  };
}

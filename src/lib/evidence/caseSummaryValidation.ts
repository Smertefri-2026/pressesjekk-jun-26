export type ValidatedCaseSummaryPayload = {
  bestDocumentedSummary: string | null;
  partiallyDocumentedSummary: string | null;
  conflictsSummary: string | null;
  keyGapsSummary: string | null;
  strengthenAreasSummary: string | null;
};

const FIELD_MAP: Record<keyof ValidatedCaseSummaryPayload, string> = {
  bestDocumentedSummary: "best_documented_summary",
  partiallyDocumentedSummary: "partially_documented_summary",
  conflictsSummary: "conflicts_summary",
  keyGapsSummary: "key_gaps_summary",
  strengthenAreasSummary: "strengthen_areas_summary",
};

// Fanger opp forsøk på en samlet "bevisstyrke 87%"-type score - forbudt per
// produktkravet "ikke lag falsk score". Feltet strykes (settes til null)
// heller enn at hele svaret forkastes, siden resten av feltet ofte er gyldig.
const FALSE_SCORE_PATTERN = /\d{1,3}\s?%/;

function normalizeField(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (FALSE_SCORE_PATTERN.test(trimmed)) return null;
  return trimmed;
}

/**
 * Validerer den saksbrede AI-oppsummeringen. Alle felt er valgfrie (null er
 * et gyldig, forventet svar for en tom kategori - f.eks. ingen konflikter).
 * Forkaster hele svaret kun hvis det ikke engang er et objekt.
 */
export function validateCaseSummaryPayload(raw: unknown): ValidatedCaseSummaryPayload | null {
  if (!raw || typeof raw !== "object") return null;

  const value = raw as Record<string, unknown>;

  const result = {} as ValidatedCaseSummaryPayload;
  for (const [key, dbKey] of Object.entries(FIELD_MAP) as [keyof ValidatedCaseSummaryPayload, string][]) {
    result[key] = normalizeField(value[dbKey]);
  }

  return result;
}

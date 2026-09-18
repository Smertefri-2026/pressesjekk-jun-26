import type { DocumentationSuggestionItem } from "./types";

const MAX_SUGGESTIONS = 4;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validerer KI sitt forslag til manglende dokumentasjon. Feiltolerant på
 * samme måte som dokumentfakta: en ugyldig enkeltoppføring droppes, hele
 * svaret forkastes bare hvis strukturen er fundamentalt feil.
 */
export function validateSuggestionsPayload(raw: unknown): DocumentationSuggestionItem[] | null {
  if (!raw || typeof raw !== "object") return null;

  const value = raw as Record<string, unknown>;
  const rawSuggestions = Array.isArray(value.suggestions) ? value.suggestions : null;

  if (!rawSuggestions) return null;

  const suggestions: DocumentationSuggestionItem[] = [];

  for (const entry of rawSuggestions) {
    if (suggestions.length >= MAX_SUGGESTIONS) break;
    if (!entry || typeof entry !== "object") continue;

    const item = entry as Record<string, unknown>;

    if (!isNonEmptyString(item.label) || !isNonEmptyString(item.description)) continue;

    suggestions.push({
      label: item.label.trim(),
      description: item.description.trim(),
    });
  }

  return suggestions;
}

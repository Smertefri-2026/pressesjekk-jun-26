import { describe, expect, it } from "vitest";
import { validateCaseSummaryPayload } from "./caseSummaryValidation";

describe("validateCaseSummaryPayload", () => {
  it("scenario: gyldig saksbred oppsummering godtas", () => {
    const result = validateCaseSummaryPayload({
      best_documented_summary: "Telefonsamtalen 3. mars er godt dokumentert gjennom telefonlogg og SMS.",
      partially_documented_summary: "Møtet 10. april mangler skriftlig bekreftelse fra begge parter.",
      conflicts_summary: "Datoen for e-posten er oppgitt ulikt av brukeren og i selve dokumentet.",
      key_gaps_summary: "Det viktigste hullet er manglende skriftlig erklæring fra det navngitte vitnet.",
      strengthen_areas_summary: "En skriftlig bekreftelse fra vitnet ville styrket saken mest.",
    });

    expect(result).not.toBeNull();
    expect(result?.bestDocumentedSummary).toContain("telefonlogg");
    expect(result?.conflictsSummary).toContain("Datoen");
  });

  it("tomme kategorier er gyldig null, ikke en påtvunget setning", () => {
    const result = validateCaseSummaryPayload({
      best_documented_summary: null,
      partially_documented_summary: null,
      conflicts_summary: null,
      key_gaps_summary: null,
      strengthen_areas_summary: null,
    });

    expect(result).toEqual({
      bestDocumentedSummary: null,
      partiallyDocumentedSummary: null,
      conflictsSummary: null,
      keyGapsSummary: null,
      strengthenAreasSummary: null,
    });
  });

  it("stryker felt som inneholder en falsk samlet prosent-score", () => {
    const result = validateCaseSummaryPayload({
      best_documented_summary: "Saken er 87% dokumentert samlet sett.",
      partially_documented_summary: "Dette forholdet er delvis dekket.",
      conflicts_summary: null,
      key_gaps_summary: null,
      strengthen_areas_summary: null,
    });

    expect(result?.bestDocumentedSummary).toBeNull();
    expect(result?.partiallyDocumentedSummary).toBe("Dette forholdet er delvis dekket.");
  });

  it("avviser helt feil struktur", () => {
    expect(validateCaseSummaryPayload(null)).toBeNull();
    expect(validateCaseSummaryPayload("tekst")).toBeNull();
    expect(validateCaseSummaryPayload(42)).toBeNull();
  });

  it("tomt objekt gir alle felt som null, ikke avvisning", () => {
    const result = validateCaseSummaryPayload({});
    expect(result).toEqual({
      bestDocumentedSummary: null,
      partiallyDocumentedSummary: null,
      conflictsSummary: null,
      keyGapsSummary: null,
      strengthenAreasSummary: null,
    });
  });
});

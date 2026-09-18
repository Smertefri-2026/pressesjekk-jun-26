import { describe, expect, it } from "vitest";
import { buildCaseSummaryPrompt } from "./buildCaseSummaryPrompt";

describe("buildCaseSummaryPrompt", () => {
  it("scenario: bygger prompt fra strukturerte påstander og hull, ikke rå dokumenttekst", () => {
    const prompt = buildCaseSummaryPrompt({
      claims: [
        {
          text: "Journalisten ringte meg 3. mars.",
          status: "well_documented",
          whatItShows: "Telefonlogg og SMS bekrefter at samtalen fant sted.",
          supportsSummary: "Telefonlogg og SMS støtter dette.",
          contradictsSummary: null,
          corroborationNote: "Flere uavhengige opplysninger støtter dette.",
        },
      ],
      gaps: [{ type: "unconfirmed_witness", description: "Kari er oppgitt som kilde, men uten skriftlig erklæring." }],
    });

    expect(prompt).toContain("Journalisten ringte meg 3. mars.");
    expect(prompt).toContain("Godt dokumentert");
    expect(prompt).toContain("Kari er oppgitt som kilde");
  });

  it("tom sak gir tydelig tomme-blokker, ikke feil", () => {
    const prompt = buildCaseSummaryPrompt({ claims: [], gaps: [] });
    expect(prompt).toContain("Ingen påstander er registrert");
    expect(prompt).toContain("Ingen dokumentasjonshull er identifisert");
  });

  it("instruerer eksplisitt om at hver kategori kan være null", () => {
    const prompt = buildCaseSummaryPrompt({ claims: [], gaps: [] });
    expect(prompt).toMatch(/null/i);
  });

  it("er produktnøytral - ingen presse-spesifikke begreper hardkodet i selve prompt-malen", () => {
    const prompt = buildCaseSummaryPrompt({ claims: [], gaps: [] });
    expect(prompt.toLowerCase()).not.toContain("journalist");
    expect(prompt.toLowerCase()).not.toContain("redaksjon");
    expect(prompt.toLowerCase()).not.toContain("pfu");
  });
});

import { describe, expect, it } from "vitest";
import { buildSuggestionsPrompt } from "./buildSuggestionsPrompt";

describe("buildSuggestionsPrompt", () => {
  it("scenario: foreslå relevant dokumentasjon for en telefonsamtale-påstand", () => {
    const prompt = buildSuggestionsPrompt({
      claimText: "Journalisten ringte meg 14. mars 2026.",
    });

    expect(prompt).toContain("Journalisten ringte meg 14. mars 2026.");
    expect(prompt).toContain("Ingenting er koblet");
  });

  it("nevner allerede koblet dokumentasjon slik at KI ikke foreslår det på nytt", () => {
    const prompt = buildSuggestionsPrompt({
      claimText: "X",
      alreadyLinkedSummary: "- E-post fra journalist (koblet)",
    });

    expect(prompt).toContain("ALLEREDE KOBLET");
    expect(prompt).toContain("E-post fra journalist");
  });

  it("er produktnøytral - ingen presse-spesifikke begreper hardkodet i selve prompt-malen", () => {
    const prompt = buildSuggestionsPrompt({ claimText: "X" });
    expect(prompt.toLowerCase()).not.toContain("journalist");
    expect(prompt.toLowerCase()).not.toContain("redaksjon");
    expect(prompt.toLowerCase()).not.toContain("pfu");
  });
});

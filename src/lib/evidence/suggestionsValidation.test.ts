import { describe, expect, it } from "vitest";
import { validateSuggestionsPayload } from "./suggestionsValidation";

describe("validateSuggestionsPayload", () => {
  it("scenario: forslag om relevant dokumentasjon godtas", () => {
    const result = validateSuggestionsPayload({
      suggestions: [
        { label: "Anropslogg", description: "Kan bekrefte at samtalen fant sted på oppgitt tidspunkt." },
        { label: "SMS i etterkant", description: "En SMS rett etter samtalen kan omtale hva som ble sagt." },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result?.[0]?.label).toBe("Anropslogg");
  });

  it("begrenser til maks 4 forslag - ikke en lang generisk sjekkliste", () => {
    const result = validateSuggestionsPayload({
      suggestions: Array.from({ length: 10 }, (_, i) => ({
        label: `Forslag ${i}`,
        description: `Beskrivelse ${i}`,
      })),
    });

    expect(result).toHaveLength(4);
  });

  it("dropper ufullstendige forslag i stedet for å forkaste alt", () => {
    const result = validateSuggestionsPayload({
      suggestions: [
        { label: "Gyldig", description: "En beskrivelse." },
        { label: "Uten beskrivelse" },
        { description: "Uten label" },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result?.[0]?.label).toBe("Gyldig");
  });

  it("avviser helt feil struktur", () => {
    expect(validateSuggestionsPayload(null)).toBeNull();
    expect(validateSuggestionsPayload({})).toBeNull();
    expect(validateSuggestionsPayload({ suggestions: "ikke en liste" })).toBeNull();
  });

  it("tom forslagsliste er gyldig (ingenting mer å foreslå)", () => {
    const result = validateSuggestionsPayload({ suggestions: [] });
    expect(result).toEqual([]);
  });
});

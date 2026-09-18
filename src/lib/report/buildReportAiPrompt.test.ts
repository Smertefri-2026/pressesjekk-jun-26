import { describe, expect, it } from "vitest";
import { buildReportAiPrompt } from "./buildReportAiPrompt";

function baseArgs() {
  return {
    caseTitle: "Testsak",
    background: {
      whatHappened: null,
      yourRole: null,
      replySent: false,
      replyText: null,
      editorResponse: null,
      legalStatus: null,
      legalStatusDetails: null,
      desiredOutcome: null,
    },
    documented: [],
    partiallyDocumented: [],
    conflicting: [],
    gaps: [],
    timelineEntries: [],
    documentRefs: [],
    legalRules: [],
  };
}

describe("buildReportAiPrompt", () => {
  it("scenario: inkluderer sakstittel, regelverk og dokumentliste med ID-er", () => {
    const prompt = buildReportAiPrompt({
      ...baseArgs(),
      caseTitle: "Sak mot Eksempel Avis",
      documentRefs: [{ documentId: "doc-1", label: "Dokument 1", title: "E-post" }],
      legalRules: [{ id: "vvp-4-1", title: "VVP 4.1", summary: "Saklighet.", relevance: "Relevant her." }],
    });

    expect(prompt).toContain("Sak mot Eksempel Avis");
    expect(prompt).toContain("Dokument 1 - ID: doc-1");
    expect(prompt).toContain("vvp-4-1");
  });

  it("er produktnøytral - ingen presse-spesifikke begreper hardkodet i selve prompt-malen", () => {
    const prompt = buildReportAiPrompt(baseArgs());
    expect(prompt.toLowerCase()).not.toContain("journalist");
    expect(prompt.toLowerCase()).not.toContain("redaksjon");
    expect(prompt.toLowerCase()).not.toContain("pfu");
    expect(prompt.toLowerCase()).not.toContain("vær varsom");
  });

  it("instruerer eksplisitt om å bruke 'brukeren opplyser' for bakgrunn, aldri fremstille som fakta", () => {
    const prompt = buildReportAiPrompt(baseArgs());
    expect(prompt).toMatch(/Brukeren opplyser/);
  });

  it("instruerer at KI kun skal bruke ID-er fra de oppgitte listene", () => {
    const prompt = buildReportAiPrompt(baseArgs());
    expect(prompt).toMatch(/nøyaktig ID fra/i);
  });
});

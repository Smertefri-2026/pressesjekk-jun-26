import { describe, expect, it } from "vitest";
import { assembleReportSections } from "./assembleReport";

const validatedAi = {
  summary: "Sammendrag.",
  background: "",
  legalAssessment: [],
  conclusion: "Konklusjon.",
};

describe("assembleReportSections", () => {
  it("scenario: tomme seksjoner skal ikke vises - tom bakgrunn, tom regelverksvurdering, ingen KI-oppsummering", () => {
    const sections = assembleReportSections({
      deterministicSections: [],
      ai: validatedAi,
      legalRules: [],
      documentRefs: [],
      caseSummary: null,
    });

    const kinds = sections.map((s) => s.kind);
    expect(kinds).toEqual(["summary", "conclusion"]);
  });

  it("inkluderer bakgrunn kun når KI faktisk skrev noe", () => {
    const sections = assembleReportSections({
      deterministicSections: [],
      ai: { ...validatedAi, background: "Brukeren opplyser at ..." },
      legalRules: [],
      documentRefs: [],
      caseSummary: null,
    });

    expect(sections.map((s) => s.kind)).toContain("background");
  });

  it("inkluderer regelverksvurdering med riktig regeltittel og dokumentreferanser slått opp", () => {
    const sections = assembleReportSections({
      deterministicSections: [],
      ai: {
        ...validatedAi,
        legalAssessment: [{ ruleId: "vvp-4-1", commentary: "Kan være relevant.", documentIds: ["doc-1"] }],
      },
      legalRules: [{ id: "vvp-4-1", title: "VVP 4.1 – Saklighet", summary: "x", relevance: "y" }],
      documentRefs: [{ documentId: "doc-1", label: "Dokument 1", title: "E-post" }],
      caseSummary: null,
    });

    const legal = sections.find((s) => s.kind === "legal_assessment");
    expect(legal?.kind).toBe("legal_assessment");
    if (legal?.kind === "legal_assessment") {
      expect(legal.items[0].ruleTitle).toBe("VVP 4.1 – Saklighet");
      expect(legal.items[0].documentRefs[0].label).toBe("Dokument 1");
    }
  });

  it("inkluderer KI-vurdering (gjenbrukt fra saksbred oppsummering) kun når minst ett felt finnes", () => {
    const withSummary = assembleReportSections({
      deterministicSections: [],
      ai: validatedAi,
      legalRules: [],
      documentRefs: [],
      caseSummary: {
        bestDocumentedSummary: "Best dokumentert.",
        partiallyDocumentedSummary: null,
        conflictsSummary: null,
        keyGapsSummary: null,
        strengthenAreasSummary: null,
      },
    });
    expect(withSummary.map((s) => s.kind)).toContain("ai_assessment");

    const withEmptySummary = assembleReportSections({
      deterministicSections: [],
      ai: validatedAi,
      legalRules: [],
      documentRefs: [],
      caseSummary: {
        bestDocumentedSummary: null,
        partiallyDocumentedSummary: null,
        conflictsSummary: null,
        keyGapsSummary: null,
        strengthenAreasSummary: null,
      },
    });
    expect(withEmptySummary.map((s) => s.kind)).not.toContain("ai_assessment");
  });

  it("rekkefølgen matcher spesifikasjonen: sammendrag, bakgrunn, deterministiske seksjoner, regelverk, KI-vurdering, konklusjon", () => {
    const sections = assembleReportSections({
      deterministicSections: [{ kind: "timeline", heading: "Tidslinje", entries: [] }],
      ai: {
        summary: "S",
        background: "B",
        legalAssessment: [{ ruleId: "r1", commentary: "C", documentIds: [] }],
        conclusion: "K",
      },
      legalRules: [{ id: "r1", title: "R1", summary: "x", relevance: "y" }],
      documentRefs: [],
      caseSummary: { bestDocumentedSummary: "X", partiallyDocumentedSummary: null, conflictsSummary: null, keyGapsSummary: null, strengthenAreasSummary: null },
    });

    expect(sections.map((s) => s.kind)).toEqual([
      "summary",
      "background",
      "timeline",
      "legal_assessment",
      "ai_assessment",
      "conclusion",
    ]);
  });
});

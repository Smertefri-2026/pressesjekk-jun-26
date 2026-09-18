import { describe, expect, it } from "vitest";
import { identifyDocumentationGaps, sortGapsByPriority } from "./documentationGaps";
import type { GapAnalysisInput } from "./documentationGaps";

function emptyInput(overrides: Partial<GapAnalysisInput> = {}): GapAnalysisInput {
  return { claims: [], events: [], witnessAccounts: [], ...overrides };
}

describe("identifyDocumentationGaps", () => {
  it("scenario: dokumentasjonshull - viktig påstand uten dokumentasjon", () => {
    const gaps = identifyDocumentationGaps(
      emptyInput({
        claims: [
          {
            id: "c1",
            text: "Journalisten løy om kilden.",
            noEvidenceConfirmedAt: null,
            evidenceCount: 0,
            eventCount: 1,
            latestAssessmentStatus: null,
          },
        ],
      })
    );

    expect(gaps.some((g) => g.type === "undocumented_claim" && g.entityId === "c1")).toBe(true);
  });

  it("bruker bekrefter at mer dokumentasjon ikke finnes - genererer IKKE lenger et hull for den påstanden", () => {
    const gaps = identifyDocumentationGaps(
      emptyInput({
        claims: [
          {
            id: "c1",
            text: "Ingen dokumentasjon finnes.",
            noEvidenceConfirmedAt: "2026-03-15T00:00:00Z",
            evidenceCount: 0,
            eventCount: 1,
            latestAssessmentStatus: null,
          },
        ],
      })
    );

    expect(gaps.some((g) => g.type === "undocumented_claim")).toBe(false);
  });

  it("scenario: dokumentasjonen dekker bare deler av en påstand", () => {
    const gaps = identifyDocumentationGaps(
      emptyInput({
        claims: [
          {
            id: "c1",
            text: "X",
            noEvidenceConfirmedAt: null,
            evidenceCount: 1,
            eventCount: 1,
            latestAssessmentStatus: "partially_documented",
          },
        ],
      })
    );

    expect(gaps.some((g) => g.type === "partially_documented_claim")).toBe(true);
  });

  it("scenario: motstridende dokumentasjon", () => {
    const gaps = identifyDocumentationGaps(
      emptyInput({
        claims: [
          {
            id: "c1",
            text: "X",
            noEvidenceConfirmedAt: null,
            evidenceCount: 2,
            eventCount: 1,
            latestAssessmentStatus: "conflicting",
          },
        ],
      })
    );

    expect(gaps.some((g) => g.type === "conflicting_claim")).toBe(true);
  });

  it("scenario: tidslinjen har et hull - påstand uten koblet hendelse", () => {
    const gaps = identifyDocumentationGaps(
      emptyInput({
        claims: [
          {
            id: "c1",
            text: "X",
            noEvidenceConfirmedAt: null,
            evidenceCount: 1,
            eventCount: 0,
            latestAssessmentStatus: "well_documented",
          },
        ],
      })
    );

    expect(gaps.some((g) => g.type === "unanchored_claim")).toBe(true);
  });

  it("scenario: hendelse mangler dokumentasjon", () => {
    const gaps = identifyDocumentationGaps(
      emptyInput({ events: [{ id: "e1", title: "Telefonsamtale", documentCount: 0 }] })
    );

    expect(gaps.some((g) => g.type === "undocumented_event" && g.entityId === "e1")).toBe(true);
  });

  it("scenario: påstått vitne uten faktisk erklæring", () => {
    const gaps = identifyDocumentationGaps(
      emptyInput({
        witnessAccounts: [{ id: "wa1", witnessName: "Kari Nordmann", documentCount: 0 }],
      })
    );

    expect(gaps.some((g) => g.type === "unconfirmed_witness" && g.entityId === "wa1")).toBe(true);
    expect(gaps[0]?.description).toContain("Kari Nordmann");
  });

  it("vitne MED skriftlig erklæring gir ikke noe hull", () => {
    const gaps = identifyDocumentationGaps(
      emptyInput({
        witnessAccounts: [{ id: "wa1", witnessName: "Kari", documentCount: 1 }],
      })
    );

    expect(gaps.some((g) => g.type === "unconfirmed_witness")).toBe(false);
  });

  it("et hull betyr aldri at opplysningen er feil - språket er alltid nøytralt, aldri anklagende", () => {
    const gaps = identifyDocumentationGaps(
      emptyInput({
        claims: [
          {
            id: "c1",
            text: "X",
            noEvidenceConfirmedAt: null,
            evidenceCount: 0,
            eventCount: 1,
            latestAssessmentStatus: null,
          },
        ],
      })
    );

    const text = gaps[0]?.description.toLowerCase() ?? "";
    expect(text).not.toContain("feil");
    expect(text).not.toContain("usann");
    expect(text).not.toContain("lyver");
  });

  it("godt dokumenterte påstander med hendelse gir ingen hull i det hele tatt", () => {
    const gaps = identifyDocumentationGaps(
      emptyInput({
        claims: [
          {
            id: "c1",
            text: "X",
            noEvidenceConfirmedAt: null,
            evidenceCount: 2,
            eventCount: 1,
            latestAssessmentStatus: "well_documented",
          },
        ],
        events: [{ id: "e1", title: "Y", documentCount: 1 }],
      })
    );

    expect(gaps).toEqual([]);
  });
});

describe("sortGapsByPriority", () => {
  it("prioriterer motstridende og udokumentert foran mindre presserende hull", () => {
    const sorted = sortGapsByPriority([
      { type: "unanchored_claim", entityId: "a", description: "" },
      { type: "conflicting_claim", entityId: "b", description: "" },
      { type: "undocumented_event", entityId: "c", description: "" },
      { type: "undocumented_claim", entityId: "d", description: "" },
    ]);

    expect(sorted.map((g) => g.type)).toEqual([
      "conflicting_claim",
      "undocumented_claim",
      "undocumented_event",
      "unanchored_claim",
    ]);
  });
});

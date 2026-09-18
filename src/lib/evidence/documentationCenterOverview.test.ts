import { describe, expect, it } from "vitest";
import { computeDocumentationCenterOverview } from "./documentationCenterOverview";

describe("computeDocumentationCenterOverview", () => {
  it("scenario: tom sak - alle tall er null", () => {
    const overview = computeDocumentationCenterOverview({
      documentCount: 0,
      claims: [],
      witnessCount: 0,
      gapCount: 0,
    });

    expect(overview.documentCount).toBe(0);
    expect(overview.claimCount).toBe(0);
    expect(overview.witnessCount).toBe(0);
    expect(overview.gapCount).toBe(0);
    expect(overview.claimStatusCounts).toEqual({
      well_documented: 0,
      partially_documented: 0,
      conflicting: 0,
      undocumented: 0,
      not_assessed: 0,
    });
  });

  it("scenario: riktig statusantall for blandet sak", () => {
    const overview = computeDocumentationCenterOverview({
      documentCount: 18,
      claims: [
        { evidenceCount: 2, latestAssessmentStatus: "well_documented" },
        { evidenceCount: 3, latestAssessmentStatus: "well_documented" },
        { evidenceCount: 1, latestAssessmentStatus: "partially_documented" },
        { evidenceCount: 2, latestAssessmentStatus: "conflicting" },
        { evidenceCount: 0, latestAssessmentStatus: null },
        { evidenceCount: 1, latestAssessmentStatus: null },
      ],
      witnessCount: 2,
      gapCount: 4,
    });

    expect(overview.documentCount).toBe(18);
    expect(overview.claimCount).toBe(6);
    expect(overview.claimStatusCounts.well_documented).toBe(2);
    expect(overview.claimStatusCounts.partially_documented).toBe(1);
    expect(overview.claimStatusCounts.conflicting).toBe(1);
    expect(overview.claimStatusCounts.undocumented).toBe(1);
    expect(overview.claimStatusCounts.not_assessed).toBe(1);
    expect(overview.witnessCount).toBe(2);
    expect(overview.gapCount).toBe(4);
  });

  it("scenario: null dokumenter koblet overstyrer alltid en gammel KI-vurdering til udokumentert", () => {
    const overview = computeDocumentationCenterOverview({
      documentCount: 0,
      claims: [{ evidenceCount: 0, latestAssessmentStatus: "well_documented" }],
      witnessCount: 0,
      gapCount: 1,
    });

    expect(overview.claimStatusCounts.undocumented).toBe(1);
    expect(overview.claimStatusCounts.well_documented).toBe(0);
  });

  it("bruker aldri en samlet prosent/score - kun konkrete antall per kategori", () => {
    const overview = computeDocumentationCenterOverview({
      documentCount: 5,
      claims: [{ evidenceCount: 1, latestAssessmentStatus: "well_documented" }],
      witnessCount: 1,
      gapCount: 0,
    });

    const serialized = JSON.stringify(overview);
    expect(serialized).not.toMatch(/score|percent|prosent/i);
  });
});

import { describe, expect, it } from "vitest";
import { buildReportSections, type BuildReportSectionsInput } from "./buildReportSections";

function baseInput(overrides: Partial<BuildReportSectionsInput> = {}): BuildReportSectionsInput {
  return {
    claims: [],
    events: [],
    documents: [],
    witnesses: [],
    gaps: [],
    caseSummaryId: null,
    ...overrides,
  };
}

const wellDocumentedAssessment = {
  status: "well_documented" as const,
  whatItShows: "Dokumentet viser at møtet fant sted.",
  supportsSummary: "Støtter påstanden.",
  contradictsSummary: null,
  notDocumentedSummary: "Ingen deler er udokumentert.",
  conflictsBetweenEvidence: null,
  confidence: "high" as const,
  confidenceReasoning: "Klar dokumentasjon.",
  evidenceBreakdown: [{ documentId: "doc-1", verdict: "supports" as const, note: "Bekrefter møtet." }],
  timelineNote: null,
  corroborationNote: null,
};

describe("buildReportSections", () => {
  it("scenario: rapport med kun dokumenterte forhold", () => {
    const result = buildReportSections(
      baseInput({
        claims: [
          {
            id: "c1",
            text: "Vi møttes 3. mars.",
            noEvidenceConfirmedAt: null,
            evidenceDocumentIds: ["doc-1"],
            latestAssessment: wellDocumentedAssessment,
          },
        ],
        documents: [{ id: "doc-1", title: "E-post", occurredAtDate: "2026-03-03" }],
      })
    );

    const kinds = result.sections.map((s) => s.kind);
    expect(kinds).toContain("documented_findings");
    expect(kinds).not.toContain("partially_documented");
    expect(kinds).not.toContain("conflicts");
    expect(kinds).not.toContain("documentation_gaps");

    const findingsSection = result.sections.find((s) => s.kind === "documented_findings");
    expect(findingsSection?.kind).toBe("documented_findings");
    if (findingsSection?.kind === "documented_findings") {
      expect(findingsSection.findings[0].documentRefs[0].label).toBe("Dokument 1");
    }
  });

  it("scenario: rapport med både dokumenterte og udokumenterte påstander - udokumentert vises som hull, ikke egen liste", () => {
    const result = buildReportSections(
      baseInput({
        claims: [
          {
            id: "c1",
            text: "Dokumentert påstand.",
            noEvidenceConfirmedAt: null,
            evidenceDocumentIds: ["doc-1"],
            latestAssessment: wellDocumentedAssessment,
          },
          {
            id: "c2",
            text: "Udokumentert påstand.",
            noEvidenceConfirmedAt: null,
            evidenceDocumentIds: [],
            latestAssessment: null,
          },
        ],
        documents: [{ id: "doc-1", title: "E-post", occurredAtDate: null }],
        gaps: [{ type: "undocumented_claim", entityId: "c2", description: "«Udokumentert påstand.» er foreløpig ikke støttet av dokumentasjon." }],
      })
    );

    const kinds = result.sections.map((s) => s.kind);
    expect(kinds).toContain("documented_findings");
    expect(kinds).toContain("documentation_gaps");

    const gapsSection = result.sections.find((s) => s.kind === "documentation_gaps");
    if (gapsSection?.kind === "documentation_gaps") {
      expect(gapsSection.gaps).toHaveLength(1);
      expect(gapsSection.gaps[0].description).toContain("ikke støttet av dokumentasjon");
    }

    expect(result.builtFrom.undocumentedCount).toBe(1);
    expect(result.builtFrom.documentedCount).toBe(1);
  });

  it("scenario: rapport med konflikter - motstrid bevares, blir ikke løst", () => {
    const result = buildReportSections(
      baseInput({
        claims: [
          {
            id: "c1",
            text: "Brukeren oppgir 14. mars.",
            noEvidenceConfirmedAt: null,
            evidenceDocumentIds: ["doc-1"],
            latestAssessment: {
              ...wellDocumentedAssessment,
              status: "conflicting",
              conflictsBetweenEvidence: "Brukeren oppgir 14. mars. Anropsloggen viser 15. mars.",
            },
          },
        ],
        documents: [{ id: "doc-1", title: "Anrogslogg", occurredAtDate: "2026-03-15" }],
      })
    );

    const conflictsSection = result.sections.find((s) => s.kind === "conflicts");
    expect(conflictsSection?.kind).toBe("conflicts");
    if (conflictsSection?.kind === "conflicts") {
      expect(conflictsSection.findings[0].conflictsBetweenEvidence).toContain("14. mars");
      expect(conflictsSection.findings[0].conflictsBetweenEvidence).toContain("15. mars");
    }
  });

  it("scenario: rapport med vitner - skiller skriftlig erklæring fra kun brukerens opplysning", () => {
    const result = buildReportSections(
      baseInput({
        claims: [{ id: "c1", text: "Møtet fant sted.", noEvidenceConfirmedAt: null, evidenceDocumentIds: [], latestAssessment: null }],
        witnesses: [
          {
            id: "w1",
            name: "Kari Nordmann",
            identityStatus: "named",
            relationshipToCase: "Kollega",
            accounts: [
              { description: "Var til stede.", observationType: "direct", hasWrittenStatement: true, eventId: null, linkedClaimIds: ["c1"] },
            ],
          },
        ],
        gaps: [{ type: "undocumented_claim", entityId: "c1", description: "Ikke dokumentert." }],
      })
    );

    const witnessSection = result.sections.find((s) => s.kind === "witnesses");
    expect(witnessSection?.kind).toBe("witnesses");
    if (witnessSection?.kind === "witnesses") {
      expect(witnessSection.witnesses[0].accounts[0].hasWrittenStatement).toBe(true);
      expect(witnessSection.witnesses[0].accounts[0].linkedClaimTexts).toEqual(["Møtet fant sted."]);
    }
  });

  it("scenario: rapport med dokumentasjonshull inkl. bekreftet-ingen-mer-dokumentasjon-telling", () => {
    const result = buildReportSections(
      baseInput({
        claims: [
          { id: "c1", text: "Uten dokumentasjon, bekreftet.", noEvidenceConfirmedAt: "2026-03-01T00:00:00Z", evidenceDocumentIds: [], latestAssessment: null },
        ],
        gaps: [],
      })
    );

    const gapsSection = result.sections.find((s) => s.kind === "documentation_gaps");
    expect(gapsSection?.kind).toBe("documentation_gaps");
    if (gapsSection?.kind === "documentation_gaps") {
      expect(gapsSection.confirmedNoEvidenceCount).toBe(1);
      expect(gapsSection.gaps).toHaveLength(0);
    }
  });

  it("scenario: ukjent dato vises tydelig, ikke falsk presisjon", () => {
    const result = buildReportSections(
      baseInput({
        events: [
          { id: "e1", title: "Ukjent hendelse", description: null, eventDate: null, eventTime: null, datePrecision: "unknown", approximateLabel: null, documentIds: [] },
          { id: "e2", title: "Kjent hendelse", description: null, eventDate: "2026-03-01", eventTime: null, datePrecision: "date_only", approximateLabel: null, documentIds: [] },
        ],
      })
    );

    const timeline = result.sections.find((s) => s.kind === "timeline");
    expect(timeline?.kind).toBe("timeline");
    if (timeline?.kind === "timeline") {
      // Ukjent dato skal alltid sorteres sist, aldri først.
      expect(timeline.entries[timeline.entries.length - 1].eventId).toBe("e1");
      expect(timeline.entries[timeline.entries.length - 1].datePrecision).toBe("unknown");
      expect(timeline.entries[timeline.entries.length - 1].dateLabel).not.toMatch(/^\d/);
    }
  });

  it("scenario: dokumentreferanser er stabile og konsekvente gjennom rapporten", () => {
    const result = buildReportSections(
      baseInput({
        claims: [
          { id: "c1", text: "Påstand A", noEvidenceConfirmedAt: null, evidenceDocumentIds: ["doc-2"], latestAssessment: { ...wellDocumentedAssessment, evidenceBreakdown: [{ documentId: "doc-2", verdict: "supports", note: "" }] } },
        ],
        events: [{ id: "e1", title: "Hendelse", description: null, eventDate: "2026-03-01", eventTime: null, datePrecision: "date_only", approximateLabel: null, documentIds: ["doc-2"] }],
        documents: [
          { id: "doc-1", title: "Første dokument", occurredAtDate: null },
          { id: "doc-2", title: "Andre dokument", occurredAtDate: "2026-03-01" },
        ],
      })
    );

    expect(result.documentRefs).toEqual([
      { documentId: "doc-1", label: "Dokument 1", title: "Første dokument" },
      { documentId: "doc-2", label: "Dokument 2", title: "Andre dokument" },
    ]);

    const findingsSection = result.sections.find((s) => s.kind === "documented_findings");
    const timelineSection = result.sections.find((s) => s.kind === "timeline");

    if (findingsSection?.kind === "documented_findings" && timelineSection?.kind === "timeline") {
      // Samme dokument skal ha SAMME label uansett hvilken seksjon det refereres fra.
      expect(findingsSection.findings[0].documentRefs[0].label).toBe("Dokument 2");
      expect(timelineSection.entries[0].documentRefs[0].label).toBe("Dokument 2");
    }
  });

  it("tomme seksjoner skal ikke vises", () => {
    const result = buildReportSections(baseInput());
    expect(result.sections).toEqual([]);
  });
});

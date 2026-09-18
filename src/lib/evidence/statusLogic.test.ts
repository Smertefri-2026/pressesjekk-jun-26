import { describe, expect, it } from "vitest";
import {
  deriveDeterministicStatus,
  deriveDisplayStatus,
  summarizeEvidenceBreakdown,
  findStatusInconsistency,
  statusLabel,
  confidenceLabel,
} from "./statusLogic";
import type { EvidenceBreakdownItem } from "./types";

describe("deriveDeterministicStatus", () => {
  it("scenario: én påstand uten dokumentasjon -> undocumented, uten KI-kall", () => {
    expect(deriveDeterministicStatus(0)).toBe("undocumented");
  });

  it("scenario: én påstand med ett dokument -> krever faktisk vurdering (null)", () => {
    expect(deriveDeterministicStatus(1)).toBeNull();
  });

  it("scenario: én påstand med flere dokumenter -> krever fortsatt faktisk vurdering", () => {
    expect(deriveDeterministicStatus(4)).toBeNull();
  });
});

describe("deriveDisplayStatus", () => {
  it("er alltid 'undocumented' uten koblet dokumentasjon, uansett tidligere vurdering", () => {
    expect(deriveDisplayStatus(0, "well_documented")).toBe("undocumented");
  });

  it("er 'not_assessed' når dokumentasjon finnes men ingen KI-vurdering er kjørt", () => {
    expect(deriveDisplayStatus(2, null)).toBe("not_assessed");
  });

  it("bruker siste KI-vurdering når dokumentasjon og vurdering begge finnes", () => {
    expect(deriveDisplayStatus(1, "conflicting")).toBe("conflicting");
  });
});

describe("summarizeEvidenceBreakdown", () => {
  it("scenario: støttende dokumentasjon", () => {
    const breakdown: EvidenceBreakdownItem[] = [
      { documentId: "d1", verdict: "supports", note: "Bekrefter datoen." },
      { documentId: "d2", verdict: "supports", note: "Bekrefter innholdet." },
    ];

    const summary = summarizeEvidenceBreakdown(breakdown);

    expect(summary.supportsCount).toBe(2);
    expect(summary.contradictsCount).toBe(0);
    expect(summary.hasConflict).toBe(false);
  });

  it("scenario: motstridende dokumentasjon", () => {
    const breakdown: EvidenceBreakdownItem[] = [
      { documentId: "d1", verdict: "supports", note: "Støtter tidspunktet." },
      { documentId: "d2", verdict: "contradicts", note: "Oppgir et annet tidspunkt." },
    ];

    const summary = summarizeEvidenceBreakdown(breakdown);

    expect(summary.contradictsCount).toBe(1);
    expect(summary.hasConflict).toBe(true);
  });

  it("scenario: flere dokumenter der ingen sier noe om påstanden (silent)", () => {
    const breakdown: EvidenceBreakdownItem[] = [
      { documentId: "d1", verdict: "silent", note: "Gjelder et annet forhold." },
      { documentId: "d2", verdict: "silent", note: "Ikke relevant for denne påstanden." },
    ];

    const summary = summarizeEvidenceBreakdown(breakdown);

    expect(summary.supportsCount).toBe(0);
    expect(summary.silentCount).toBe(2);
    expect(summary.hasConflict).toBe(false);
  });

  it("scenario: ett dokument kan opptre i flere uavhengige påstanders vurderinger", () => {
    const sharedDocumentId = "doc-shared";

    const claimOneBreakdown: EvidenceBreakdownItem[] = [
      { documentId: sharedDocumentId, verdict: "supports", note: "Støtter påstand 1." },
    ];
    const claimTwoBreakdown: EvidenceBreakdownItem[] = [
      { documentId: sharedDocumentId, verdict: "contradicts", note: "Motsier påstand 2." },
    ];

    // Samme dokument kan ha ulik bevisvekt for ulike påstander - det er
    // ikke en selvmotsigelse, det er nøyaktig hvorfor koblingen ligger på
    // claim_evidence_links og ikke som en global egenskap på dokumentet.
    expect(summarizeEvidenceBreakdown(claimOneBreakdown).supportsCount).toBe(1);
    expect(summarizeEvidenceBreakdown(claimTwoBreakdown).contradictsCount).toBe(1);
  });
});

describe("findStatusInconsistency", () => {
  it("flagger 'well_documented' uten noen støttende dokumenter", () => {
    const breakdown: EvidenceBreakdownItem[] = [
      { documentId: "d1", verdict: "silent", note: "Ikke relevant." },
    ];

    expect(findStatusInconsistency("well_documented", breakdown)).not.toBeNull();
  });

  it("flagger 'undocumented' når det faktisk finnes vurderte dokumenter", () => {
    const breakdown: EvidenceBreakdownItem[] = [
      { documentId: "d1", verdict: "supports", note: "Støtter." },
    ];

    expect(findStatusInconsistency("undocumented", breakdown)).not.toBeNull();
  });

  it("godtar konsistent 'well_documented'", () => {
    const breakdown: EvidenceBreakdownItem[] = [
      { documentId: "d1", verdict: "supports", note: "Støtter." },
    ];

    expect(findStatusInconsistency("well_documented", breakdown)).toBeNull();
  });

  it("godtar konsistent 'conflicting'", () => {
    const breakdown: EvidenceBreakdownItem[] = [
      { documentId: "d1", verdict: "supports", note: "Støtter." },
      { documentId: "d2", verdict: "contradicts", note: "Motsier." },
    ];

    expect(findStatusInconsistency("conflicting", breakdown)).toBeNull();
  });
});

describe("statusLabel / confidenceLabel", () => {
  it("gir norske etiketter for alle statuser brukt i UI-eksempelet", () => {
    expect(statusLabel("well_documented")).toBe("Godt dokumentert");
    expect(statusLabel("partially_documented")).toBe("Delvis dokumentert");
    expect(statusLabel("conflicting")).toBe("Motstridende dokumentasjon");
    expect(statusLabel("undocumented")).toBe("Ikke dokumentert");
    expect(statusLabel("not_assessed")).toBe("Ikke vurdert");
  });

  it("bruker kategorisk sikkerhet, ikke prosent", () => {
    expect(confidenceLabel("high")).toBe("Høy");
    expect(confidenceLabel("medium")).toBe("Middels");
    expect(confidenceLabel("low")).toBe("Lav");
  });
});

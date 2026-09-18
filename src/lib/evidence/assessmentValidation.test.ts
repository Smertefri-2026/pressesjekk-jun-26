import { describe, expect, it } from "vitest";
import { validateAssessmentPayload } from "./assessmentValidation";

const validDocIds = ["doc-1", "doc-2"];

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    what_it_shows: "Dokumentet viser en e-postkorrespondanse datert 14. mars.",
    supports_summary: "Bekrefter at kontakt fant sted 14. mars.",
    contradicts_summary: null,
    not_documented_summary: "Dokumenterer ikke hva som ble sagt muntlig i telefonsamtalen.",
    conflicts_between_evidence: null,
    status: "partially_documented",
    confidence: "medium",
    confidence_reasoning: "E-posten bekrefter kontakt, men ikke innholdet i selve samtalen.",
    evidence_breakdown: [
      { document_id: "doc-1", verdict: "supports", note: "Bekrefter kontaktdato." },
    ],
    ...overrides,
  };
}

describe("validateAssessmentPayload", () => {
  it("godtar et korrekt formet svar", () => {
    const result = validateAssessmentPayload(validPayload(), validDocIds);
    expect(result).not.toBeNull();
    expect(result?.status).toBe("partially_documented");
    expect(result?.evidenceBreakdown).toHaveLength(1);
  });

  it("avviser svar uten what_it_shows", () => {
    const payload = validPayload();
    delete (payload as Record<string, unknown>).what_it_shows;
    expect(validateAssessmentPayload(payload, validDocIds)).toBeNull();
  });

  it("avviser ugyldig status-verdi (KI kan ikke finne på en ny statuskategori)", () => {
    const result = validateAssessmentPayload(
      validPayload({ status: "probably_fine" }),
      validDocIds
    );
    expect(result).toBeNull();
  });

  it("avviser prosent-basert sikkerhet - kun høy/middels/lav er gyldig", () => {
    const result = validateAssessmentPayload(
      validPayload({ confidence: "73%" }),
      validDocIds
    );
    expect(result).toBeNull();
  });

  it("filtrerer bort evidence_breakdown-oppføringer som refererer til dokument-ID-er som ikke var del av vurderingsgrunnlaget (hallusinert ID)", () => {
    const result = validateAssessmentPayload(
      validPayload({
        evidence_breakdown: [
          { document_id: "doc-1", verdict: "supports", note: "Ekte dokument." },
          { document_id: "doc-does-not-exist", verdict: "supports", note: "Hallusinert." },
        ],
      }),
      validDocIds
    );

    expect(result?.evidenceBreakdown).toHaveLength(1);
    expect(result?.evidenceBreakdown[0]?.documentId).toBe("doc-1");
  });

  it("filtrerer bort breakdown-oppføringer med ugyldig verdict i stedet for å avvise hele svaret", () => {
    const result = validateAssessmentPayload(
      validPayload({
        evidence_breakdown: [
          { document_id: "doc-1", verdict: "probably_supports", note: "Ugyldig verdict." },
          { document_id: "doc-2", verdict: "contradicts", note: "Gyldig." },
        ],
      }),
      validDocIds
    );

    expect(result?.evidenceBreakdown).toHaveLength(1);
    expect(result?.evidenceBreakdown[0]?.verdict).toBe("contradicts");
  });

  it("scenario: flere dokumenter kan samlet vurderes for én påstand", () => {
    const result = validateAssessmentPayload(
      validPayload({
        status: "well_documented",
        evidence_breakdown: [
          { document_id: "doc-1", verdict: "supports", note: "E-post 1 bekrefter." },
          { document_id: "doc-2", verdict: "supports", note: "E-post 2 bekrefter samme forhold." },
        ],
      }),
      validDocIds
    );

    expect(result?.evidenceBreakdown).toHaveLength(2);
    expect(result?.evidenceBreakdown.every((item) => item.verdict === "supports")).toBe(true);
  });

  it("scenario: to dokumenter kan motsi hverandre - konflikt skjules aldri", () => {
    const result = validateAssessmentPayload(
      validPayload({
        status: "conflicting",
        contradicts_summary: "Dokument 2 oppgir en annen dato enn dokument 1.",
        conflicts_between_evidence:
          "E-post datert 14. mars og kalenderoppføring datert 15. mars motsier hverandre.",
        evidence_breakdown: [
          { document_id: "doc-1", verdict: "supports", note: "Oppgir 14. mars." },
          { document_id: "doc-2", verdict: "contradicts", note: "Oppgir 15. mars." },
        ],
      }),
      validDocIds
    );

    expect(result?.status).toBe("conflicting");
    expect(result?.conflictsBetweenEvidence).toContain("motsier hverandre");
  });

  it("avviser helt tomt/feil input uten å kaste feil", () => {
    expect(validateAssessmentPayload(null, validDocIds)).toBeNull();
    expect(validateAssessmentPayload("streng", validDocIds)).toBeNull();
    expect(validateAssessmentPayload(undefined, validDocIds)).toBeNull();
    expect(validateAssessmentPayload([], validDocIds)).toBeNull();
  });

  it("fase 2A: godtar et svar uten timeline_note (bakoverkompatibelt med fase 1-kall)", () => {
    const result = validateAssessmentPayload(validPayload(), validDocIds);
    expect(result?.timelineNote).toBeNull();
  });

  it("fase 2A: tar med timeline_note når hendelser var del av grunnlaget", () => {
    const result = validateAssessmentPayload(
      validPayload({
        timeline_note:
          "E-posten 13. mars ble sendt to dager før publiseringen 15. mars, noe som er forenlig med påstanden.",
      }),
      validDocIds
    );

    expect(result?.timelineNote).toContain("forenlig med");
  });

  it("håndterer manglende evidence_breakdown-felt som tom liste, ikke feil", () => {
    const payload = validPayload();
    delete (payload as Record<string, unknown>).evidence_breakdown;
    const result = validateAssessmentPayload(payload, validDocIds);
    expect(result?.evidenceBreakdown).toEqual([]);
  });

  describe("fase 2B: vitner og korroborasjon", () => {
    const validWitnessIds = ["wa-1", "wa-2"];

    it("scenario: vitne koblet til påstand - havner i witness_breakdown, ikke evidence_breakdown", () => {
      const result = validateAssessmentPayload(
        validPayload({
          witness_breakdown: [
            { witness_account_id: "wa-1", verdict: "supports", note: "Så samtalen finne sted.", observation_type: "direct" },
          ],
        }),
        validDocIds,
        validWitnessIds
      );

      expect(result?.witnessBreakdown).toHaveLength(1);
      expect(result?.witnessBreakdown[0]?.witnessAccountId).toBe("wa-1");
      expect(result?.evidenceBreakdown).toHaveLength(1); // uendret, kun det ekte dokumentet
    });

    it("skiller direkte observasjon fra annenhåndsinformasjon", () => {
      const result = validateAssessmentPayload(
        validPayload({
          witness_breakdown: [
            { witness_account_id: "wa-1", verdict: "supports", note: "Var til stede.", observation_type: "direct" },
            { witness_account_id: "wa-2", verdict: "supports", note: "Hørte det fra andre.", observation_type: "secondhand" },
          ],
        }),
        validDocIds,
        validWitnessIds
      );

      expect(result?.witnessBreakdown[0]?.observationType).toBe("direct");
      expect(result?.witnessBreakdown[1]?.observationType).toBe("secondhand");
    });

    it("scenario: motstrid mellom vitne og dokument - fanges i witness_breakdown sin verdict", () => {
      const result = validateAssessmentPayload(
        validPayload({
          status: "conflicting",
          witness_breakdown: [
            { witness_account_id: "wa-1", verdict: "contradicts", note: "Vitnet oppgir et annet tidspunkt enn dokumentet.", observation_type: "direct" },
          ],
        }),
        validDocIds,
        validWitnessIds
      );

      expect(result?.witnessBreakdown[0]?.verdict).toBe("contradicts");
    });

    it("hallusinert vitne-ID filtreres bort", () => {
      const result = validateAssessmentPayload(
        validPayload({
          witness_breakdown: [
            { witness_account_id: "wa-does-not-exist", verdict: "supports", note: "Hallusinert.", observation_type: "direct" },
          ],
        }),
        validDocIds,
        validWitnessIds
      );

      expect(result?.witnessBreakdown).toEqual([]);
    });

    it("en witness_breakdown-oppføring med en dokument-ID godtas ikke som vitne (streng atskillelse)", () => {
      const result = validateAssessmentPayload(
        validPayload({
          witness_breakdown: [
            { witness_account_id: "doc-1", verdict: "supports", note: "Feil ID-type.", observation_type: "direct" },
          ],
        }),
        validDocIds,
        validWitnessIds
      );

      expect(result?.witnessBreakdown).toEqual([]);
    });

    it("scenario: flere uavhengige kilder som støtter samme forhold - corroboration_note tas med", () => {
      const result = validateAssessmentPayload(
        validPayload({
          corroboration_note:
            "Flere uavhengige opplysninger (e-post, anropslogg og et vitne) støtter at samtalen fant sted.",
        }),
        validDocIds,
        validWitnessIds
      );

      expect(result?.corroborationNote).toContain("uavhengige");
      expect(result?.corroborationNote).not.toMatch(/beviser/i);
    });

    it("bakoverkompatibel: fungerer uten witness-parameter (fase 1/2A-kall)", () => {
      const result = validateAssessmentPayload(validPayload(), validDocIds);
      expect(result?.witnessBreakdown).toEqual([]);
      expect(result?.corroborationNote).toBeNull();
    });
  });
});

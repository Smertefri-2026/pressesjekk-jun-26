import { describe, expect, it } from "vitest";
import { validateReportAiPayload } from "./reportValidation";

const validDocumentIds = ["doc-1", "doc-2"];
const validRuleIds = ["vvp-4-1", "vvp-3-2"];

describe("validateReportAiPayload", () => {
  it("scenario: gyldig KI-svar med regelverk og dokumentreferanser godtas", () => {
    const result = validateReportAiPayload(
      {
        summary: "Saken har delvis dokumentasjon.",
        background: "Brukeren opplyser at journalisten ringte 3. mars.",
        legal_assessment: [
          { rule_id: "vvp-4-1", commentary: "Kan være relevant her.", related_document_ids: ["doc-1"] },
        ],
        conclusion: "Neste steg er å innhente mer dokumentasjon.",
      },
      validDocumentIds,
      validRuleIds
    );

    expect(result).not.toBeNull();
    expect(result?.legalAssessment).toHaveLength(1);
    expect(result?.legalAssessment[0].documentIds).toEqual(["doc-1"]);
  });

  it("hallusinert dokument-ID skal avvises (enkeltvis, resten av punktet beholdes)", () => {
    const result = validateReportAiPayload(
      {
        summary: "Sammendrag.",
        background: "",
        legal_assessment: [
          { rule_id: "vvp-4-1", commentary: "Kommentar.", related_document_ids: ["doc-1", "doc-does-not-exist"] },
        ],
        conclusion: "Konklusjon.",
      },
      validDocumentIds,
      validRuleIds
    );

    expect(result?.legalAssessment[0].documentIds).toEqual(["doc-1"]);
    expect(result?.legalAssessment[0].documentIds).not.toContain("doc-does-not-exist");
  });

  it("hallusinert regelverks-ID gjør at hele punktet forkastes", () => {
    const result = validateReportAiPayload(
      {
        summary: "Sammendrag.",
        background: "",
        legal_assessment: [
          { rule_id: "oppdiktet-regel-id", commentary: "Kommentar.", related_document_ids: [] },
          { rule_id: "vvp-3-2", commentary: "Gyldig kommentar.", related_document_ids: [] },
        ],
        conclusion: "Konklusjon.",
      },
      validDocumentIds,
      validRuleIds
    );

    expect(result?.legalAssessment).toHaveLength(1);
    expect(result?.legalAssessment[0].ruleId).toBe("vvp-3-2");
  });

  it("tom legal_assessment-liste er et gyldig svar", () => {
    const result = validateReportAiPayload(
      { summary: "Sammendrag.", background: "", legal_assessment: [], conclusion: "Konklusjon." },
      validDocumentIds,
      validRuleIds
    );

    expect(result?.legalAssessment).toEqual([]);
  });

  it("avviser helt feil struktur eller manglende påkrevde felt", () => {
    expect(validateReportAiPayload(null, validDocumentIds, validRuleIds)).toBeNull();
    expect(validateReportAiPayload("tekst", validDocumentIds, validRuleIds)).toBeNull();
    expect(validateReportAiPayload({ summary: "", conclusion: "X" }, validDocumentIds, validRuleIds)).toBeNull();
    expect(validateReportAiPayload({ summary: "X" }, validDocumentIds, validRuleIds)).toBeNull();
  });

  it("dropper ufullstendige legal_assessment-punkter uten å forkaste hele svaret", () => {
    const result = validateReportAiPayload(
      {
        summary: "Sammendrag.",
        background: "",
        legal_assessment: [{ rule_id: "vvp-4-1" }, { commentary: "Uten rule_id" }],
        conclusion: "Konklusjon.",
      },
      validDocumentIds,
      validRuleIds
    );

    expect(result).not.toBeNull();
    expect(result?.legalAssessment).toEqual([]);
  });
});

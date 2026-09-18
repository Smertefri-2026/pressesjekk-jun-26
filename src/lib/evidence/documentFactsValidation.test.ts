import { describe, expect, it } from "vitest";
import { validateDocumentFactsPayload } from "./documentFactsValidation";

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    document_kind: "email",
    summary: "E-post fra journalist til bruker, sendt 13. mars 2026.",
    occurred_at_date: "2026-03-13",
    occurred_at_time: "14:05",
    date_confidence: "high",
    date_note: "Hentet fra e-postens sendt-tidspunkt.",
    structured_facts: {
      sender: { value: "journalist@avis.no", confidence: "high" },
      recipient: { value: "bruker@epost.no", confidence: "high" },
      subject: { value: "Spørsmål til sak", confidence: "medium" },
    },
    source_characteristics: ["contemporaneous", "original_file"],
    source_characteristics_note: "Dette er en e-post sendt samtidig med hendelsen.",
    likely_event_description: "Journalisten sender spørsmål til bruker.",
    ...overrides,
  };
}

describe("validateDocumentFactsPayload", () => {
  it("godtar et korrekt formet svar for en e-post", () => {
    const result = validateDocumentFactsPayload(validPayload());
    expect(result).not.toBeNull();
    expect(result?.documentKind).toBe("email");
    expect(result?.structuredFacts.sender?.value).toBe("journalist@avis.no");
  });

  it("krever summary - avviser ellers hele svaret", () => {
    const payload = validPayload();
    delete (payload as Record<string, unknown>).summary;
    expect(validateDocumentFactsPayload(payload)).toBeNull();
  });

  it("scenario: dokumentfakta med manglende metadata (avsender ukjent) - degraderer, forkaster ikke", () => {
    const result = validateDocumentFactsPayload(
      validPayload({
        structured_facts: {
          recipient: { value: "bruker@epost.no", confidence: "high" },
          // sender mangler helt
        },
      })
    );

    expect(result).not.toBeNull();
    expect(result?.structuredFacts.sender).toBeUndefined();
    expect(result?.structuredFacts.recipient?.value).toBe("bruker@epost.no");
  });

  it("scenario: usikker dato nedgraderes til lav sikkerhet i stedet for å forkastes", () => {
    const result = validateDocumentFactsPayload(
      validPayload({ occurred_at_date: "2026-03-13", date_confidence: "not-a-real-value" })
    );

    expect(result?.occurredAtDate).toBe("2026-03-13");
    expect(result?.dateConfidence).toBe("low");
  });

  it("ugyldig dato nulles ut i stedet for å lagres feilaktig", () => {
    const result = validateDocumentFactsPayload(
      validPayload({ occurred_at_date: "ikke en dato", occurred_at_time: "25:99" })
    );

    expect(result?.occurredAtDate).toBeNull();
    expect(result?.occurredAtTime).toBeNull();
    expect(result?.dateConfidence).toBeNull();
  });

  it("faller tilbake til 'unknown' for ugyldig document_kind i stedet for å forkastes", () => {
    const result = validateDocumentFactsPayload(validPayload({ document_kind: "spreadsheet" }));
    expect(result?.documentKind).toBe("unknown");
  });

  it("filtrerer bort ukjente kildeegenskaper uten å forkaste resten", () => {
    const result = validateDocumentFactsPayload(
      validPayload({ source_characteristics: ["contemporaneous", "definitely_true", "signed"] })
    );

    expect(result?.sourceCharacteristics).toEqual(["contemporaneous", "signed"]);
  });

  it("degraderer strukturerte fakta uten gyldig confidence til 'low' i stedet for å slette dem", () => {
    const result = validateDocumentFactsPayload(
      validPayload({
        structured_facts: {
          subject: { value: "Emne uten oppgitt sikkerhet" },
        },
      })
    );

    expect(result?.structuredFacts.subject?.confidence).toBe("low");
  });

  it("scenario: avtaledokument med signaturstatus og parter", () => {
    const result = validateDocumentFactsPayload({
      document_kind: "agreement",
      summary: "Avtale mellom to parter, fremstår signert.",
      structured_facts: {
        parties: { value: ["Part A", "Part B"], confidence: "high" },
        signature_status: { value: "signed", confidence: "medium" },
        key_terms: { value: ["Frist: 30 dager"], confidence: "low" },
      },
      source_characteristics: ["signed", "original_file"],
    });

    expect(result?.documentKind).toBe("agreement");
    expect(result?.structuredFacts.parties?.value).toEqual(["Part A", "Part B"]);
  });

  it("scenario: artikkel med byline og publiseringsdato", () => {
    const result = validateDocumentFactsPayload({
      document_kind: "article",
      summary: "Publisert artikkel om saken.",
      occurred_at_date: "2026-03-15",
      date_confidence: "high",
      structured_facts: {
        publication: { value: "Avisa X", confidence: "high" },
        byline: { value: "Ola Journalist", confidence: "medium" },
      },
      source_characteristics: ["public_document"],
    });

    expect(result?.documentKind).toBe("article");
    expect(result?.occurredAtDate).toBe("2026-03-15");
  });

  it("avviser helt ugyldig input uten å kaste feil", () => {
    expect(validateDocumentFactsPayload(null)).toBeNull();
    expect(validateDocumentFactsPayload("tekst")).toBeNull();
    expect(validateDocumentFactsPayload([])).toBeNull();
  });
});

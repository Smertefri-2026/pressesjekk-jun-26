import { describe, expect, it } from "vitest";
import {
  formatEventDate,
  compareEventsChronologically,
  detectDateConflict,
} from "./dateFacts";

describe("formatEventDate", () => {
  it("formaterer eksakt dato og klokkeslett", () => {
    const label = formatEventDate({
      eventDate: "2026-03-14",
      eventTime: "13:30:00",
      datePrecision: "exact",
      approximateLabel: null,
    });

    expect(label).toBe("14. mars 2026 kl. 13:30");
  });

  it("formaterer kun dato uten klokkeslett", () => {
    const label = formatEventDate({
      eventDate: "2026-03-15",
      eventTime: null,
      datePrecision: "date_only",
      approximateLabel: null,
    });

    expect(label).toBe("15. mars 2026");
  });

  it("scenario: usikker/omtrentlig dato bruker brukerens egen beskrivelse", () => {
    const label = formatEventDate({
      eventDate: null,
      eventTime: null,
      datePrecision: "approximate",
      approximateLabel: "midt i mars 2026",
    });

    expect(label).toBe("midt i mars 2026");
  });

  it("scenario: helt ukjent dato", () => {
    const label = formatEventDate({
      eventDate: null,
      eventTime: null,
      datePrecision: "unknown",
      approximateLabel: null,
    });

    expect(label).toBe("Ukjent tidspunkt");
  });

  it("bruker fallback-tekst for omtrentlig dato uten egen beskrivelse", () => {
    const label = formatEventDate({
      eventDate: "2026-03-01",
      eventTime: null,
      datePrecision: "approximate",
      approximateLabel: null,
    });

    expect(label).toBe("Omtrent 1. mars 2026");
  });
});

describe("compareEventsChronologically", () => {
  it("sorterer hendelser i kronologisk rekkefølge", () => {
    const events = [
      { eventDate: "2026-03-15", eventTime: null, datePrecision: "date_only" as const, approximateLabel: null, createdAt: "2026-01-01", label: "publisering" },
      { eventDate: "2026-03-12", eventTime: null, datePrecision: "date_only" as const, approximateLabel: null, createdAt: "2026-01-01", label: "spørsmål" },
      { eventDate: "2026-03-13", eventTime: null, datePrecision: "date_only" as const, approximateLabel: null, createdAt: "2026-01-01", label: "e-post" },
    ];

    const sorted = [...events].sort(compareEventsChronologically);
    expect(sorted.map((e) => e.label)).toEqual(["spørsmål", "e-post", "publisering"]);
  });

  it("plasserer hendelser uten dato sist, ikke først", () => {
    const events = [
      { eventDate: null, eventTime: null, datePrecision: "unknown" as const, approximateLabel: null, createdAt: "2026-01-01", label: "ukjent" },
      { eventDate: "2026-03-12", eventTime: null, datePrecision: "date_only" as const, approximateLabel: null, createdAt: "2026-01-01", label: "kjent" },
    ];

    const sorted = [...events].sort(compareEventsChronologically);
    expect(sorted.map((e) => e.label)).toEqual(["kjent", "ukjent"]);
  });

  it("bruker klokkeslett som sekundær sortering samme dag", () => {
    const events = [
      { eventDate: "2026-03-14", eventTime: "15:00:00", datePrecision: "exact" as const, approximateLabel: null, createdAt: "2026-01-01", label: "sen" },
      { eventDate: "2026-03-14", eventTime: "09:00:00", datePrecision: "exact" as const, approximateLabel: null, createdAt: "2026-01-01", label: "tidlig" },
    ];

    const sorted = [...events].sort(compareEventsChronologically);
    expect(sorted.map((e) => e.label)).toEqual(["tidlig", "sen"]);
  });
});

describe("detectDateConflict", () => {
  it("scenario: motstridende datoer mellom to kilder", () => {
    const result = detectDateConflict([
      { label: "Hendelsen", date: "2026-03-14" },
      { label: "E-post-dokument", date: "2026-03-15" },
    ]);

    expect(result.hasConflict).toBe(true);
    expect(result.distinctDates).toEqual(["2026-03-14", "2026-03-15"]);
  });

  it("ingen konflikt når alle kilder er enige", () => {
    const result = detectDateConflict([
      { label: "Hendelsen", date: "2026-03-14" },
      { label: "E-post-dokument", date: "2026-03-14" },
    ]);

    expect(result.hasConflict).toBe(false);
  });

  it("ignorerer kilder uten dato i stedet for å telle dem som en konflikt", () => {
    const result = detectDateConflict([
      { label: "Hendelsen", date: "2026-03-14" },
      { label: "Dokument uten utledet dato", date: null },
    ]);

    expect(result.hasConflict).toBe(false);
    expect(result.distinctDates).toEqual(["2026-03-14"]);
  });

  it("håndterer flere dokumenter som støtter samme hendelse uten falsk konflikt", () => {
    const result = detectDateConflict([
      { label: "Hendelsen", date: "2026-03-14" },
      { label: "Dokument 1", date: "2026-03-14" },
      { label: "Dokument 2", date: "2026-03-14" },
    ]);

    expect(result.hasConflict).toBe(false);
  });
});

import type { DatePrecision } from "./types";

export type EventDateInput = {
  eventDate: string | null;
  eventTime: string | null;
  datePrecision: DatePrecision;
  approximateLabel: string | null;
};

const MONTHS = [
  "januar", "februar", "mars", "april", "mai", "juni",
  "juli", "august", "september", "oktober", "november", "desember",
];

function formatNorwegianDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return `${day}. ${MONTHS[month - 1]} ${year}`;
}

/**
 * Tidslinjen skal fungere med eksakt dato+klokkeslett, kun dato, omtrent
 * tidspunkt, eller helt ukjent dato - dette er eneste sted formatteringen
 * for de fire tilfellene avgjøres, slik at UI og eventuelle fremtidige
 * rapportmaler alltid viser samme tekst for samme presisjon.
 */
export function formatEventDate(event: EventDateInput): string {
  if (event.datePrecision === "unknown" || !event.eventDate) {
    return event.approximateLabel || "Ukjent tidspunkt";
  }

  const dateLabel = formatNorwegianDate(event.eventDate);

  if (event.datePrecision === "approximate") {
    return event.approximateLabel ? `${event.approximateLabel}` : `Omtrent ${dateLabel}`;
  }

  if (event.datePrecision === "exact" && event.eventTime) {
    return `${dateLabel} kl. ${event.eventTime.slice(0, 5)}`;
  }

  return dateLabel;
}

/**
 * Sorterer hendelser kronologisk. Hendelser uten dato (ukjent tidspunkt)
 * havner alltid sist, ikke først - en ukjent dato er ikke "tidligst".
 */
export function compareEventsChronologically<T extends EventDateInput & { createdAt: string }>(
  a: T,
  b: T
): number {
  if (!a.eventDate && !b.eventDate) return a.createdAt.localeCompare(b.createdAt);
  if (!a.eventDate) return 1;
  if (!b.eventDate) return -1;

  const dateCompare = a.eventDate.localeCompare(b.eventDate);
  if (dateCompare !== 0) return dateCompare;

  if (a.eventTime && b.eventTime) return a.eventTime.localeCompare(b.eventTime);
  if (a.eventTime) return -1;
  if (b.eventTime) return 1;

  return a.createdAt.localeCompare(b.createdAt);
}

export type DateFactSource = {
  /** Menneskelesbar kilde, f.eks. "Hendelsen" eller et dokumenttittel. */
  label: string;
  date: string | null;
};

export type DateConflictResult = {
  hasConflict: boolean;
  distinctDates: string[];
};

/**
 * Rent, deterministisk konfliktsjekk: flagger når to eller flere kilder
 * (en hendelses satte dato, eller et koblet dokuments utledede dato) oppgir
 * ULIKE datoer for det som skal være samme hendelse. Sier ingenting om
 * HVEM som har rett - kun at det finnes en uoverensstemmelse KI/UI bør vise
 * fram, aldri skjule.
 */
export function detectDateConflict(sources: DateFactSource[]): DateConflictResult {
  const distinctDates = Array.from(
    new Set(sources.map((source) => source.date).filter((date): date is string => Boolean(date)))
  ).sort();

  return {
    hasConflict: distinctDates.length > 1,
    distinctDates,
  };
}

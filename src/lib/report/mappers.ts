import type { ReportBuiltFrom, ReportSection } from "./types";

/**
 * Rapporttyper som faktisk finnes i produksjon. `police_draft` og
 * `investigation_draft` mangler en sporet migrasjon som utvider
 * `case_reports.report_type`-constrainten i supabase/schema-v1.sql - se
 * Fase 6.3-sluttrapporten for detaljer. Typen her følger faktisk bruk, ikke
 * det sporede skjemaet.
 */
export type ReportType =
  | "free_check"
  | "full_report"
  | "pfu_draft"
  | "police_draft"
  | "investigation_draft";

export type ReportStatus = "draft" | "ready" | "archived";

/** Kanonisk rad-form for `case_reports`. Sidefiler som kun henter et utvalg
 * kolonner bruker `Pick<CaseReportRow, ...>` fremfor å redefinere typen. */
export type CaseReportRow = {
  id: string;
  case_id: string;
  version: number;
  report_type: ReportType;
  status: ReportStatus;
  summary: string | null;
  findings: string[] | null;
  recommendations: string[] | null;
  pfu_draft: string | null;
  police_draft: string | null;
  investigation_draft: string | null;
  sections: unknown;
  built_from: unknown;
  report_kind: string | null;
  created_at: string;
};

/**
 * `sections`/`built_from` er 100 % kodegenerert av assembleReportSections
 * før lagring (aldri rå KI-output) - normaliseringen her er derfor kun et
 * forsvar mot skjemadrift/manuell databaseredigering, ikke mot
 * hallusinasjon (den valideringen skjer allerede i reportValidation før
 * lagring).
 */
export function normalizeReportSections(value: unknown): ReportSection[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is ReportSection => Boolean(entry) && typeof entry === "object" && typeof (entry as { kind?: unknown }).kind === "string");
}

export function normalizeBuiltFrom(value: unknown): ReportBuiltFrom | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.generatedAt !== "string") return null;
  return value as ReportBuiltFrom;
}

export type MappedCaseReport = {
  id: string;
  caseId: string;
  version: number;
  reportType: string;
  status: string;
  summary: string | null;
  findings: string[];
  recommendations: string[];
  sections: ReportSection[];
  builtFrom: ReportBuiltFrom | null;
  reportKind: "structured" | "legacy";
  createdAt: string;
};

export function mapCaseReportRow(row: CaseReportRow): MappedCaseReport {
  return {
    id: row.id,
    caseId: row.case_id,
    version: row.version,
    reportType: row.report_type,
    status: row.status,
    summary: row.summary,
    findings: row.findings ?? [],
    recommendations: row.recommendations ?? [],
    sections: normalizeReportSections(row.sections),
    builtFrom: normalizeBuiltFrom(row.built_from),
    reportKind: row.report_kind === "structured" ? "structured" : "legacy",
    createdAt: row.created_at,
  };
}

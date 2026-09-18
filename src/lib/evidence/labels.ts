import type { BadgeTone } from "@/components/design-system";

/**
 * Norske visningsetiketter for Evidence Engine/Dokumentasjonssenter.
 * Eneste kilde - importeres av EvidenceWorkspacePanel, Dokumentasjonssenteret
 * og DocumentFactsReview i stedet for at hver fil definerer sine egne kopier.
 */

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  article: "Artikkel",
  journalist_email: "E-post fra journalist",
  reply_sent: "Tilsvar sendt",
  editor_response: "Svar fra redaksjonen",
  pfu_document: "PFU-dokument",
  legal_document: "Rettslig dokument",
  other: "Annet vedlegg",
};

export const DOCUMENT_TYPE_OPTIONS = [
  { value: "article", label: "Artikkel" },
  { value: "journalist_email", label: "E-post fra journalist" },
  { value: "reply_sent", label: "Tilsvar sendt" },
  { value: "editor_response", label: "Svar fra redaksjonen" },
  { value: "pfu_document", label: "PFU-dokument" },
  { value: "legal_document", label: "Rettslig dokument" },
  { value: "other", label: "Annet vedlegg" },
] as const;

export function documentTypeLabel(type: string) {
  return DOCUMENT_TYPE_LABELS[type] ?? "Annet vedlegg";
}

export const EXTRACTION_LABELS: Record<string, { label: string; tone: BadgeTone }> = {
  completed: { label: "Analyse ferdig", tone: "success" },
  pending: { label: "Venter på analyse", tone: "info" },
  processing: { label: "KI analyserer dokumentet", tone: "info" },
  failed: { label: "Kunne ikke analyseres", tone: "danger" },
  unsupported: { label: "Filtype støttes ikke", tone: "neutral" },
};

export const DOCUMENT_KIND_LABELS: Record<string, string> = {
  email: "E-post",
  agreement: "Avtale",
  article: "Artikkel",
  message: "Melding",
  call_log: "Anropslogg",
  other: "Annet",
  unknown: "Ukjent type",
};

export const SOURCE_CHARACTERISTIC_LABELS: Record<string, string> = {
  contemporaneous: "Samtidig med hendelsen",
  third_party: "Fra tredjepart",
  public_document: "Offentlig dokument",
  signed: "Signert",
  user_own_note: "Brukerens eget notat",
  screenshot: "Skjermbilde",
  original_file: "Originalfil",
  copy_or_export: "Kopi/eksport",
  unknown_origin: "Ukjent opprinnelse",
};

export function sourceCharacteristicLabel(value: string) {
  return SOURCE_CHARACTERISTIC_LABELS[value] ?? value.replace(/_/g, " ");
}

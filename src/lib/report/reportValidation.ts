export type ValidatedReportAiPayload = {
  summary: string;
  background: string;
  legalAssessment: { ruleId: string; commentary: string; documentIds: string[] }[];
  conclusion: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validerer KI sitt svar for de fire KI-forfattede rapportseksjonene.
 * Strengt på identitet: en regelverks-ID som ikke finnes i settet som ble
 * gitt til KI-en gjør at HELE det regelverkspunktet forkastes (kommentaren
 * kan ikke tilskrives noe reelt regelverkspunkt). En dokument-ID som ikke
 * finnes forkastes enkeltvis - resten av punktet beholdes.
 *
 * Returnerer null (hele svaret forkastes) kun hvis grunnstrukturen er
 * fundamentalt feil - matcher mønsteret fra resten av Evidence Engine sin
 * AI-validering (assessmentValidation, suggestionsValidation).
 */
export function validateReportAiPayload(
  raw: unknown,
  validDocumentIds: string[],
  validRuleIds: string[]
): ValidatedReportAiPayload | null {
  if (!raw || typeof raw !== "object") return null;

  const value = raw as Record<string, unknown>;

  if (!isNonEmptyString(value.summary)) return null;
  if (!isNonEmptyString(value.conclusion)) return null;

  const background = typeof value.background === "string" ? value.background.trim() : "";

  const documentIdSet = new Set(validDocumentIds);
  const ruleIdSet = new Set(validRuleIds);

  const rawLegalAssessment = Array.isArray(value.legal_assessment) ? value.legal_assessment : [];

  const legalAssessment: ValidatedReportAiPayload["legalAssessment"] = [];

  for (const entry of rawLegalAssessment) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;

    const ruleId = typeof item.rule_id === "string" ? item.rule_id : "";
    if (!ruleId || !ruleIdSet.has(ruleId)) continue; // hallusinert regelverks-ID - hele punktet forkastes

    if (!isNonEmptyString(item.commentary)) continue;

    const rawDocumentIds = Array.isArray(item.related_document_ids) ? item.related_document_ids : [];
    const documentIds = rawDocumentIds.filter(
      (id): id is string => typeof id === "string" && documentIdSet.has(id) // hallusinerte dokument-ID-er avvises enkeltvis
    );

    legalAssessment.push({ ruleId, commentary: item.commentary.trim(), documentIds });
  }

  return {
    summary: value.summary.trim(),
    background,
    legalAssessment,
    conclusion: value.conclusion.trim(),
  };
}

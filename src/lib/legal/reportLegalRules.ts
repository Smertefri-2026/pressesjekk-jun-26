import type { LegalRule } from "@/lib/report/types";
import { getFullLegalContextRules } from "./norwegianLaw";
import { getReportContextRules, type MediaEthicsRule } from "./mediaEthics";
import type { NorwegianLawRule } from "./norwegianLaw";

function toLegalRule(rule: NorwegianLawRule | MediaEthicsRule): LegalRule {
  return {
    id: rule.id,
    title: rule.title,
    summary: rule.summary,
    relevance: rule.relevance,
  };
}

/**
 * PresseSjekk sitt regelverkslag for den strukturerte rapportmotoren - VVP
 * (presseetikk) + norsk lov, tilpasset til den produktnøytrale LegalRule-
 * formen rapportmotorens kjerne bruker. Selve rapportmotoren
 * (src/lib/report/*) vet ingenting om VVP eller norsk lov - den mottar bare
 * dette som et LegalRule[]-parameter.
 *
 * Et annet Remøy AI-produkt (f.eks. Skattetap) bygger sin egen tilsvarende
 * fil som leverer skattelovgivning i samme LegalRule-form, uten å røre
 * rapportmotorens kjerne.
 */
export function getStructuredReportLegalRules(): LegalRule[] {
  const combined = [...getReportContextRules().map(toLegalRule), ...getFullLegalContextRules().map(toLegalRule)];

  // mediaEthics og norwegianLaw overlapper på ett punkt (grunnloven-96) -
  // dedupliser på ID slik at rapportmotorens ID-allowlist alltid er entydig.
  const seen = new Set<string>();
  return combined.filter((rule) => {
    if (seen.has(rule.id)) return false;
    seen.add(rule.id);
    return true;
  });
}

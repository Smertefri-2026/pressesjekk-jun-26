import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { packageAccessSteps, type PackagePlanId } from "@/data/packagePlans";

// Hvilke handlinger som krever betalt tilgang.
export type CaseAccessCapability = "report" | "pfu" | "police" | "investigation";

// Diskriminert resultat slik at API-ruter enkelt kan mappe til HTTP-status.
export type CaseAccessResult =
  | { ok: true; packageId: PackagePlanId }
  | {
      ok: false;
      status: 402 | 500;
      error: string;
      requiredPackage?: PackagePlanId;
    };

// Capability -> steg i packageAccessSteps (single source of truth).
const CAPABILITY_REQUIRED_STEP: Record<CaseAccessCapability, number> = {
  report: 3,
  pfu: 4,
  police: 6,
  investigation: 7,
};

// Capability -> minste pakke som gir tilgang (brukes i feilmelding/redirect).
const CAPABILITY_MIN_PACKAGE: Record<CaseAccessCapability, PackagePlanId> = {
  report: "report_pack",
  pfu: "pfu_pack",
  police: "full_pack",
  investigation: "investigation_pack",
};

function isKnownPackage(value: string): value is PackagePlanId {
  return Object.prototype.hasOwnProperty.call(packageAccessSteps, value);
}

/**
 * Sjekker om en bruker har aktiv betalt tilgang til en gitt handling på en sak.
 *
 * Leser case_access med service role (omgår RLS, fungerer uavhengig av om
 * lockdown-migrasjonen er kjørt) og bruker packageAccessSteps som fasit på
 * hva hver pakke låser opp. Kaster ikke ved normal manglende tilgang –
 * returnerer { ok: false, status: 402 }. Status 500 brukes kun ved
 * konfigurasjons- eller databasefeil.
 */
export async function assertCaseAccess(params: {
  userId: string;
  caseId: string;
  capability: CaseAccessCapability;
}): Promise<CaseAccessResult> {
  const { userId, caseId, capability } = params;

  if (!userId || !caseId) {
    return {
      ok: false,
      status: 500,
      error: "Intern feil: mangler bruker eller sak i tilgangssjekk.",
    };
  }

  const requiredStep = CAPABILITY_REQUIRED_STEP[capability];
  const requiredPackage = CAPABILITY_MIN_PACKAGE[capability];

  let supabase;
  try {
    supabase = getSupabaseServiceClient();
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error:
        error instanceof Error
          ? error.message
          : "Kunne ikke opprette service-klient for tilgangssjekk.",
    };
  }

  const { data, error } = await supabase
    .from("case_access")
    .select("package_id,status")
    .eq("case_id", caseId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      status: 500,
      error: `Kunne ikke lese tilgang: ${error.message}`,
    };
  }

  if (!data) {
    return {
      ok: false,
      status: 402,
      error: "Du har ikke aktiv betalt tilgang for denne handlingen.",
      requiredPackage,
    };
  }

  const packageId = String(data.package_id ?? "");

  if (
    !isKnownPackage(packageId) ||
    !packageAccessSteps[packageId].includes(requiredStep)
  ) {
    return {
      ok: false,
      status: 402,
      error: "Pakken din gir ikke tilgang til denne handlingen.",
      requiredPackage,
    };
  }

  return { ok: true, packageId };
}

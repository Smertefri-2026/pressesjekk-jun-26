import type { SupabaseClient } from "@supabase/supabase-js";

export type AssertOwnsCaseResult = { ok: true } | { ok: false; error: string };

/**
 * Bekrefter at den innloggede brukeren (supabase-klienten er allerede
 * scopet til brukerens Authorization-header) eier saken. RLS på `cases`
 * gjør selve håndhevingen - dette gir bare et tydelig 404 i stedet for en
 * uklar feil når saken ikke finnes eller ikke tilhører brukeren.
 */
export async function assertOwnsCase(
  supabase: SupabaseClient,
  caseId: string
): Promise<AssertOwnsCaseResult> {
  const { data, error } = await supabase
    .from("cases")
    .select("id")
    .eq("id", caseId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Fant ikke saken." };
  return { ok: true };
}

import type { User } from "@supabase/supabase-js";
import { requireUser } from "@/lib/supabase/authServer";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export type RequireAdminResult =
  | { ok: true; user: User }
  | { ok: false; status: 401 | 403 | 500; error: string };

/**
 * Ekte server-side admin-sjekk. Slår opp profiles.is_admin med service-role
 * klienten (omgår RLS, uavhengig av om admin-policyer finnes/er riktige) slik
 * at admin-API-ruter aldri stoler på klientens React-state.
 */
export async function requireAdmin(request: Request): Promise<RequireAdminResult> {
  const userResult = await requireUser(request);

  if (!userResult.ok) {
    return userResult;
  }

  let service;
  try {
    service = getSupabaseServiceClient();
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error:
        error instanceof Error
          ? error.message
          : "Kunne ikke opprette service-klient for admin-sjekk.",
    };
  }

  const { data: profile, error } = await service
    .from("profiles")
    .select("is_admin")
    .eq("id", userResult.user.id)
    .maybeSingle();

  if (error) {
    return { ok: false, status: 500, error: `Kunne ikke lese admin-status: ${error.message}` };
  }

  if (!profile?.is_admin) {
    return { ok: false, status: 403, error: "Du har ikke admin-tilgang." };
  }

  return { ok: true, user: userResult.user };
}

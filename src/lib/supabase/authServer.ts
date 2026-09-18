import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { getBearerToken } from "@/lib/api/http";

export type RequestUserResult =
  | { ok: true; user: User; supabase: SupabaseClient }
  | { ok: false; status: 401 | 500; error: string };

/**
 * Oppretter en Supabase-klient som opptrer som den innloggede brukeren
 * (Authorization-header videreføres, RLS gjelder som normalt) og henter
 * brukeren tokenet tilhører. Dette er mønsteret som allerede var i bruk i
 * generate-report m.fl., samlet ett sted.
 */
export async function requireUser(request: Request): Promise<RequestUserResult> {
  const token = getBearerToken(request);

  if (!token) {
    return { ok: false, status: 401, error: "Du må være innlogget." };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      status: 500,
      error: "Supabase-miljøvariabler mangler.",
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { ok: false, status: 401, error: "Kunne ikke bekrefte innlogget bruker." };
  }

  return { ok: true, user, supabase };
}

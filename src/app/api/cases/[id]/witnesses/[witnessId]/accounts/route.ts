import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { mapWitnessAccountRow, type WitnessAccountRow } from "@/lib/evidence/mappers";
import type { ObservationType } from "@/lib/evidence/types";

type RouteContext = {
  params: Promise<{ id: string; witnessId: string }>;
};

const ACCOUNT_SELECT =
  "id,witness_id,case_id,user_id,description,observation_type,event_id,created_at,updated_at,deleted_at";

const OBSERVATION_TYPES = new Set<ObservationType>(["direct", "secondhand"]);

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId, witnessId } = await context.params;

  const { data: witness, error: witnessError } = await auth.supabase
    .from("witnesses")
    .select("id,case_id")
    .eq("id", witnessId)
    .maybeSingle();

  if (witnessError) return jsonError(witnessError.message, 500);
  if (!witness) return jsonError("Fant ikke vitnet.", 404);
  if (witness.case_id !== caseId) return jsonError("Vitnet hører ikke til denne saken.", 400);

  const body = (await request.json().catch(() => ({}))) as {
    description?: unknown;
    observationType?: unknown;
    eventId?: unknown;
  };

  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!description) return jsonError("Beskriv hva vitnet observerte.", 400);
  if (description.length > 4000) return jsonError("Beskrivelsen er for lang (maks 4000 tegn).", 400);

  const observationType: ObservationType =
    typeof body.observationType === "string" && OBSERVATION_TYPES.has(body.observationType as ObservationType)
      ? (body.observationType as ObservationType)
      : "direct";

  let eventId: string | null = null;

  if (typeof body.eventId === "string" && body.eventId) {
    const { data: event, error: eventError } = await auth.supabase
      .from("events")
      .select("id,case_id")
      .eq("id", body.eventId)
      .maybeSingle();

    if (eventError) return jsonError(eventError.message, 500);
    if (!event) return jsonError("Fant ikke hendelsen.", 404);
    if (event.case_id !== caseId) return jsonError("Hendelsen hører ikke til denne saken.", 400);

    eventId = event.id;
  }

  const { data: inserted, error: insertError } = await auth.supabase
    .from("witness_accounts")
    .insert({
      witness_id: witnessId,
      case_id: caseId,
      user_id: auth.user.id,
      description,
      observation_type: observationType,
      event_id: eventId,
    })
    .select(ACCOUNT_SELECT)
    .single();

  if (insertError || !inserted) {
    return jsonError(insertError?.message ?? "Kunne ikke lagre vitneopplysningen.", 500);
  }

  return jsonOk({
    account: { ...mapWitnessAccountRow(inserted as WitnessAccountRow), claims: [], documents: [] },
  });
}

import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { mapEventClaimLinkRow, type EventClaimLinkRow } from "@/lib/evidence/mappers";

type RouteContext = {
  params: Promise<{ id: string; eventId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId, eventId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { claimId?: unknown };
  const claimId = typeof body.claimId === "string" ? body.claimId : "";

  if (!claimId) return jsonError("claimId mangler.", 400);

  // Samme forsvar-i-dybden som claim <-> dokument-koblingen: bekreft at
  // både hendelsen og påstanden faktisk hører til DENNE saken, ikke bare
  // at brukeren eier dem hver for seg.
  const [eventResult, claimResult] = await Promise.all([
    auth.supabase.from("events").select("id,case_id").eq("id", eventId).maybeSingle(),
    auth.supabase.from("claims").select("id,case_id").eq("id", claimId).maybeSingle(),
  ]);

  if (eventResult.error) return jsonError(eventResult.error.message, 500);
  if (!eventResult.data) return jsonError("Fant ikke hendelsen.", 404);
  if (eventResult.data.case_id !== caseId) return jsonError("Hendelsen hører ikke til denne saken.", 400);

  if (claimResult.error) return jsonError(claimResult.error.message, 500);
  if (!claimResult.data) return jsonError("Fant ikke opplysningen.", 404);
  if (claimResult.data.case_id !== caseId) return jsonError("Opplysningen hører ikke til denne saken.", 400);

  const { data: link, error: insertError } = await auth.supabase
    .from("event_claim_links")
    .insert({ event_id: eventId, claim_id: claimId, linked_by: auth.user.id })
    .select("id,event_id,claim_id,linked_by,created_at")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return jsonError("Denne opplysningen er allerede koblet til hendelsen.", 409);
    }
    return jsonError(insertError.message, 500);
  }

  return jsonOk({ link: mapEventClaimLinkRow(link as EventClaimLinkRow) });
}

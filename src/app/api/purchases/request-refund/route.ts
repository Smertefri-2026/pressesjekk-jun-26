import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

type RefundRequestBody = {
  purchaseId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const token = authorization.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json(
        { error: "Du må være innlogget for å be om refusjon." },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase-konfigurasjon mangler." },
        { status: 500 }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Fant ikke innlogget bruker." },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as RefundRequestBody;
    const purchaseId = body.purchaseId ? String(body.purchaseId) : "";

    if (!purchaseId) {
      return NextResponse.json(
        { error: "Mangler kjøps-ID." },
        { status: 400 }
      );
    }

    const serviceClient = getSupabaseServiceClient();

    const { data: purchase, error: purchaseError } = await serviceClient
      .from("user_purchases")
      .select("id,user_id,status,refund_status")
      .eq("id", purchaseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (purchaseError) {
      return NextResponse.json({ error: purchaseError.message }, { status: 500 });
    }

    if (!purchase) {
      return NextResponse.json(
        { error: "Fant ikke kjøpet." },
        { status: 404 }
      );
    }

    if (purchase.status !== "paid") {
      return NextResponse.json(
        { error: "Bare betalte kjøp kan sendes til refusjonsvurdering." },
        { status: 400 }
      );
    }

    if (purchase.refund_status !== "none") {
      return NextResponse.json(
        { error: "Refusjon er allerede registrert for dette kjøpet." },
        { status: 400 }
      );
    }

    const { data: updatedPurchase, error: updateError } = await serviceClient
      .from("user_purchases")
      .update({
        refund_status: "requested",
        refund_requested_at: new Date().toISOString(),
        refund_note: "Kunden har bedt om refusjon fra Min Side.",
      })
      .eq("id", purchaseId)
      .eq("user_id", user.id)
      .select("id,refund_status")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      purchase: updatedPurchase,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kunne ikke be om refusjon.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

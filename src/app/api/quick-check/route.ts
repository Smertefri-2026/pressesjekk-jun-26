import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value.trim());
    url.hash = "";
    url.searchParams.sort();

    const normalized = url.toString().replace(/\/$/, "");

    return normalized;
  } catch {
    return value.trim().replace(/\/$/, "");
  }
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonError("Supabase miljøvariabler mangler.", 500);
  }

  const body = await request.json().catch(() => null);
  const url = String(body?.url ?? "").trim();
  const role = String(body?.role ?? "reader").trim() || "reader";

  if (!url) {
    return jsonError("URL mangler.");
  }

  const normalizedUrl = normalizeUrl(url);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });

  const { data: existing, error: existingError } = await supabase
    .from("quick_checks")
    .select("id,url,normalized_url,role,check_count,last_checked_at,created_at")
    .eq("normalized_url", normalizedUrl)
    .maybeSingle();

  if (existingError) {
    return jsonError(existingError.message, 500);
  }

  if (existing) {
    const nextCount = Number(existing.check_count ?? 0) + 1;

    const { data: updated, error: updateError } = await supabase
      .from("quick_checks")
      .update({
        check_count: nextCount,
        last_checked_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id,url,normalized_url,role,check_count,last_checked_at,created_at")
      .single();

    if (updateError) {
      return jsonError(updateError.message, 500);
    }

    return NextResponse.json({ quickCheck: updated });
  }

  const { data: created, error: insertError } = await supabase
    .from("quick_checks")
    .insert({
      url,
      normalized_url: normalizedUrl,
      role,
      check_count: 1,
      last_checked_at: new Date().toISOString(),
    })
    .select("id,url,normalized_url,role,check_count,last_checked_at,created_at")
    .single();

  if (insertError) {
    return jsonError(insertError.message, 500);
  }

  return NextResponse.json({ quickCheck: created });
}

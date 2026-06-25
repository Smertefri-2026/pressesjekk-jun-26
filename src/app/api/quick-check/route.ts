import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import {
  formatRulesForPrompt,
  getPfuRelevantRules,
  pfuContextRules,
} from "@/lib/legal/mediaEthics";
import {
  formatNorwegianLawRulesForPrompt,
  getCompensationContextRules,
  getPoliceReportContextRules,
} from "@/lib/legal/norwegianLaw";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value.trim());
    url.hash = "";
    url.searchParams.sort();

    return url.toString().replace(/\/$/, "");
  } catch {
    return value.trim().replace(/\/$/, "");
  }
}

function safeJsonArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item)).filter(Boolean)
    : [];
}

async function generateQuickAnalysis({
  url,
  role,
}: {
  url: string;
  role: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      ai_status: "failed",
      ai_summary:
        "KI-raskrapport kunne ikke genereres fordi OPENAI_API_KEY mangler.",
      ai_ethics_points: [],
      ai_legal_points: [],
      ai_missing_context: [
        "Artikkeltekst",
        "Den omtaltes versjon",
        "Kontakt med redaksjonen",
        "Dokumentasjon og vedlegg",
      ],
      ai_recommendation:
        "Opprett en lagret sak dersom du er omtalt eller saken bør dokumenteres videre.",
      ai_generated_at: new Date().toISOString(),
    };
  }

  const openai = new OpenAI({ apiKey });

  const mediaEthicsRules = [
    ...getPfuRelevantRules(),
    ...pfuContextRules,
  ];

  const legalRules = [
    ...getPoliceReportContextRules(),
    ...getCompensationContextRules(),
  ];

  const prompt = `
Du er PresseSjekk og skal lage en svært kort offentlig raskrapport uten innlogging.

Viktig:
- Du har kun URL og rolle.
- Du har ikke lest hele artikkelteksten med mindre URL-en alene gir nok informasjon.
- Du skal ikke konkludere med presseetisk brudd, lovbrudd eller erstatningsansvar.
- Du skal bruke forsiktige formuleringer: "kan være relevant", "bør vurderes", "krever mer dokumentasjon".
- Svar på norsk.
- Svar kun som gyldig JSON.

URL:
${url}

Rolle:
${role}

Presseetiske rammer:
${formatRulesForPrompt(mediaEthicsRules)}

Juridiske rammer:
${formatNorwegianLawRulesForPrompt(legalRules)}

Lag JSON med disse feltene:
{
  "summary": "kort sammendrag på 2-4 setninger",
  "ethics_points": ["3-5 mulige presseetiske sjekkpunkter"],
  "legal_points": ["2-4 mulige juridiske rammer/forbehold"],
  "missing_context": ["3-6 ting som mangler før reell vurdering"],
  "recommendation": "kort anbefalt neste steg"
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Du lager korte, forsiktige og tydelig forbeholdne raskrapporter om mediesaker.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);

  return {
    ai_status: "ready",
    ai_summary:
      String(parsed.summary ?? "").trim() ||
      "Dette er en foreløpig raskrapport basert på URL og rolle.",
    ai_ethics_points: safeJsonArray(parsed.ethics_points),
    ai_legal_points: safeJsonArray(parsed.legal_points),
    ai_missing_context: safeJsonArray(parsed.missing_context),
    ai_recommendation:
      String(parsed.recommendation ?? "").trim() ||
      "Opprett en lagret sak dersom saken bør dokumenteres videre.",
    ai_generated_at: new Date().toISOString(),
  };
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
  const forceAnalyze = Boolean(body?.forceAnalyze);

  if (!url) {
    return jsonError("URL mangler.");
  }

  const normalizedUrl = normalizeUrl(url);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });

  const selectFields =
    "id,url,normalized_url,role,check_count,last_checked_at,created_at,ai_status,ai_summary,ai_ethics_points,ai_legal_points,ai_missing_context,ai_recommendation,ai_generated_at";

  const { data: existing, error: existingError } = await supabase
    .from("quick_checks")
    .select(selectFields)
    .eq("normalized_url", normalizedUrl)
    .maybeSingle();

  if (existingError) {
    return jsonError(existingError.message, 500);
  }

  let quickCheck = existing;

  if (existing) {
    const nextCount = Number(existing.check_count ?? 0) + 1;

    const { data: updated, error: updateError } = await supabase
      .from("quick_checks")
      .update({
        check_count: nextCount,
        last_checked_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select(selectFields)
      .single();

    if (updateError) {
      return jsonError(updateError.message, 500);
    }

    quickCheck = updated;
  } else {
    const { data: created, error: insertError } = await supabase
      .from("quick_checks")
      .insert({
        url,
        normalized_url: normalizedUrl,
        role,
        check_count: 1,
        last_checked_at: new Date().toISOString(),
      })
      .select(selectFields)
      .single();

    if (insertError) {
      return jsonError(insertError.message, 500);
    }

    quickCheck = created;
  }

  const shouldAnalyze =
    forceAnalyze ||
    !quickCheck.ai_summary ||
    quickCheck.ai_status === "not_started" ||
    quickCheck.ai_status === "failed";

  if (shouldAnalyze) {
    try {
      const aiData = await generateQuickAnalysis({ url, role });

      const { data: analyzed, error: analyzeUpdateError } = await supabase
        .from("quick_checks")
        .update(aiData)
        .eq("id", quickCheck.id)
        .select(selectFields)
        .single();

      if (analyzeUpdateError) {
        return jsonError(analyzeUpdateError.message, 500);
      }

      quickCheck = analyzed;
    } catch (error) {
      console.error("Quick check AI failed:", error);

      const { data: failed } = await supabase
        .from("quick_checks")
        .update({
          ai_status: "failed",
          ai_summary:
            "KI-raskrapport kunne ikke genereres akkurat nå. Søket er likevel registrert.",
          ai_missing_context: [
            "Artikkeltekst",
            "Den omtaltes versjon",
            "Kontakt med redaksjonen",
            "Dokumentasjon",
          ],
          ai_recommendation:
            "Opprett en lagret sak dersom saken bør dokumenteres videre.",
          ai_generated_at: new Date().toISOString(),
        })
        .eq("id", quickCheck.id)
        .select(selectFields)
        .single();

      if (failed) quickCheck = failed;
    }
  }

  return NextResponse.json({ quickCheck });
}

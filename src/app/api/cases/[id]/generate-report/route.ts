import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: caseId } = await context.params;

    if (!process.env.OPENAI_API_KEY) {
      return jsonError("OPENAI_API_KEY mangler i .env.local.", 500);
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonError(
        `Supabase miljø mangler: NEXT_PUBLIC_SUPABASE_URL=${Boolean(
          supabaseUrl
        )}, NEXT_PUBLIC_SUPABASE_ANON_KEY=${Boolean(supabaseAnonKey)}.`,
        500
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonError("Du må være innlogget for å generere KI-rapport.", 401);
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
      auth: {
        persistSession: false,
      },
    });

    const { data: caseItem, error: caseError } = await supabaseUser
      .from("cases")
      .select(
        "id,title,status,media_name,article_title,article_url,published_date,short_description,user_id"
      )
      .eq("id", caseId)
      .single();

    if (caseError || !caseItem) {
      return jsonError(
        `Fant ikke saken. caseId=${caseId}. Supabase-feil: ${
          caseError?.message ?? "Ingen data returnert"
        }`,
        404
      );
    }

    const { data: caseInput } = await supabaseUser
      .from("case_inputs")
      .select(
        "article_text,what_happened,your_role,reply_sent,reply_text,editor_response,legal_status,legal_status_details,documentation_summary,desired_outcome"
      )
      .eq("case_id", caseId)
      .maybeSingle();

    const { data: documents } = await supabaseUser
      .from("case_documents")
      .select("title,document_type,description,file_name,file_size,created_at")
      .eq("case_id", caseId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    const { data: existingReports } = await supabaseUser
      .from("case_reports")
      .select("version")
      .eq("case_id", caseId)
      .order("version", { ascending: false });

    const nextVersion =
      existingReports && existingReports.length > 0
        ? Math.max(...existingReports.map((report) => report.version ?? 0)) + 1
        : 1;

    const prompt = `
Du er PresseSjekk, en nøktern norsk dokumentasjons- og analyseassistent for mediesaker.

Lag et strukturert rapportutkast på norsk. Ikke gi juridisk rådgivning. Ikke påstå at noe er ulovlig. Skill tydelig mellom fakta, mangler, foreløpige vurderinger og anbefalte neste steg.

SAK:
${JSON.stringify(caseItem, null, 2)}

SAKSOPPLYSNINGER:
${JSON.stringify(caseInput ?? {}, null, 2)}

DOKUMENTER:
${JSON.stringify(documents ?? [], null, 2)}

Svar som JSON med nøyaktig denne strukturen:
{
  "summary": "kort sammendrag",
  "findings": ["punkt 1", "punkt 2"],
  "recommendations": ["punkt 1", "punkt 2"],
  "disclaimer": "kort forbehold"
}
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      text: {
        format: {
          type: "json_object",
        },
      },
    });

    const outputText = response.output_text;

    let parsed: {
      summary?: string;
      findings?: string[];
      recommendations?: string[];
      disclaimer?: string;
    };

    try {
      parsed = JSON.parse(outputText);
    } catch {
      return jsonError("KI-svaret kunne ikke leses som JSON.", 500);
    }

    const findings = Array.isArray(parsed.findings) ? parsed.findings : [];
    const recommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations
      : [];

    const summary =
      parsed.summary ||
      "KI-rapporten ble generert, men manglet sammendrag.";

    if (parsed.disclaimer) {
      recommendations.push(`Forbehold: ${parsed.disclaimer}`);
    }

    const { data: savedReport, error: saveError } = await supabaseUser
      .from("case_reports")
      .insert({
        case_id: caseId,
        version: nextVersion,
        report_type: "full_report",
        summary,
        findings,
        recommendations,
        status: "ready",
      })
      .select(
        "id,version,report_type,summary,findings,recommendations,pfu_draft,status,created_at"
      )
      .single();

    if (saveError) {
      return jsonError(`Kunne ikke lagre KI-rapport: ${saveError.message}`, 500);
    }

    await supabaseUser
      .from("cases")
      .update({ status: "report_ready" })
      .eq("id", caseId);

    return NextResponse.json({
      report: savedReport,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ukjent feil ved KI-generering.";

    return jsonError(message, 500);
  }
}

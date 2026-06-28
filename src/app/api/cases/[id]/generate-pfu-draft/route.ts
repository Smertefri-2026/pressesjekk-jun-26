import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assertCaseAccess } from "@/lib/access/assertCaseAccess";
import {
  editorResponsibilityRules,
  formatRulesForPrompt,
  getPfuRelevantRules,
  legalContextRules,
  pfuContextRules,
} from "@/lib/legal/mediaEthics";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function safeText(value: unknown) {
  return String(value ?? "").trim();
}

function formatList(items: string[] | null | undefined) {
  if (!items || items.length === 0) return "Ikke registrert.";
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonError("Supabase miljøvariabler mangler.", 500);
    }

    if (!openaiKey) {
      return jsonError("OPENAI_API_KEY mangler.", 500);
    }

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonError("Du må være innlogget for å generere PFU-klage.", 401);
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

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return jsonError("Kunne ikke bekrefte innlogget bruker.", 401);
    }

    const { data: profile } = await supabaseUser
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const { data: caseItem, error: caseError } = await supabaseUser
      .from("cases")
      .select("*")
      .eq("id", id)
      .single();

    if (caseError || !caseItem) {
      return jsonError(caseError?.message ?? "Fant ikke saken.", 404);
    }

    const access = await assertCaseAccess({
      userId: user.id,
      caseId: id,
      capability: "pfu",
    });

    if (!access.ok) {
      return NextResponse.json(
        { error: access.error, requiredPackage: access.requiredPackage },
        { status: access.status }
      );
    }

    const { data: caseInput } = await supabaseUser
      .from("case_inputs")
      .select("*")
      .eq("case_id", id)
      .maybeSingle();

    const { data: latestReport } = await supabaseUser
      .from("case_reports")
      .select("id,version,report_type,summary,findings,recommendations,created_at")
      .eq("case_id", id)
      .neq("report_type", "pfu_draft")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: documents } = await supabaseUser
      .from("case_documents")
      .select("id,file_name,title,category,created_at")
      .eq("case_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    const { data: existingReports } = await supabaseUser
      .from("case_reports")
      .select("version")
      .eq("case_id", id);

    const nextVersion =
      existingReports && existingReports.length > 0
        ? Math.max(...existingReports.map((item) => item.version ?? 0)) + 1
        : 1;

    const vvpRulesText = formatRulesForPrompt(getPfuRelevantRules());
    const editorRulesText = formatRulesForPrompt(editorResponsibilityRules);
    const pfuContextText = formatRulesForPrompt(pfuContextRules);
    const legalContextText = formatRulesForPrompt(legalContextRules);

    const documentText =
      documents && documents.length > 0
        ? documents
            .map((item) => {
              const name = item.file_name || item.title || "Dokument";
              const category = item.category || "ukjent kategori";
              return `- ${name} (${category})`;
            })
            .join("\n")
        : "Ingen dokumenter er registrert.";

    const prompt = `
Du er en norsk presseetisk skriveassistent for PresseSjekk.

Oppgaven din er å lage et strukturert PFU-klage på norsk.

VIKTIG:
- Ikke konkluder med at mediet har brutt god presseskikk.
- Bruk forsiktig språk: "det kan vurderes", "saken kan reise spørsmål om", "det bør vurderes om".
- PFU-klagen skal primært bygge på Vær Varsom-plakaten.
- Redaktørplakaten kan nevnes som bakgrunn, men ikke som hovedgrunnlag for PFU-punkt.
- Juridiske spørsmål, Grunnloven, ærekrenkelse eller privatliv skal kun nevnes som mulige spor utenfor PFUs mandat.
- Ikke gi juridisk rådgivning.
- Ikke skriv at PFU er inhabilt eller at PFU vil konkludere på en bestemt måte.
- Skriv som et profesjonelt utkast en klager, rådgiver eller advokat kan redigere videre.

SAK:
Tittel: ${safeText(caseItem.title)}
Mediehus: ${safeText(caseItem.media_name)}
Artikkeloverskrift: ${safeText(caseItem.article_title)}
Artikkellenke: ${safeText(caseItem.article_url)}
Publiseringsdato: ${safeText(caseItem.published_date)}
Kort beskrivelse: ${safeText(caseItem.short_description)}

KLAGER / PROFIL:
Navn: ${safeText(profile?.full_name)}
E-post: ${safeText(profile?.email ?? user.email)}
Rolle/profiltype: ${safeText(profile?.role_type)}

SAKSOPPLYSNINGER:
Hva skjedde:
${safeText(caseInput?.what_happened)}

Rolle i saken:
${safeText(caseInput?.your_role)}

Artikkeltekst / utdrag:
${safeText(caseInput?.article_text)}

Tilsvar sendt:
${caseInput?.reply_sent ? "Ja" : "Ikke registrert / nei"}

Tilsvar / henvendelse:
${safeText(caseInput?.reply_text)}

Svar fra redaksjonen:
${safeText(caseInput?.editor_response)}

Rettsstatus:
${safeText(caseInput?.legal_status)}

Rettsstatus detaljer:
${safeText(caseInput?.legal_status_details)}

Dokumentasjonsoppsummering:
${safeText(caseInput?.documentation_summary)}

Ønsket utfall:
${safeText(caseInput?.desired_outcome)}

NYESTE RAPPORT:
Rapporttype: ${safeText(latestReport?.report_type)}
Versjon: ${safeText(latestReport?.version)}
Sammendrag:
${safeText(latestReport?.summary)}

Funn:
${formatList(latestReport?.findings)}

Anbefalte steg:
${formatList(latestReport?.recommendations)}

DOKUMENTER:
${documentText}

VÆR VARSOM-PLAKATEN – RELEVANTE REGLER:
${vvpRulesText}

REDAKTØRPLAKATEN – BAKGRUNN:
${editorRulesText}

PFU-KONTEKST:
${pfuContextText}

ANDRE MULIGE SPOR UTENFOR PFU:
${legalContextText}

Lag PFU-klageet med denne strukturen:

PFU-KLAGEUTKAST

1. Klager
2. Innklaget medium
3. Publisering saken gjelder
4. Kort om saken
5. Hvorfor saken ønskes vurdert av PFU
6. Mulige presseetiske problemstillinger
   - Del dette inn etter relevante VVP-punkter
   - Ta kun med punkter som faktisk kan være relevante
7. Kontakt med redaksjonen, tilsvar og eventuell imøtegåelse
8. Dokumentasjon
9. Ønsket resultat
10. Andre mulige spor utenfor PFU
   - Kort og forsiktig
   - Forklar at dette ikke er PFUs hovedmandat
11. Forbehold

Skriv klart, rolig, profesjonelt og nøkternt.
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const pfuDraft = response.output_text?.trim();

    if (!pfuDraft) {
      return jsonError("KI svarte uten PFU-klage.", 500);
    }

    const { data: insertedReport, error: insertError } = await supabaseUser
      .from("case_reports")
      .insert({
        case_id: id,
        version: nextVersion,
        report_type: "pfu_draft",
        pfu_draft: pfuDraft,
        status: "ready",
      })
      .select("id,version,report_type,pfu_draft,status,created_at")
      .single();

    if (insertError) {
      return jsonError(insertError.message, 500);
    }

    return NextResponse.json({
      report: insertedReport,
    });
  } catch (error) {
    console.error("PFU draft generation failed:", error);

    return jsonError(
      error instanceof Error
        ? `PFU-KI-feil: ${error.message}`
        : "Ukjent feil ved generering av PFU-klage.",
      500
    );
  }
}

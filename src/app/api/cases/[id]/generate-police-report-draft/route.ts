import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import {
  editorResponsibilityRules,
  formatRulesForPrompt,
  getPfuRelevantRules,
  pfuContextRules,
} from "@/lib/legal/mediaEthics";
import {
  formatNorwegianLawRulesForPrompt,
  getPoliceReportContextRules,
  getCompensationContextRules,
} from "@/lib/legal/norwegianLaw";

function safeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function jsonText(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json(
      { error: "Du må være innlogget." },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase-miljøvariabler mangler." },
      { status: 500 }
    );
  }

  if (!openAiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY mangler i .env.local." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json(
      { error: "Kunne ikke bekrefte bruker." },
      { status: 401 }
    );
  }

  const { data: caseItem, error: caseError } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .single();

  if (caseError || !caseItem) {
    return NextResponse.json(
      { error: caseError?.message ?? "Fant ikke saken." },
      { status: 404 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: inputs } = await supabase
    .from("case_inputs")
    .select("*")
    .eq("case_id", id);

  const { data: documents } = await supabase
    .from("case_documents")
    .select("*")
    .eq("case_id", id)
    .order("created_at", { ascending: true });

  const { data: reports } = await supabase
    .from("case_reports")
    .select("*")
    .eq("case_id", id)
    .order("version", { ascending: false });

  const { data: pfuDecision } = await supabase
    .from("pfu_decisions")
    .select("*")
    .eq("case_id", id)
    .maybeSingle();

  const latestFullReport =
    reports?.find((report) => report.report_type === "full_report") ?? null;

  const latestPfuDraft =
    reports?.find((report) => report.report_type === "pfu_draft") ?? null;

  const mediaRulesForPrompt = formatRulesForPrompt([
    ...getPfuRelevantRules(),
    ...editorResponsibilityRules,
    ...pfuContextRules,
  ]);

  const policeRulesForPrompt = formatNorwegianLawRulesForPrompt(
    getPoliceReportContextRules()
  );

  const compensationRulesForPrompt = formatNorwegianLawRulesForPrompt(
    getCompensationContextRules()
  );

  const client = new OpenAI({
    apiKey: openAiKey,
  });

  const prompt = `
Du er en forsiktig norsk saksbehandler som lager et strukturert utkast til politianmeldelse / vurderingsnotat i en mediesak.

VIKTIGE RAMMER:
- Ikke konkluder med at noen har brutt loven.
- Ikke skriv at noen er skyldige.
- Ikke skriv at politiet må etterforske.
- Bruk forsiktig språk: "det kan vurderes", "det bes vurdert", "etter klagers oppfatning", "mulig rettslig spor".
- Skill tydelig mellom dokumenterte fakta, klagers vurdering og mulige rettslige spørsmål.
- PFU og Vær Varsom-plakaten kan brukes som bakgrunn, men politianmeldelse er et eget spor.
- Erstatningskrav skal bare nevnes kort som mulig separat sivilt spor, ikke blandes inn som hoveddel i politianmeldelsen.
- Teksten skal være på norsk bokmål.
- Teksten skal være ryddig, nøktern og egnet for videre kvalitetssikring.

LAG STRUKTUREN SLIK:

UTKAST TIL POLITIANMELDELSE / VURDERINGSNOTAT

1. Anmelder / klager
2. Hvem saken gjelder
3. Kort sammendrag
4. Bakgrunn og hendelsesforløp
5. Publisering / omtale saken gjelder
6. Hva som oppleves uriktig, krenkende eller skadelig
7. Dokumentasjon
8. Kontakt med redaksjonen / samtidig imøtegåelse / tilsvar
9. PFU-spor og eventuell PFU-avgjørelse
10. Mulige rettslige spørsmål som bes vurdert
11. Mulig sivilt spor / erstatningsspor
12. Hva politiet bes vurdere
13. Vedlegg / dokumentasjon
14. Forbehold

JURIDISK SPRÅK:
- Under punkt 10 kan du nevne mulige rettslige spor hvis relevant, for eksempel privatlivets fred, hensynsløs atferd eller andre forhold, men bare som noe politiet/advokat må vurdere.
- Under punkt 11 skal du kort forklare at økonomisk tap, omdømmeskade eller oppreisning normalt bør vurderes som et eget sivilt spor / utredningspakke.
- Ikke lag bastante lovkonklusjoner.

PRESSEETISKE REGLER / BAKGRUNN:
${mediaRulesForPrompt}

NORSKE RETTSLIGE SPOR:
${policeRulesForPrompt}

ERSTATNING / UTREDNING SOM EGET SPOR:
${compensationRulesForPrompt}

BRUKER / PROFIL:
${jsonText(profile)}

SAK:
${jsonText(caseItem)}

SAKSOPPLYSNINGER:
${jsonText(inputs)}

DOKUMENTER:
${jsonText(documents)}

SISTE RAPPORT:
${jsonText(latestFullReport)}

SISTE PFU-KLAGEUTKAST:
${jsonText(latestPfuDraft)}

PFU-AVGJØRELSE / STATUS:
${jsonText(pfuDecision)}
`;

  try {
    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const policeDraft = safeText(completion.output_text);

    if (!policeDraft) {
      return NextResponse.json(
        { error: "KI-en returnerte ikke tekst." },
        { status: 500 }
      );
    }

    const existingVersions = (reports ?? [])
      .map((report) => Number(report.version))
      .filter((version) => Number.isFinite(version));

    const nextVersion =
      existingVersions.length > 0 ? Math.max(...existingVersions) + 1 : 1;

    const { data: insertedReport, error: insertError } = await supabase
      .from("case_reports")
      .insert({
        case_id: id,
        version: nextVersion,
        report_type: "police_draft",
        police_draft: policeDraft,
        status: "ready",
      })
      .select("id,version,report_type,police_draft,status,created_at")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      policeDraft,
      report: insertedReport,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Kunne ikke generere politianmeldelsesutkast." },
      { status: 500 }
    );
  }
}

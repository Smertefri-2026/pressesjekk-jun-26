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
  getCompensationContextRules,
  getPoliceReportContextRules,
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
    auth: {
      persistSession: false,
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

  const latestPoliceDraft =
    reports?.find((report) => report.report_type === "police_draft") ?? null;

  const mediaRulesForPrompt = formatRulesForPrompt([
    ...getPfuRelevantRules(),
    ...editorResponsibilityRules,
    ...pfuContextRules,
  ]);

  const legalContextForPrompt = formatNorwegianLawRulesForPrompt([
    ...getPoliceReportContextRules(),
    ...getCompensationContextRules(),
  ]);

  const client = new OpenAI({
    apiKey: openAiKey,
  });

  const prompt = `
Du er PresseSjekk, en nøktern norsk dokumentasjons- og utredningsassistent for mediesaker.

Du skal lage et foreløpig UTREDNINGSUTKAST på norsk bokmål.

VIKTIGE RAMMER:
- Ikke gi juridisk rådgivning.
- Ikke konkluder med at noen har brutt loven.
- Ikke skriv at noen er skyldige.
- Skill tydelig mellom dokumenterte fakta, brukerens vurdering, presseetiske spørsmål og mulige videre spor.
- Bruk forsiktig språk: "kan vurderes", "synes å reise spørsmål om", "bør dokumenteres nærmere", "etter brukerens oppfatning".
- Utredningen skal være egnet som arbeidsgrunnlag før eventuell manuell gjennomgang, advokat, PFU, politianmeldelse eller annen videre oppfølging.
- Dersom saken gjelder journalist/redaksjonell kvalitetssikring, skal teksten vinkles som publiseringsgrunnlag og redaksjonell kontroll.
- Dersom saken gjelder omtalt person/virksomhet, skal teksten vinkles som dokumentasjon av brukerens versjon av saken.
- Teksten skal være ryddig, kronologisk og profesjonell.

LAG STRUKTUREN SLIK:

PRESSESJEKK UTREDNING

1. Saksforside / hovedopplysninger
- Sakstittel
- Hvem saken gjelder
- Mediehus / publisering
- Datoer
- Kort status
- Formål med utredningen

2. Kort sammendrag
- Hva saken gjelder
- Hvorfor saken er viktig
- Hva brukeren mener bør vurderes
- Hva dokumentasjonen foreløpig viser

3. Kronologisk saksgjennomgang
- Lag en ryddig tidslinje basert på saken, saksopplysninger, rapporter, PFU-spor og dokumenter.
- Bruk datoer der de finnes.
- Marker tydelig når dato mangler eller er usikker.
- Knytt gjerne hendelser til dokumenter/vedlegg dersom mulig.

4. Dokumentasjon og vedleggsliste
- Lag en foreløpig vedleggsliste.
- Bruk dokumenter, rapporter, PFU-klage, PFU-avgjørelse og politianmeldelse hvis de finnes.
- Foreslå nummerering: Vedlegg 01, Vedlegg 02, Vedlegg 03 osv.
- Forklar kort hva hvert vedlegg kan ha betydning for.

5. Presseetiske vurderingstemaer
- Vurder forsiktig hvilke presseetiske temaer saken kan reise.
- Bruk Vær Varsom-plakaten og redaktøransvar som bakgrunn.
- Ikke konkluder bastant med brudd.

6. Mulige rettslige / erstatningsmessige spor
- Nevn bare mulige spor som bør vurderes nærmere.
- Ikke konkluder.
- Skill tydelig mellom presseetikk, sivilt/erstatningsrettslig spor og eventuelt politispor.

7. Mangler og behov for mer dokumentasjon
- Hva mangler?
- Hvilke vedlegg bør lastes opp?
- Hva bør sorteres kronologisk?
- Hvilke datoer, svar eller dokumenter bør innhentes?

8. Videre anbefalt arbeid
- Konkrete neste steg.
- F.eks. sortere vedlegg, lage tidslinje, kvalitetssikre rapport, vurdere PFU, vurdere juridisk bistand eller bestille manuell utredningspakke.

9. Forbehold
- Forklar at dette er et foreløpig KI-generert utredningsutkast.
- Forklar at teksten må kvalitetssikres manuelt før bruk i alvorlige prosesser.
- Forklar at dette ikke erstatter advokat, PFU, politi eller domstol.

PRESSEETISKE REGLER / BAKGRUNN:
${mediaRulesForPrompt}

NORSKE RETTSLIGE OG ERSTATNINGSMESSIGE SPOR:
${legalContextForPrompt}

BRUKER / PROFIL:
${jsonText(profile)}

SAK:
${jsonText(caseItem)}

SAKSOPPLYSNINGER:
${jsonText(inputs)}

DOKUMENTER / VEDLEGG:
${jsonText(documents)}

SISTE RAPPORT:
${jsonText(latestFullReport)}

SISTE PFU-KLAGEUTKAST:
${jsonText(latestPfuDraft)}

PFU-AVGJØRELSE / STATUS:
${jsonText(pfuDecision)}

SISTE POLITIANMELDELSE:
${jsonText(latestPoliceDraft)}
`;

  try {
    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const investigationDraft = safeText(completion.output_text);

    if (!investigationDraft) {
      return NextResponse.json(
        { error: "KI-en returnerte ikke tekst." },
        { status: 500 }
      );
    }

    const { data: latestReport } = await supabase
      .from("case_reports")
      .select("version")
      .eq("case_id", id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestVersion = Number(latestReport?.version ?? 0);
    const nextVersion = Number.isFinite(latestVersion) ? latestVersion + 1 : 1;

    const { data: insertedReport, error: insertError } = await supabase
      .from("case_reports")
      .insert({
        case_id: id,
        version: nextVersion,
        report_type: "investigation_draft",
        investigation_draft: investigationDraft,
        status: "ready",
      })
      .select("id,version,report_type,investigation_draft,status,created_at")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Kunne ikke lagre utredning: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      report: insertedReport,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Ukjent feil ved generering av utredning.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

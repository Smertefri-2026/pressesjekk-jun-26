import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/authServer";
import { jsonError } from "@/lib/api/http";
import { callAiText, AI_DOCUMENT_ISOLATION_INSTRUCTIONS } from "@/lib/ai/openai";
import { formatDocumentsForPrompt } from "@/lib/documents/formatForPrompt";
import { assertCaseAccess } from "@/lib/access/assertCaseAccess";
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

  if (!process.env.OPENAI_API_KEY) {
    return jsonError("OPENAI_API_KEY mangler i .env.local.", 500);
  }

  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { user, supabase } = auth;

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

  const access = await assertCaseAccess({
    userId: user.id,
    caseId: id,
    capability: "police",
  });

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error, requiredPackage: access.requiredPackage },
      { status: access.status }
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
    .select("id,title,document_type,file_name,created_at,extracted_text")
    .eq("case_id", id)
    .is("deleted_at", null)
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
9. PFU-klage og eventuell PFU-avgjørelse
10. Mulige rettslige spørsmål som bes vurdert
11. Mulig sivilt spor / erstatningsspor
12. Hva politiet bes vurdere
13. Vedlegg / dokumentasjon
14. Forbehold

PFU-RESULTAT SKAL TOLKES SLIK:
- upheld = felt / klagen tatt til følge
- partly_upheld = delvis felt / klagen delvis tatt til følge
- not_upheld = ikke felt / klagen ikke tatt til følge
- dismissed = avvist
- withdrawn = trukket
- other = annet / uklart resultat
- Ikke skriv engelske statusord som "upheld" i sluttteksten. Oversett alltid til klart norsk.

JURIDISK SPRÅK:
- Under punkt 10 kan du nevne mulige rettslige spor hvis relevant, men bare som forhold politiet/advokat eventuelt må vurdere.
- Hvis saken gjelder en privatperson, kan temaer som privatliv, identifisering, belastende omtale, forhåndsdømming og samtidig imøtegåelse være relevante dersom fakta tilsier det.
- Hvis saken gjelder en virksomhet, offentlig aktør, organisasjon eller selskap, skal du normalt ikke bruke privatlivets fred, uskyldspresumsjon, personvern, straffeloven § 266 eller straffeloven § 267 som hovedspor.
- I slike virksomhets- og organisasjonssaker skal punkt 10 normalt vektlegge: faktisk dekning, dokumentasjon, presisjon, kildegrunnlag, omdømmebelastning, tilsvar/imøtegåelse, presseetikk og eventuelt sivilt/erstatningsrettslig spor.
- I virksomhets- og organisasjonssaker skal politisporet omtales svært forsiktig. Skriv heller at saken primært synes å reise presseetiske og eventuelt sivile spørsmål, med mindre konkrete opplysninger tilsier annet.
- Privatlivets fred, uskyldspresumsjon, personvern, straffeloven § 266 og straffeloven § 267 skal bare nevnes dersom konkrete identifiserbare privatpersoner er omtalt, eller saksopplysningene klart tilsier at bestemmelsene kan være relevante.
- Ikke be politiet vurdere privatlivets fred eller hensynsløs opptreden i saker som bare gjelder en virksomhet/offentlig aktør og generell samfunnsdebatt, med mindre det finnes konkrete personrettede forhold.
- I saker som gjelder virksomhet, offentlig aktør, organisasjon eller selskap, skal punkt 12 normalt formulere at saken primært fremstår som presseetisk og eventuelt sivilrettslig, og at politisporet bare bør vurderes dersom konkrete straffbare forhold er dokumentert.
- Ikke bruk uttrykk som "straffeloven § 266", "straffelovgivning", "hensynsløs atferd" eller "privatlivets fred" i virksomhetssaker med mindre faktagrunnlaget klart gjelder identifiserbare privatpersoner eller konkrete personrettede handlinger.
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
${formatDocumentsForPrompt(documents)}

SISTE RAPPORT:
${jsonText(latestFullReport)}

SISTE PFU-KLAGEUTKAST:
${jsonText(latestPfuDraft)}

PFU-AVGJØRELSE / STATUS:
${jsonText(pfuDecision)}
`;

  try {
    const policeDraft = safeText(
      await callAiText({
        prompt,
        instructions: AI_DOCUMENT_ISOLATION_INSTRUCTIONS,
      })
    );

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

import { NextRequest, NextResponse } from "next/server";
import { assertCaseAccess } from "@/lib/access/assertCaseAccess";
import { requireUser } from "@/lib/supabase/authServer";
import { callAiJson, STRUCTURED_REPORT_INSTRUCTIONS } from "@/lib/ai/openai";
import { checkRateLimit } from "@/lib/rateLimit";
import { identifyDocumentationGaps } from "@/lib/evidence/documentationGaps";
import { buildReportSections, type ReportClaimInput, type ReportEventInput, type ReportWitnessInput } from "@/lib/report/buildReportSections";
import { buildReportAiPrompt } from "@/lib/report/buildReportAiPrompt";
import { validateReportAiPayload } from "@/lib/report/reportValidation";
import { assembleReportSections } from "@/lib/report/assembleReport";
import { getStructuredReportLegalRules } from "@/lib/legal/reportLegalRules";
import type { DocumentationStatus } from "@/lib/evidence/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const REPORT_COLUMNS =
  "id,case_id,version,report_type,status,summary,findings,recommendations,pfu_draft,sections,built_from,report_kind,created_at";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: caseId } = await context.params;

    if (!process.env.OPENAI_API_KEY) {
      return jsonError("OPENAI_API_KEY mangler i .env.local.", 500);
    }

    const auth = await requireUser(request);
    if (!auth.ok) return jsonError(auth.error, auth.status);

    const supabase = auth.supabase;

    const rateLimit = checkRateLimit(`generate-report:${auth.user.id}`, {
      max: RATE_LIMIT_MAX,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });

    if (!rateLimit.allowed) {
      return jsonError("For mange rapportgenereringer på kort tid. Vent litt og prøv igjen.", 429);
    }

    const { data: caseItem, error: caseError } = await supabase
      .from("cases")
      .select("id,title,status,media_name,article_title,article_url,published_date,short_description,user_id")
      .eq("id", caseId)
      .single();

    if (caseError || !caseItem) {
      return jsonError(`Fant ikke saken. Supabase-feil: ${caseError?.message ?? "Ingen data returnert"}`, 404);
    }

    const access = await assertCaseAccess({ userId: caseItem.user_id, caseId, capability: "report" });
    if (!access.ok) {
      return NextResponse.json({ error: access.error, requiredPackage: access.requiredPackage }, { status: access.status });
    }

    // --- Hent alt Evidence Engine-grunnlaget parallelt -----------------

    const [caseInputResult, claimsResult, eventsResult, witnessesResult, documentsResult, caseSummaryResult] = await Promise.all([
      supabase
        .from("case_inputs")
        .select("what_happened,your_role,reply_sent,reply_text,editor_response,legal_status,legal_status_details,desired_outcome")
        .eq("case_id", caseId)
        .maybeSingle(),
      supabase.from("claims").select("id,text,no_evidence_confirmed_at").eq("case_id", caseId).is("deleted_at", null),
      supabase
        .from("events")
        .select("id,title,description,event_date,event_time,date_precision,approximate_label")
        .eq("case_id", caseId)
        .is("deleted_at", null),
      supabase
        .from("witnesses")
        .select("id,name,identity_status,relationship_to_case,witness_accounts(id,description,observation_type,event_id,deleted_at)")
        .eq("case_id", caseId)
        .is("deleted_at", null),
      supabase
        .from("case_documents")
        .select("id,title")
        .eq("case_id", caseId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
      supabase.from("case_summaries").select("id,best_documented_summary,partially_documented_summary,conflicts_summary,key_gaps_summary,strengthen_areas_summary").eq("case_id", caseId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (claimsResult.error) return jsonError(claimsResult.error.message, 500);
    if (eventsResult.error) return jsonError(eventsResult.error.message, 500);
    if (witnessesResult.error) return jsonError(witnessesResult.error.message, 500);
    if (documentsResult.error) return jsonError(documentsResult.error.message, 500);

    const rawClaims = (claimsResult.data ?? []) as { id: string; text: string; no_evidence_confirmed_at: string | null }[];
    const rawEvents = (eventsResult.data ?? []) as {
      id: string;
      title: string;
      description: string | null;
      event_date: string | null;
      event_time: string | null;
      date_precision: ReportEventInput["datePrecision"];
      approximate_label: string | null;
    }[];
    type RawWitnessAccount = { id: string; description: string; observation_type: ReportWitnessInput["accounts"][number]["observationType"]; event_id: string | null; deleted_at: string | null };
    const rawWitnesses = (witnessesResult.data ?? []) as {
      id: string;
      name: string | null;
      identity_status: ReportWitnessInput["identityStatus"];
      relationship_to_case: string | null;
      witness_accounts: RawWitnessAccount[] | null;
    }[];
    const documents = (documentsResult.data ?? []) as { id: string; title: string }[];

    const claimIds = rawClaims.map((c) => c.id);
    const eventIds = rawEvents.map((e) => e.id);
    const documentIds = documents.map((d) => d.id);
    const accountIds = rawWitnesses.flatMap((w) => (w.witness_accounts ?? []).filter((a) => !a.deleted_at).map((a) => a.id));

    const [
      evidenceLinksResult,
      assessmentsResult,
      eventClaimLinksResult,
      eventDocumentLinksResult,
      witnessClaimLinksResult,
      witnessDocumentLinksResult,
      documentFactsResult,
    ] = await Promise.all([
      claimIds.length ? supabase.from("claim_evidence_links").select("claim_id,document_id").in("claim_id", claimIds) : Promise.resolve({ data: [], error: null }),
      claimIds.length
        ? supabase
            .from("claim_assessments")
            .select("claim_id,status,what_it_shows,supports_summary,contradicts_summary,not_documented_summary,conflicts_between_evidence,confidence,confidence_reasoning,evidence_breakdown,timeline_note,corroboration_note,created_at")
            .in("claim_id", claimIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      claimIds.length ? supabase.from("event_claim_links").select("event_id,claim_id").in("claim_id", claimIds) : Promise.resolve({ data: [], error: null }),
      eventIds.length ? supabase.from("event_document_links").select("event_id,document_id").in("event_id", eventIds) : Promise.resolve({ data: [], error: null }),
      accountIds.length ? supabase.from("witness_account_claim_links").select("witness_account_id,claim_id").in("witness_account_id", accountIds) : Promise.resolve({ data: [], error: null }),
      accountIds.length ? supabase.from("witness_account_document_links").select("witness_account_id,document_id").in("witness_account_id", accountIds) : Promise.resolve({ data: [], error: null }),
      documentIds.length ? supabase.from("document_facts").select("document_id,occurred_at_date").in("document_id", documentIds) : Promise.resolve({ data: [], error: null }),
    ]);

    if (evidenceLinksResult.error) return jsonError(evidenceLinksResult.error.message, 500);
    if (assessmentsResult.error) return jsonError(assessmentsResult.error.message, 500);
    if (eventClaimLinksResult.error) return jsonError(eventClaimLinksResult.error.message, 500);
    if (eventDocumentLinksResult.error) return jsonError(eventDocumentLinksResult.error.message, 500);
    if (witnessClaimLinksResult.error) return jsonError(witnessClaimLinksResult.error.message, 500);
    if (witnessDocumentLinksResult.error) return jsonError(witnessDocumentLinksResult.error.message, 500);
    if (documentFactsResult.error) return jsonError(documentFactsResult.error.message, 500);

    const evidenceLinks = (evidenceLinksResult.data ?? []) as { claim_id: string; document_id: string }[];
    const eventClaimLinks = (eventClaimLinksResult.data ?? []) as { event_id: string; claim_id: string }[];
    const eventDocumentLinks = (eventDocumentLinksResult.data ?? []) as { event_id: string; document_id: string }[];
    const witnessClaimLinks = (witnessClaimLinksResult.data ?? []) as { witness_account_id: string; claim_id: string }[];
    const witnessDocumentLinks = (witnessDocumentLinksResult.data ?? []) as { witness_account_id: string; document_id: string }[];
    const documentFacts = (documentFactsResult.data ?? []) as { document_id: string; occurred_at_date: string | null }[];

    const evidenceByClaimId = new Map<string, string[]>();
    for (const link of evidenceLinks) {
      const list = evidenceByClaimId.get(link.claim_id) ?? [];
      list.push(link.document_id);
      evidenceByClaimId.set(link.claim_id, list);
    }

    const latestAssessmentByClaimId = new Map<string, ReportClaimInput["latestAssessment"]>();
    for (const row of (assessmentsResult.data ?? []) as {
      claim_id: string;
      status: Exclude<DocumentationStatus, "not_assessed">;
      what_it_shows: string;
      supports_summary: string | null;
      contradicts_summary: string | null;
      not_documented_summary: string;
      conflicts_between_evidence: string | null;
      confidence: "high" | "medium" | "low";
      confidence_reasoning: string;
      evidence_breakdown: unknown;
      timeline_note: string | null;
      corroboration_note: string | null;
    }[]) {
      if (latestAssessmentByClaimId.has(row.claim_id)) continue;
      latestAssessmentByClaimId.set(row.claim_id, {
        status: row.status,
        whatItShows: row.what_it_shows,
        supportsSummary: row.supports_summary,
        contradictsSummary: row.contradicts_summary,
        notDocumentedSummary: row.not_documented_summary,
        conflictsBetweenEvidence: row.conflicts_between_evidence,
        confidence: row.confidence,
        confidenceReasoning: row.confidence_reasoning,
        evidenceBreakdown: Array.isArray(row.evidence_breakdown)
          ? (row.evidence_breakdown as { document_id?: string; documentId?: string; verdict: "supports" | "contradicts" | "silent"; note: string }[])
              .map((item) => ({ documentId: item.document_id ?? item.documentId ?? "", verdict: item.verdict, note: item.note }))
              .filter((item) => item.documentId)
          : [],
        timelineNote: row.timeline_note,
        corroborationNote: row.corroboration_note,
      });
    }

    const eventCountByClaimId = new Map<string, string[]>();
    for (const link of eventClaimLinks) {
      const list = eventCountByClaimId.get(link.claim_id) ?? [];
      if (!list.includes(link.event_id)) list.push(link.event_id);
      eventCountByClaimId.set(link.claim_id, list);
    }

    const documentIdsByEventId = new Map<string, string[]>();
    for (const link of eventDocumentLinks) {
      const list = documentIdsByEventId.get(link.event_id) ?? [];
      list.push(link.document_id);
      documentIdsByEventId.set(link.event_id, list);
    }

    const claimIdsByAccountId = new Map<string, string[]>();
    for (const link of witnessClaimLinks) {
      const list = claimIdsByAccountId.get(link.witness_account_id) ?? [];
      list.push(link.claim_id);
      claimIdsByAccountId.set(link.witness_account_id, list);
    }

    const hasWrittenStatementByAccountId = new Set(witnessDocumentLinks.map((l) => l.witness_account_id));
    const occurredAtDateByDocumentId = new Map(documentFacts.map((f) => [f.document_id, f.occurred_at_date]));

    // --- Bygg de deterministiske rapport-inputene -----------------------

    const claims: ReportClaimInput[] = rawClaims.map((claim) => ({
      id: claim.id,
      text: claim.text,
      noEvidenceConfirmedAt: claim.no_evidence_confirmed_at,
      evidenceDocumentIds: evidenceByClaimId.get(claim.id) ?? [],
      latestAssessment: latestAssessmentByClaimId.get(claim.id) ?? null,
    }));

    const events: ReportEventInput[] = rawEvents.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventDate: event.event_date,
      eventTime: event.event_time,
      datePrecision: event.date_precision,
      approximateLabel: event.approximate_label,
      documentIds: documentIdsByEventId.get(event.id) ?? [],
    }));

    const witnesses: ReportWitnessInput[] = rawWitnesses.map((witness) => ({
      id: witness.id,
      name: witness.name,
      identityStatus: witness.identity_status,
      relationshipToCase: witness.relationship_to_case,
      accounts: (witness.witness_accounts ?? [])
        .filter((a) => !a.deleted_at)
        .map((account) => ({
          description: account.description,
          observationType: account.observation_type,
          hasWrittenStatement: hasWrittenStatementByAccountId.has(account.id),
          eventId: account.event_id,
          linkedClaimIds: claimIdsByAccountId.get(account.id) ?? [],
        })),
    }));

    const reportDocuments = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      occurredAtDate: occurredAtDateByDocumentId.get(doc.id) ?? null,
    }));

    const gaps = identifyDocumentationGaps({
      claims: claims.map((claim) => ({
        id: claim.id,
        text: claim.text,
        noEvidenceConfirmedAt: claim.noEvidenceConfirmedAt,
        evidenceCount: claim.evidenceDocumentIds.length,
        eventCount: (eventCountByClaimId.get(claim.id) ?? []).length,
        latestAssessmentStatus: claim.latestAssessment?.status ?? null,
      })),
      events: events.map((event) => ({ id: event.id, title: event.title, documentCount: event.documentIds.length })),
      witnessAccounts: witnesses.flatMap((witness) =>
        witness.accounts.map((account, index) => ({
          id: `${witness.id}-${index}`,
          witnessName: witness.name,
          documentCount: account.hasWrittenStatement ? 1 : 0,
        }))
      ),
    });

    const caseSummaryRow = caseSummaryResult.data as
      | {
          id: string;
          best_documented_summary: string | null;
          partially_documented_summary: string | null;
          conflicts_summary: string | null;
          key_gaps_summary: string | null;
          strengthen_areas_summary: string | null;
        }
      | null
      | undefined;

    const { sections: deterministicSections, documentRefs, builtFrom } = buildReportSections({
      claims,
      events,
      documents: reportDocuments,
      witnesses,
      gaps,
      caseSummaryId: caseSummaryRow?.id ?? null,
    });

    // --- KI-lag: kun sammendrag/bakgrunn/regelverk/konklusjon -----------

    const legalRules = getStructuredReportLegalRules();
    const caseInput = caseInputResult.data as
      | {
          what_happened: string | null;
          your_role: string | null;
          reply_sent: boolean | null;
          reply_text: string | null;
          editor_response: string | null;
          legal_status: string | null;
          legal_status_details: string | null;
          desired_outcome: string | null;
        }
      | null
      | undefined;

    const documentedSection = deterministicSections.find((s) => s.kind === "documented_findings");
    const partialSection = deterministicSections.find((s) => s.kind === "partially_documented");
    const conflictsSection = deterministicSections.find((s) => s.kind === "conflicts");
    const gapsSection = deterministicSections.find((s) => s.kind === "documentation_gaps");
    const timelineSection = deterministicSections.find((s) => s.kind === "timeline");

    const prompt = buildReportAiPrompt({
      caseTitle: caseItem.title,
      background: {
        whatHappened: caseInput?.what_happened ?? null,
        yourRole: caseInput?.your_role ?? null,
        replySent: Boolean(caseInput?.reply_sent),
        replyText: caseInput?.reply_text ?? null,
        editorResponse: caseInput?.editor_response ?? null,
        legalStatus: caseInput?.legal_status ?? null,
        legalStatusDetails: caseInput?.legal_status_details ?? null,
        desiredOutcome: caseInput?.desired_outcome ?? null,
      },
      documented: documentedSection?.kind === "documented_findings" ? documentedSection.findings : [],
      partiallyDocumented: partialSection?.kind === "partially_documented" ? partialSection.findings : [],
      conflicting: conflictsSection?.kind === "conflicts" ? conflictsSection.findings : [],
      gaps: gapsSection?.kind === "documentation_gaps" ? gapsSection.gaps : [],
      timelineEntries: timelineSection?.kind === "timeline" ? timelineSection.entries : [],
      documentRefs,
      legalRules,
    });

    let validatedAi;
    try {
      const raw = await callAiJson({ prompt, instructions: STRUCTURED_REPORT_INSTRUCTIONS });
      validatedAi = validateReportAiPayload(
        raw,
        documentRefs.map((ref) => ref.documentId),
        legalRules.map((rule) => rule.id)
      );
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "KI-generering av rapporten feilet.", 502);
    }

    if (!validatedAi) {
      return jsonError("KI-svaret hadde ikke forventet format og ble forkastet.", 502);
    }

    const finalSections = assembleReportSections({
      deterministicSections,
      ai: validatedAi,
      legalRules,
      documentRefs,
      caseSummary: caseSummaryRow
        ? {
            bestDocumentedSummary: caseSummaryRow.best_documented_summary,
            partiallyDocumentedSummary: caseSummaryRow.partially_documented_summary,
            conflictsSummary: caseSummaryRow.conflicts_summary,
            keyGapsSummary: caseSummaryRow.key_gaps_summary,
            strengthenAreasSummary: caseSummaryRow.strengthen_areas_summary,
          }
        : null,
    });

    const { data: existingReports } = await supabase.from("case_reports").select("version").eq("case_id", caseId).order("version", { ascending: false });

    const nextVersion = existingReports && existingReports.length > 0 ? Math.max(...existingReports.map((report) => report.version ?? 0)) + 1 : 1;

    const { data: savedReport, error: saveError } = await supabase
      .from("case_reports")
      .insert({
        case_id: caseId,
        version: nextVersion,
        report_type: "full_report",
        summary: validatedAi.summary,
        // findings/recommendations er NOT NULL på case_reports (legacy-
        // kolonner fra før strukturerte seksjoner fantes) - tomme arrays,
        // ikke null, siden det reelle innholdet nå ligger i `sections`.
        findings: [],
        recommendations: [],
        sections: finalSections,
        built_from: builtFrom,
        report_kind: "structured",
        status: "ready",
      })
      .select(REPORT_COLUMNS)
      .single();

    if (saveError) {
      return jsonError(`Kunne ikke lagre rapporten: ${saveError.message}`, 500);
    }

    await supabase.from("cases").update({ status: "report_ready" }).eq("id", caseId);

    // Rå rad (samme snake_case-kontrakt som resten av case_reports-bruken i
    // koden, f.eks. rapport-siden) - sections/built_from er allerede
    // camelCase-strukturert JSON internt, klienten normaliserer dem selv.
    return NextResponse.json({ report: savedReport });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukjent feil ved rapportgenerering.";
    return jsonError(message, 500);
  }
}

import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { assertOwnsCase } from "@/lib/access/assertOwnsCase";
import {
  mapAssessmentRow,
  mapClaimRow,
  mapEvidenceLinkRow,
  mapWitnessAccountClaimLinkRow,
  type ClaimAssessmentRow,
  type ClaimEvidenceLinkRow,
  type ClaimRow,
  type WitnessAccountClaimLinkRow,
} from "@/lib/evidence/mappers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const CLAIM_SELECT =
  "id,case_id,user_id,text,source_type,no_evidence_confirmed_at,created_at,updated_at,deleted_at";

type EvidenceDocumentSummary = {
  id: string;
  title: string;
  document_type: string;
  file_name: string;
  extraction_status: string;
  mime_type: string | null;
};

type EvidenceLinkWithDocument = ClaimEvidenceLinkRow & {
  case_documents: EvidenceDocumentSummary | EvidenceDocumentSummary[] | null;
};

function firstDocument(
  value: EvidenceDocumentSummary | EvidenceDocumentSummary[] | null
): EvidenceDocumentSummary | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId } = await context.params;

  const caseCheck = await assertOwnsCase(auth.supabase, caseId);
  if (!caseCheck.ok) return jsonError(caseCheck.error, 404);

  const { data: claimRows, error: claimsError } = await auth.supabase
    .from("claims")
    .select(CLAIM_SELECT)
    .eq("case_id", caseId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (claimsError) return jsonError(claimsError.message, 500);

  const claims = (claimRows ?? []) as ClaimRow[];
  const claimIds = claims.map((claim) => claim.id);

  if (claimIds.length === 0) {
    return jsonOk({ claims: [] });
  }

  const [linksResult, assessmentsResult, witnessLinksResult] = await Promise.all([
    auth.supabase
      .from("claim_evidence_links")
      .select(
        "id,claim_id,document_id,linked_by,created_at,case_documents(id,title,document_type,file_name,extraction_status,mime_type)"
      )
      .in("claim_id", claimIds),
    auth.supabase
      .from("claim_assessments")
      .select(
        "id,claim_id,what_it_shows,supports_summary,contradicts_summary,not_documented_summary,conflicts_between_evidence,timeline_note,witness_breakdown,corroboration_note,status,confidence,confidence_reasoning,evidence_breakdown,evidence_ids_considered,model,created_at"
      )
      .in("claim_id", claimIds)
      .order("created_at", { ascending: false }),
    auth.supabase
      .from("witness_account_claim_links")
      .select(
        "id,witness_account_id,claim_id,linked_by,created_at,witness_accounts(id,description,witnesses(name))"
      )
      .in("claim_id", claimIds),
  ]);

  if (linksResult.error) return jsonError(linksResult.error.message, 500);
  if (assessmentsResult.error) return jsonError(assessmentsResult.error.message, 500);
  if (witnessLinksResult.error) return jsonError(witnessLinksResult.error.message, 500);

  const linksByClaimId = new Map<string, EvidenceLinkWithDocument[]>();
  for (const row of (linksResult.data ?? []) as EvidenceLinkWithDocument[]) {
    const list = linksByClaimId.get(row.claim_id) ?? [];
    list.push(row);
    linksByClaimId.set(row.claim_id, list);
  }

  // assessments er hentet nyeste-først - første treff per claim_id er
  // dermed alltid siste vurdering.
  const latestAssessmentByClaimId = new Map<string, ClaimAssessmentRow>();
  for (const row of (assessmentsResult.data ?? []) as ClaimAssessmentRow[]) {
    if (!latestAssessmentByClaimId.has(row.claim_id)) {
      latestAssessmentByClaimId.set(row.claim_id, row);
    }
  }

  type WitnessAccountSummary = { id: string; description: string; witnesses: { name: string | null } | { name: string | null }[] | null };
  type WitnessLinkWithAccount = WitnessAccountClaimLinkRow & {
    witness_accounts: WitnessAccountSummary | WitnessAccountSummary[] | null;
  };

  const witnessLinksByClaimId = new Map<string, WitnessLinkWithAccount[]>();
  for (const row of (witnessLinksResult.data ?? []) as WitnessLinkWithAccount[]) {
    const list = witnessLinksByClaimId.get(row.claim_id) ?? [];
    list.push(row);
    witnessLinksByClaimId.set(row.claim_id, list);
  }

  const result = claims.map((claimRow) => {
    const links = linksByClaimId.get(claimRow.id) ?? [];
    const latestAssessmentRow = latestAssessmentByClaimId.get(claimRow.id);
    const witnessLinks = witnessLinksByClaimId.get(claimRow.id) ?? [];

    return {
      ...mapClaimRow(claimRow),
      evidence: links.map((link) => {
        const document = firstDocument(link.case_documents);

        return {
          ...mapEvidenceLinkRow(link),
          document: document
            ? {
                id: document.id,
                title: document.title,
                documentType: document.document_type,
                fileName: document.file_name,
                extractionStatus: document.extraction_status,
                mimeType: document.mime_type,
              }
            : null,
        };
      }),
      witnesses: witnessLinks.map((link) => {
        const account = Array.isArray(link.witness_accounts) ? link.witness_accounts[0] : link.witness_accounts;
        const witness = account ? (Array.isArray(account.witnesses) ? account.witnesses[0] : account.witnesses) : null;

        return {
          ...mapWitnessAccountClaimLinkRow(link),
          witnessAccount: account
            ? { id: account.id, description: account.description, witnessName: witness?.name ?? null }
            : null,
        };
      }),
      latestAssessment: latestAssessmentRow ? mapAssessmentRow(latestAssessmentRow) : null,
    };
  });

  return jsonOk({ claims: result });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId } = await context.params;

  const caseCheck = await assertOwnsCase(auth.supabase, caseId);
  if (!caseCheck.ok) return jsonError(caseCheck.error, 404);

  const body = (await request.json().catch(() => ({}))) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return jsonError("Opplysningen kan ikke være tom.", 400);
  }

  if (text.length > 4000) {
    return jsonError("Opplysningen er for lang (maks 4000 tegn). Del den gjerne opp i flere.", 400);
  }

  const { data: inserted, error: insertError } = await auth.supabase
    .from("claims")
    .insert({
      case_id: caseId,
      user_id: auth.user.id,
      text,
      source_type: "user_statement",
    })
    .select(CLAIM_SELECT)
    .single();

  if (insertError || !inserted) {
    return jsonError(insertError?.message ?? "Kunne ikke lagre opplysningen.", 500);
  }

  return jsonOk({
    claim: { ...mapClaimRow(inserted as ClaimRow), evidence: [], witnesses: [], latestAssessment: null },
  });
}

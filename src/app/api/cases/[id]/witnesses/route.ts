import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { assertOwnsCase } from "@/lib/access/assertOwnsCase";
import {
  mapWitnessAccountClaimLinkRow,
  mapWitnessAccountDocumentLinkRow,
  mapWitnessAccountRow,
  mapWitnessRow,
  type WitnessAccountClaimLinkRow,
  type WitnessAccountDocumentLinkRow,
  type WitnessAccountRow,
  type WitnessRow,
} from "@/lib/evidence/mappers";
import type { WitnessIdentityStatus } from "@/lib/evidence/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const WITNESS_SELECT =
  "id,case_id,user_id,identity_status,name,contact_info,relationship_to_case,note,created_at,updated_at,deleted_at";
const ACCOUNT_SELECT =
  "id,witness_id,case_id,user_id,description,observation_type,event_id,created_at,updated_at,deleted_at";

const IDENTITY_STATUSES = new Set<WitnessIdentityStatus>(["possible", "named", "anonymous"]);

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId } = await context.params;

  const caseCheck = await assertOwnsCase(auth.supabase, caseId);
  if (!caseCheck.ok) return jsonError(caseCheck.error, 404);

  const { data: witnessRows, error: witnessesError } = await auth.supabase
    .from("witnesses")
    .select(WITNESS_SELECT)
    .eq("case_id", caseId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (witnessesError) return jsonError(witnessesError.message, 500);

  const witnesses = (witnessRows ?? []) as WitnessRow[];
  const witnessIds = witnesses.map((w) => w.id);

  if (witnessIds.length === 0) {
    return jsonOk({ witnesses: [] });
  }

  const { data: accountRows, error: accountsError } = await auth.supabase
    .from("witness_accounts")
    .select(ACCOUNT_SELECT)
    .in("witness_id", witnessIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (accountsError) return jsonError(accountsError.message, 500);

  const accounts = (accountRows ?? []) as WitnessAccountRow[];
  const accountIds = accounts.map((a) => a.id);

  const [claimLinksResult, documentLinksResult] = accountIds.length
    ? await Promise.all([
        auth.supabase
          .from("witness_account_claim_links")
          .select("id,witness_account_id,claim_id,linked_by,created_at,claims(id,text)")
          .in("witness_account_id", accountIds),
        auth.supabase
          .from("witness_account_document_links")
          .select("id,witness_account_id,document_id,linked_by,created_at,case_documents(id,title)")
          .in("witness_account_id", accountIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];

  if (claimLinksResult.error) return jsonError(claimLinksResult.error.message, 500);
  if (documentLinksResult.error) return jsonError(documentLinksResult.error.message, 500);

  type ClaimLinkWithClaim = WitnessAccountClaimLinkRow & {
    claims: { id: string; text: string } | { id: string; text: string }[] | null;
  };
  type DocumentLinkWithDocument = WitnessAccountDocumentLinkRow & {
    case_documents: { id: string; title: string } | { id: string; title: string }[] | null;
  };

  function first<T>(value: T | T[] | null): T | null {
    if (!value) return null;
    return Array.isArray(value) ? (value[0] ?? null) : value;
  }

  const claimLinksByAccount = new Map<string, ClaimLinkWithClaim[]>();
  for (const row of (claimLinksResult.data ?? []) as ClaimLinkWithClaim[]) {
    const list = claimLinksByAccount.get(row.witness_account_id) ?? [];
    list.push(row);
    claimLinksByAccount.set(row.witness_account_id, list);
  }

  const documentLinksByAccount = new Map<string, DocumentLinkWithDocument[]>();
  for (const row of (documentLinksResult.data ?? []) as DocumentLinkWithDocument[]) {
    const list = documentLinksByAccount.get(row.witness_account_id) ?? [];
    list.push(row);
    documentLinksByAccount.set(row.witness_account_id, list);
  }

  const accountsByWitness = new Map<string, WitnessAccountRow[]>();
  for (const account of accounts) {
    const list = accountsByWitness.get(account.witness_id) ?? [];
    list.push(account);
    accountsByWitness.set(account.witness_id, list);
  }

  const result = witnesses.map((witnessRow) => ({
    ...mapWitnessRow(witnessRow),
    accounts: (accountsByWitness.get(witnessRow.id) ?? []).map((accountRow) => {
      const claimLinks = claimLinksByAccount.get(accountRow.id) ?? [];
      const documentLinks = documentLinksByAccount.get(accountRow.id) ?? [];

      return {
        ...mapWitnessAccountRow(accountRow),
        claims: claimLinks.map((link) => ({
          ...mapWitnessAccountClaimLinkRow(link),
          claim: first(link.claims),
        })),
        documents: documentLinks.map((link) => ({
          ...mapWitnessAccountDocumentLinkRow(link),
          document: first(link.case_documents),
        })),
      };
    }),
  }));

  return jsonOk({ witnesses: result });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId } = await context.params;

  const caseCheck = await assertOwnsCase(auth.supabase, caseId);
  if (!caseCheck.ok) return jsonError(caseCheck.error, 404);

  const body = (await request.json().catch(() => ({}))) as {
    identityStatus?: unknown;
    name?: unknown;
    contactInfo?: unknown;
    relationshipToCase?: unknown;
    note?: unknown;
  };

  const identityStatus: WitnessIdentityStatus =
    typeof body.identityStatus === "string" && IDENTITY_STATUSES.has(body.identityStatus as WitnessIdentityStatus)
      ? (body.identityStatus as WitnessIdentityStatus)
      : "possible";

  if (identityStatus === "named" && !(typeof body.name === "string" && body.name.trim())) {
    return jsonError("Et navngitt vitne må ha et navn.", 400);
  }

  const { data: inserted, error: insertError } = await auth.supabase
    .from("witnesses")
    .insert({
      case_id: caseId,
      user_id: auth.user.id,
      identity_status: identityStatus,
      name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : null,
      contact_info: typeof body.contactInfo === "string" && body.contactInfo.trim() ? body.contactInfo.trim() : null,
      relationship_to_case:
        typeof body.relationshipToCase === "string" && body.relationshipToCase.trim()
          ? body.relationshipToCase.trim()
          : null,
      note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : null,
    })
    .select(WITNESS_SELECT)
    .single();

  if (insertError || !inserted) {
    return jsonError(insertError?.message ?? "Kunne ikke lagre vitnet.", 500);
  }

  return jsonOk({ witness: { ...mapWitnessRow(inserted as WitnessRow), accounts: [] } });
}

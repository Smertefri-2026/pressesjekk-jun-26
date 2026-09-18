"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Card,
  Badge,
  Button,
  LoadingState,
  EmptyState,
  ErrorBanner,
} from "@/components/design-system";
import type { ObservationType, WitnessIdentityStatus } from "@/lib/evidence/types";

type WitnessAccountView = {
  id: string;
  description: string;
  observationType: ObservationType;
  eventId: string | null;
  claims: { id: string; claimId: string; claim: { id: string; text: string } | null }[];
  documents: { id: string; documentId: string; document: { id: string; title: string } | null }[];
};

type WitnessView = {
  id: string;
  identityStatus: WitnessIdentityStatus;
  name: string | null;
  relationshipToCase: string | null;
  accounts: WitnessAccountView[];
};

type AvailableClaim = { id: string; text: string };
type AvailableDocument = { id: string; title: string };

type Props = {
  caseId: string;
  title?: string;
  description?: string;
  onFocusWitness?: (witnessAccountId: string, witnessLabel: string) => void;
};

const IDENTITY_OPTIONS: { value: WitnessIdentityStatus; label: string }[] = [
  { value: "possible", label: "Mulig vitne (ikke bekreftet)" },
  { value: "named", label: "Navngitt vitne" },
  { value: "anonymous", label: "Anonymisert vitne" },
];

function identityLabel(status: WitnessIdentityStatus) {
  return IDENTITY_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

async function getAuthHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Innloggingen kunne ikke bekreftes. Last siden på nytt.");
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

export function WitnessesPanel({
  caseId,
  title = "Vitner",
  description = "Registrer personer som kan bekrefte deler av saken - også hvis du er usikker på om de faktisk kan eller vil bekrefte noe ennå.",
  onFocusWitness,
}: Props) {
  const [witnesses, setWitnesses] = useState<WitnessView[]>([]);
  const [availableClaims, setAvailableClaims] = useState<AvailableClaim[]>([]);
  const [availableDocuments, setAvailableDocuments] = useState<AvailableDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [formIdentityStatus, setFormIdentityStatus] = useState<WitnessIdentityStatus>("possible");
  const [formName, setFormName] = useState("");
  const [formRelationship, setFormRelationship] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const headers = await getAuthHeader();
      const [witnessesRes, claimsRes, documentsRes] = await Promise.all([
        fetch(`/api/cases/${caseId}/witnesses`, { headers }),
        fetch(`/api/cases/${caseId}/claims`, { headers }),
        fetch(`/api/cases/${caseId}/documents`, { headers }),
      ]);

      const [witnessesJson, claimsJson, documentsJson] = await Promise.all([
        witnessesRes.json(),
        claimsRes.json(),
        documentsRes.json(),
      ]);

      if (!witnessesRes.ok) throw new Error(witnessesJson?.error ?? "Kunne ikke hente vitner.");
      if (!claimsRes.ok) throw new Error(claimsJson?.error ?? "Kunne ikke hente opplysninger.");
      if (!documentsRes.ok) throw new Error(documentsJson?.error ?? "Kunne ikke hente dokumenter.");

      setWitnesses(witnessesJson.witnesses ?? []);
      setAvailableClaims((claimsJson.claims ?? []).map((c: AvailableClaim) => ({ id: c.id, text: c.text })));
      setAvailableDocuments(
        (documentsJson.documents ?? []).map((d: { id: string; title: string }) => ({ id: d.id, title: d.title }))
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke laste vitner.");
    }
  }, [caseId]);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await loadAll();
      setIsLoading(false);
    }
    init();
  }, [loadAll]);

  async function handleCreateWitness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (formIdentityStatus === "named" && !formName.trim()) {
      setErrorMessage("Et navngitt vitne må ha et navn.");
      return;
    }

    setIsCreating(true);
    setErrorMessage("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/witnesses`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          identityStatus: formIdentityStatus,
          name: formName.trim() || undefined,
          relationshipToCase: formRelationship.trim() || undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke lagre vitnet.");

      setWitnesses((current) => [...current, result.witness]);
      setFormName("");
      setFormRelationship("");
      setFormIdentityStatus("possible");
      setShowCreateForm(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke lagre vitnet.");
    } finally {
      setIsCreating(false);
    }
  }

  function updateWitnessInState(witnessId: string, updater: (witness: WitnessView) => WitnessView) {
    setWitnesses((current) => current.map((w) => (w.id === witnessId ? updater(w) : w)));
  }

  return (
    <Card padding="lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">{title}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowCreateForm((c) => !c)}>
          {showCreateForm ? "Lukk" : "+ Nytt vitne"}
        </Button>
      </div>

      {errorMessage ? <ErrorBanner message={errorMessage} className="mt-4" /> : null}

      {showCreateForm ? (
        <form onSubmit={handleCreateWitness} className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <label className="text-xs font-bold text-slate-700">Type</label>
            <select
              value={formIdentityStatus}
              onChange={(event) => setFormIdentityStatus(event.target.value as WitnessIdentityStatus)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
            >
              {IDENTITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {formIdentityStatus === "named" ? (
            <div>
              <label className="text-xs font-bold text-slate-700">Navn</label>
              <input
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
              />
            </div>
          ) : null}

          <div>
            <label className="text-xs font-bold text-slate-700">Relasjon til saken (valgfritt)</label>
            <input
              value={formRelationship}
              onChange={(event) => setFormRelationship(event.target.value)}
              placeholder="F.eks. kollega, nabo, tilstede på møtet"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
            />
          </div>

          <Button type="submit" size="sm" disabled={isCreating}>
            {isCreating ? "Lagrer..." : "Legg til vitne"}
          </Button>
        </form>
      ) : null}

      <div className="mt-6 space-y-3">
        {isLoading ? <LoadingState message="Laster vitner..." /> : null}

        {!isLoading && witnesses.length === 0 ? (
          <EmptyState
            title="Ingen vitner registrert ennå"
            description="Legg til personer som kan bekrefte deler av saken, selv om du er usikker på om de faktisk kan eller vil bekrefte noe."
          />
        ) : null}

        {witnesses.map((witness) => (
          <WitnessRow
            key={witness.id}
            caseId={caseId}
            witness={witness}
            availableClaims={availableClaims}
            availableDocuments={availableDocuments}
            onWitnessUpdated={(updated) => updateWitnessInState(witness.id, () => updated)}
            onError={setErrorMessage}
            onFocusWitness={onFocusWitness}
          />
        ))}
      </div>
    </Card>
  );
}

function WitnessRow({
  caseId,
  witness,
  availableClaims,
  availableDocuments,
  onWitnessUpdated,
  onError,
  onFocusWitness,
}: {
  caseId: string;
  witness: WitnessView;
  availableClaims: AvailableClaim[];
  availableDocuments: AvailableDocument[];
  onWitnessUpdated: (witness: WitnessView) => void;
  onError: (message: string) => void;
  onFocusWitness?: (witnessAccountId: string, witnessLabel: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [accountDescription, setAccountDescription] = useState("");
  const [accountObservationType, setAccountObservationType] = useState<ObservationType>("direct");

  const hasWrittenStatement = witness.accounts.some((account) => account.documents.length > 0);

  async function addAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const description = accountDescription.trim();
    if (!description) return;

    setIsBusy(true);
    onError("");

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/cases/${caseId}/witnesses/${witness.id}/accounts`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ description, observationType: accountObservationType }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke lagre vitneopplysningen.");

      onWitnessUpdated({ ...witness, accounts: [...witness.accounts, result.account] });
      setAccountDescription("");
      setIsAddingAccount(false);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke lagre vitneopplysningen.");
    } finally {
      setIsBusy(false);
    }
  }

  function updateAccount(accountId: string, updater: (account: WitnessAccountView) => WitnessAccountView) {
    onWitnessUpdated({
      ...witness,
      accounts: witness.accounts.map((a) => (a.id === accountId ? updater(a) : a)),
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex w-full flex-wrap items-center justify-between gap-2 p-4">
        <button type="button" onClick={() => setIsExpanded((c) => !c)} className="min-w-0 flex-1 text-left">
          <p className="font-bold text-slate-950">{witness.name || identityLabel(witness.identityStatus)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {identityLabel(witness.identityStatus)}
            {witness.relationshipToCase ? ` · ${witness.relationshipToCase}` : ""} · {witness.accounts.length}{" "}
            {witness.accounts.length === 1 ? "opplysning" : "opplysninger"}
          </p>
        </button>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {hasWrittenStatement ? (
            <Badge tone="success">Skriftlig erklæring finnes</Badge>
          ) : (
            <Badge tone="neutral">Ingen erklæring ennå</Badge>
          )}
          {onFocusWitness && witness.accounts.length > 0 ? (
            <button
              type="button"
              onClick={() => onFocusWitness(witness.accounts[0].id, witness.name || identityLabel(witness.identityStatus))}
              className="text-xs font-bold text-red-700 hover:underline"
            >
              🔍 Vis dokumentasjon
            </button>
          ) : null}
          <button type="button" onClick={() => setIsExpanded((c) => !c)} className="text-slate-400">
            {isExpanded ? "−" : "+"}
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="border-t border-slate-200 p-4">
          {witness.accounts.map((account) => (
            <WitnessAccountCard
              key={account.id}
              caseId={caseId}
              witnessId={witness.id}
              account={account}
              availableClaims={availableClaims}
              availableDocuments={availableDocuments}
              onAccountUpdated={(updated) => updateAccount(account.id, () => updated)}
              onError={onError}
            />
          ))}

          <button
            type="button"
            onClick={() => setIsAddingAccount((c) => !c)}
            className="mt-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-slate-100"
          >
            {isAddingAccount ? "Lukk" : "+ Legg til hva vitnet kan forklare"}
          </button>

          {isAddingAccount ? (
            <form onSubmit={addAccount} className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Hva observerte personen?</label>
                <textarea
                  value={accountDescription}
                  onChange={(event) => setAccountDescription(event.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Var personen direkte til stede?</label>
                <select
                  value={accountObservationType}
                  onChange={(event) => setAccountObservationType(event.target.value as ObservationType)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500"
                >
                  <option value="direct">Ja, direkte observasjon</option>
                  <option value="secondhand">Nei, kun annenhåndsinformasjon (hørt fra andre)</option>
                </select>
              </div>
              <Button type="submit" size="sm" disabled={isBusy || !accountDescription.trim()}>
                Lagre
              </Button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function WitnessAccountCard({
  caseId,
  witnessId,
  account,
  availableClaims,
  availableDocuments,
  onAccountUpdated,
  onError,
}: {
  caseId: string;
  witnessId: string;
  account: WitnessAccountView;
  availableClaims: AvailableClaim[];
  availableDocuments: AvailableDocument[];
  onAccountUpdated: (account: WitnessAccountView) => void;
  onError: (message: string) => void;
}) {
  const [isLinkingClaim, setIsLinkingClaim] = useState(false);
  const [isLinkingDocument, setIsLinkingDocument] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const linkedClaimIds = new Set(account.claims.map((l) => l.claimId));
  const linkedDocumentIds = new Set(account.documents.map((l) => l.documentId));
  const unlinkedClaims = availableClaims.filter((c) => !linkedClaimIds.has(c.id));
  const unlinkedDocuments = availableDocuments.filter((d) => !linkedDocumentIds.has(d.id));

  const base = `/api/cases/${caseId}/witnesses/${witnessId}/accounts/${account.id}`;

  async function linkClaim(claimId: string) {
    setIsBusy(true);
    onError("");
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${base}/claim-links`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ claimId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke koble påstanden.");

      const claim = availableClaims.find((c) => c.id === claimId) ?? null;
      onAccountUpdated({
        ...account,
        claims: [...account.claims, { id: result.link.id, claimId, claim }],
      });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke koble påstanden.");
    } finally {
      setIsBusy(false);
    }
  }

  async function unlinkClaim(linkId: string) {
    setIsBusy(true);
    onError("");
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${base}/claim-links/${linkId}`, { method: "DELETE", headers });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke fjerne koblingen.");

      onAccountUpdated({ ...account, claims: account.claims.filter((l) => l.id !== linkId) });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke fjerne koblingen.");
    } finally {
      setIsBusy(false);
    }
  }

  async function linkDocument(documentId: string) {
    setIsBusy(true);
    onError("");
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${base}/document-links`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke koble dokumentet.");

      const document = availableDocuments.find((d) => d.id === documentId) ?? null;
      onAccountUpdated({
        ...account,
        documents: [...account.documents, { id: result.link.id, documentId, document }],
      });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke koble dokumentet.");
    } finally {
      setIsBusy(false);
    }
  }

  async function unlinkDocument(linkId: string) {
    setIsBusy(true);
    onError("");
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${base}/document-links/${linkId}`, { method: "DELETE", headers });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error ?? "Kunne ikke fjerne koblingen.");

      onAccountUpdated({ ...account, documents: account.documents.filter((l) => l.id !== linkId) });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Kunne ikke fjerne koblingen.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="mb-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-slate-800">{account.description}</p>
        <Badge tone={account.observationType === "direct" ? "info" : "neutral"}>
          {account.observationType === "direct" ? "Direkte observasjon" : "Annenhåndsinformasjon"}
        </Badge>
      </div>

      {account.claims.length > 0 ? (
        <div className="mt-2 space-y-1">
          {account.claims.map((link) => (
            <div key={link.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-xs">
              <span className="text-slate-700">→ {link.claim?.text ?? "Opplysning"}</span>
              <button type="button" onClick={() => unlinkClaim(link.id)} disabled={isBusy} className="font-bold text-red-700 hover:underline disabled:opacity-60">
                Fjern
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {account.documents.length > 0 ? (
        <div className="mt-1 space-y-1">
          {account.documents.map((link) => (
            <div key={link.id} className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50 px-2 py-1.5 text-xs">
              <span className="text-emerald-900">📄 {link.document?.title ?? "Skriftlig erklæring"}</span>
              <button type="button" onClick={() => unlinkDocument(link.id)} disabled={isBusy} className="font-bold text-red-700 hover:underline disabled:opacity-60">
                Fjern
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => setIsLinkingClaim((c) => !c)} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-950 hover:bg-slate-100">
          {isLinkingClaim ? "Lukk" : "+ Koble påstand"}
        </button>
        <button type="button" onClick={() => setIsLinkingDocument((c) => !c)} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-950 hover:bg-slate-100">
          {isLinkingDocument ? "Lukk" : "+ Legg til skriftlig erklæring"}
        </button>
      </div>

      {isLinkingClaim ? (
        <div className="mt-2 space-y-1 rounded-lg border border-slate-200 bg-white p-2">
          {unlinkedClaims.length === 0 ? (
            <p className="text-xs text-slate-500">Ingen flere opplysninger å koble.</p>
          ) : (
            unlinkedClaims.map((claim) => (
              <button key={claim.id} type="button" disabled={isBusy} onClick={() => linkClaim(claim.id)} className="block w-full rounded border border-slate-200 px-2 py-1.5 text-left text-xs hover:bg-red-50 disabled:opacity-60">
                {claim.text}
              </button>
            ))
          )}
        </div>
      ) : null}

      {isLinkingDocument ? (
        <div className="mt-2 space-y-1 rounded-lg border border-slate-200 bg-white p-2">
          {unlinkedDocuments.length === 0 ? (
            <p className="text-xs text-slate-500">Ingen dokumenter å koble. Last opp under Dokumenter først.</p>
          ) : (
            unlinkedDocuments.map((doc) => (
              <button key={doc.id} type="button" disabled={isBusy} onClick={() => linkDocument(doc.id)} className="block w-full rounded border border-slate-200 px-2 py-1.5 text-left text-xs hover:bg-red-50 disabled:opacity-60">
                {doc.title}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

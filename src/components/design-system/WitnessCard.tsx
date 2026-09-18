import { Badge } from "./Badge";

export type WitnessIdentityStatus = "possible" | "named" | "anonymous";
export type WitnessObservationType = "direct" | "secondhand";

export type WitnessCardAccount = {
  id: string;
  description: string;
  observationType: WitnessObservationType;
  hasWrittenStatement: boolean;
  eventTitle?: string | null;
};

const IDENTITY_LABELS: Record<WitnessIdentityStatus, string> = {
  possible: "Mulig vitne (ikke bekreftet)",
  named: "Navngitt vitne",
  anonymous: "Anonymisert vitne",
};

const OBSERVATION_LABELS: Record<WitnessObservationType, string> = {
  direct: "Direkte observasjon",
  secondhand: "Annenhåndsinformasjon",
};

/**
 * Remøy AI Design System — WitnessCard.
 * Viser alltid identitetsstatus og observasjonstype eksplisitt, og skiller
 * tydelig "kun brukerens opplysning om hva vitnet kan si" fra "faktisk
 * skriftlig erklæring finnes" - et vitne skal ALDRI fremstå som bekreftet
 * uten faktisk grunnlag (se hasWrittenStatement).
 */
export function WitnessCard({
  name,
  identityStatus,
  relationshipToCase,
  accounts,
}: {
  name: string | null;
  identityStatus: WitnessIdentityStatus;
  relationshipToCase?: string | null;
  accounts: WitnessCardAccount[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-slate-950">
            {identityStatus === "named" ? (name ?? "Navngitt vitne") : IDENTITY_LABELS[identityStatus]}
          </p>
          {relationshipToCase ? <p className="text-xs text-slate-500">{relationshipToCase}</p> : null}
        </div>
        <Badge tone={identityStatus === "named" ? "info" : "neutral"}>{IDENTITY_LABELS[identityStatus]}</Badge>
      </div>

      {accounts.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Ingen vitneopplysninger registrert ennå.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {accounts.map((account) => (
            <div key={account.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={account.observationType === "direct" ? "success" : "warning"}>
                  {OBSERVATION_LABELS[account.observationType]}
                </Badge>
                <Badge tone={account.hasWrittenStatement ? "success" : "neutral"}>
                  {account.hasWrittenStatement ? "Skriftlig erklæring finnes" : "Kun brukerens opplysning"}
                </Badge>
                {account.eventTitle ? <span className="text-xs font-semibold text-slate-500">{account.eventTitle}</span> : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{account.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

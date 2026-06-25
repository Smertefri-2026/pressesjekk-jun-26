export function CasePfuDraft() {
  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-2xl font-bold">PFU-klage</h2>
      <p className="mt-4 leading-8 text-slate-300">
        Basert på artikkel, tilsvar, rettsstatus og dokumentasjon kan
        PresseSjekk senere generere et strukturert PFU-klage med
        vedleggsliste.
      </p>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5 text-slate-300">
        <p className="font-semibold text-white">Utkast til klagepunkt:</p>
        <p className="mt-3 leading-8">
          Klager mener at artikkelen kan reise spørsmål om samtidig
          imøtegåelse, kildebruk og identifisering. Klager oppgir at
          henvendelsen før publisering ikke ga tilstrekkelig grunnlag for å
          svare konkret på alle beskyldninger.
        </p>
      </div>
    </section>
  );
}

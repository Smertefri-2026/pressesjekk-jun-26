export function FreeResultCard() {
  return (
    <aside className="h-fit rounded-3xl border border-cyan-300/30 bg-cyan-300/10 p-6 lg:sticky lg:top-8">
      <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
        Gratis forhåndsresultat
      </p>

      <h2 className="mt-4 text-2xl font-bold">Demoresultat</h2>

      <div className="mt-5 rounded-2xl bg-slate-950 p-5">
        <p className="text-sm text-slate-400">Foreløpig risikonivå</p>
        <p className="mt-2 text-4xl font-bold text-amber-300">Middels/høy</p>
      </div>

      <div className="mt-5 space-y-3 text-sm text-slate-200">
        <p>Mulige problemområder:</p>
        <ul className="list-inside list-disc space-y-2 text-slate-300">
          <li>Samtidig imøtegåelse</li>
          <li>Kildebruk og dokumentasjon</li>
          <li>Tittel og ingress</li>
          <li>Identifisering</li>
          <li>Rettstatus / straffesak</li>
          <li>Mulig oppdateringsbehov</li>
        </ul>
      </div>

      <button className="mt-6 w-full rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-200">
        Velg rapportpakke
      </button>

      <p className="mt-4 text-xs leading-6 text-slate-400">
        Dette er kun dummydata. Senere vil rapporten genereres basert på
        artikkel, tilsvar, rettsstatus og dokumentasjon.
      </p>
    </aside>
  );
}

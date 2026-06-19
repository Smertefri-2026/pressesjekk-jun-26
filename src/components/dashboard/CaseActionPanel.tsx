type CaseActionPanelProps = {
  checkedCount: number;
};

export function CaseActionPanel({ checkedCount }: CaseActionPanelProps) {
  return (
    <aside className="h-fit rounded-3xl border border-cyan-300/30 bg-cyan-300/10 p-6 lg:sticky lg:top-8">
      <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
        Sakshandling
      </p>

      <h2 className="mt-4 text-2xl font-bold">Neste steg</h2>

      <div className="mt-5 space-y-3">
        <button className="w-full rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-200">
          Generer PFU-klage
        </button>
        <button className="w-full rounded-xl border border-white/10 px-5 py-3 font-semibold text-white hover:bg-white/10">
          Last ned rapport
        </button>
        <button className="w-full rounded-xl border border-white/10 px-5 py-3 font-semibold text-white hover:bg-white/10">
          Legg til dokumentasjon
        </button>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-950 p-5">
        <p className="text-sm text-slate-400">Søkt på</p>
        <p className="mt-2 text-4xl font-bold text-cyan-300">
          {checkedCount} ganger
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          I ekte versjon lagres samme artikkel slik at grunnanalyse kan
          gjenbrukes og trafikk/kostnad reduseres.
        </p>
      </div>
    </aside>
  );
}

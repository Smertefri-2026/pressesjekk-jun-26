import Link from "next/link";

export function NextStepCard() {
  return (
    <aside className="h-fit rounded-3xl border border-cyan-300/30 bg-cyan-300/10 p-6">
      <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
        Neste anbefalte steg
      </p>
      <h2 className="mt-4 text-2xl font-bold">Fullfør dokumentasjonen</h2>
      <p className="mt-4 leading-7 text-slate-300">
        I en ekte sak bør brukeren legge inn e-post, SMS, svarfrist, eventuell
        dom/henleggelse og annen dokumentasjon før rapport og PFU-klage
        genereres.
      </p>

      <div className="mt-6 space-y-3">
        <Link
          href="/min-side/saker/demo-1"
          className="block rounded-xl bg-cyan-300 px-5 py-3 text-center font-semibold text-slate-950 hover:bg-cyan-200"
        >
          Åpne demosak
        </Link>
        <Link
          href="/pressesjekk"
          className="block rounded-xl border border-white/10 px-5 py-3 text-center font-semibold text-white hover:bg-white/10"
        >
          Start ny sjekk
        </Link>
      </div>
    </aside>
  );
}

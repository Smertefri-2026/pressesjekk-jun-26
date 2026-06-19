import Link from "next/link";

export function HeroSection() {
  return (
    <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1fr_360px]">
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl lg:p-12">
        <p className="mb-5 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-200">
          AI-basert analyse av medieartikler
        </p>

        <h2 className="max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl">
          Når media skriver om deg, bør du kunne sjekke dem tilbake.
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Lim inn en URL, last opp PDF eller legg inn artikkeltekst.
          PresseSjekk hjelper deg å vurdere artikkelen mot presseetiske
          problemstillinger, tilsvar, samtidig imøtegåelse og mulig PFU-klage.
        </p>

        <div className="mt-8 grid gap-4 rounded-2xl bg-white p-4 text-slate-950 shadow-xl md:grid-cols-[1fr_auto]">
          <input
            type="text"
            placeholder="Lim inn URL til artikkel..."
            className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-cyan-500"
          />
          <Link
            href="/pressesjekk"
            className="rounded-xl bg-slate-950 px-6 py-3 text-center font-semibold text-white hover:bg-slate-800"
          >
            Start gratis sjekk
          </Link>
        </div>

        <div className="mt-8 grid gap-4 text-sm text-slate-300 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <strong className="block text-white">Artikkelsjekk</strong>
            URL, PDF eller tekst.
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <strong className="block text-white">Tilsvar-sjekk</strong>
            Ble du kontaktet før publisering?
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <strong className="block text-white">PFU-klage</strong>
            Få strukturert klageutkast.
          </div>
        </div>
      </section>

      <aside className="rounded-3xl border border-amber-300/30 bg-amber-300/10 p-8 shadow-2xl">
        <p className="text-sm uppercase tracking-[0.25em] text-amber-200">
          Støtt arbeidet
        </p>

        <h3 className="mt-4 text-3xl font-bold text-white">
          Besøk PresseVern.no
        </h3>

        <p className="mt-4 leading-7 text-amber-50/80">
          PresseVern arbeider for bedre vern mot feilaktige og skadelige
          medieoppslag. Les mer, støtt prosjektet eller kjøp caps når
          nettbutikken åpner.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <a
            href="#"
            className="rounded-xl bg-amber-300 px-5 py-3 text-center font-semibold text-slate-950 hover:bg-amber-200"
          >
            Besøk PresseVern
          </a>
          <a
            href="#"
            className="rounded-xl border border-amber-200/40 px-5 py-3 text-center font-semibold text-white hover:bg-white/10"
          >
            Se caps og produkter
          </a>
        </div>
      </aside>
    </div>
  );
}

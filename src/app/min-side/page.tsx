import Link from "next/link";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";

const cases = [
  {
    title: "VG-artikkel om større mediesak",
    media: "VG",
    date: "18.06.2026",
    status: "Full rapport kjøpt",
    nextStep: "Generer PFU-klage",
    risk: "Høy",
    href: "/min-side/saker/demo-1",
  },
  {
    title: "Lokalavis-artikkel med manglende tilsvar",
    media: "Lokalavis",
    date: "14.06.2026",
    status: "Gratis forhåndssjekk",
    nextStep: "Lås opp full rapport",
    risk: "Middels",
    href: "/min-side/saker/demo-1",
  },
  {
    title: "Artikkel om rettssak og identifisering",
    media: "Nettavis",
    date: "09.06.2026",
    status: "PFU-klageutkast klart",
    nextStep: "Last ned klage",
    risk: "Middels/høy",
    href: "/min-side/saker/demo-1",
  },
];

export default function MinSidePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <PublicHeader />

        <div className="py-14">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                Min Side
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
                Dine PresseSjekk-saker
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                Her samles artikler, analyser, tilsvar, dokumentasjon,
                rapporter og PFU-klageutkast. Foreløpig viser siden dummydata.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/pressesjekk"
                className="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-200"
              >
                Ny sjekk
              </Link>
              <Link
                href="/priser"
                className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-white hover:bg-white/10"
              >
                Kjøp credits
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm text-slate-400">Credits igjen</p>
              <p className="mt-3 text-4xl font-bold text-cyan-300">3</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm text-slate-400">Aktive saker</p>
              <p className="mt-3 text-4xl font-bold">3</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm text-slate-400">Rapporter</p>
              <p className="mt-3 text-4xl font-bold">2</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm text-slate-400">PFU-utkast</p>
              <p className="mt-3 text-4xl font-bold">1</p>
            </div>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px]">
            <section>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Mine saker</h2>
                <Link
                  href="/pressesjekk"
                  className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                >
                  + Opprett ny sak
                </Link>
              </div>

              <div className="space-y-4">
                {cases.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="block rounded-3xl border border-white/10 bg-white/[0.03] p-6 hover:border-cyan-300/50"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <p className="text-sm text-cyan-300">
                          {item.media} · {item.date}
                        </p>
                        <h3 className="mt-2 text-xl font-bold">
                          {item.title}
                        </h3>
                        <p className="mt-3 text-sm text-slate-400">
                          Status: {item.status}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 md:items-end">
                        <span className="rounded-full bg-amber-300/15 px-3 py-1 text-sm font-semibold text-amber-200">
                          Risiko: {item.risk}
                        </span>
                        <span className="text-sm text-slate-300">
                          {item.nextStep}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <aside className="h-fit rounded-3xl border border-cyan-300/30 bg-cyan-300/10 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
                Neste anbefalte steg
              </p>
              <h2 className="mt-4 text-2xl font-bold">
                Fullfør dokumentasjonen
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                I en ekte sak bør brukeren legge inn e-post, SMS, svarfrist,
                eventuell dom/henleggelse og annen dokumentasjon før rapport og
                PFU-klage genereres.
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
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

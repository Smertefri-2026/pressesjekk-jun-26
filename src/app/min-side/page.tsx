import Link from "next/link";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { CaseCard } from "@/components/dashboard/CaseCard";
import { demoCaseSummaries } from "@/data/demoCases";

const activity = [
  {
    title: "Demosak opprettet",
    text: "Artikkel, tilsvar og foreløpig rettsstatus er registrert.",
    time: "I dag",
  },
  {
    title: "Rapport klar",
    text: "Full rapport kan lastes ned eller brukes videre til PFU-klageutkast.",
    time: "I dag",
  },
  {
    title: "Dokumentasjon mangler",
    text: "Legg gjerne til e-post fra journalist, svar til redaksjonen og eventuelle vedlegg.",
    time: "Neste steg",
  },
];

export default function MinSidePage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Dashboard
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              Dine PresseSjekk-saker
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
              Her samles artikler, analyser, tilsvar, dokumentasjon, rapporter
              og PFU-klageutkast. I en ekte versjon kan du oppdatere saken,
              legge til nye dokumenter og generere nye rapportversjoner.
            </p>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Neste anbefalte steg
            </p>
            <h2 className="mt-3 text-2xl font-black text-slate-950">
              Fullfør dokumentasjonen
            </h2>
            <p className="mt-4 leading-7 text-slate-700">
              Legg inn e-post, SMS, svarfrist, rettsstatus og vedlegg før du
              genererer endelig rapport eller PFU-klageutkast.
            </p>

            <Link
              href="/min-side/saker/demo-1"
              className="mt-6 block rounded-xl bg-cyan-500 px-5 py-4 text-center font-black text-slate-950 hover:bg-cyan-400"
            >
              Åpne demosak
            </Link>
          </aside>
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Credits igjen
            </p>
            <p className="mt-3 text-4xl font-black text-cyan-700">3</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Aktive saker
            </p>
            <p className="mt-3 text-4xl font-black">
              {demoCaseSummaries.length}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Rapporter</p>
            <p className="mt-3 text-4xl font-black">2</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">PFU-utkast</p>
            <p className="mt-3 text-4xl font-black">1</p>
          </div>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                  Mine saker
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-950">
                  Lagrede saker
                </h2>
              </div>

              <Link
                href="/pressesjekk"
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
              >
                + Opprett ny sak
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {demoCaseSummaries.map((item) => (
                <CaseCard key={item.id} item={item} />
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
                Viktig
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                Saken kan oppdateres
              </h2>
              <p className="mt-4 leading-7 text-slate-700">
                Hvis du finner nye dokumenter, får svar fra redaksjonen eller
                rettsstatus endrer seg, bør du kunne lage en ny rapportversjon.
              </p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Siste aktivitet
              </p>

              <div className="mt-5 space-y-4">
                {activity.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
                      {item.time}
                    </p>
                    <h3 className="mt-2 font-black text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { demoCase } from "@/data/demoCases";

const caseActions = [
  "Endre artikkeldata",
  "Oppdater tilsvar",
  "Legg til dokumentasjon",
  "Oppdater rettsstatus",
  "Generer ny rapportversjon",
  "Lag PFU-klageutkast",
];

const documentationStatus = [
  { label: "Kontakt før publisering", value: "Ja, e-post" },
  { label: "Konkrete beskyldninger", value: "Delvis" },
  { label: "Rettsstatus", value: "Ikke avgjort" },
  { label: "Vedlegg", value: "3 dokumenter" },
];

const reportVersions = [
  {
    version: "Versjon 1",
    date: "18.06.2026",
    status: "Full rapport generert",
    text: "Basert på artikkel, tilsvar og foreløpig dokumentasjon.",
  },
  {
    version: "Ny versjon",
    date: "Ikke laget enda",
    status: "Kan genereres",
    text: "Lag ny rapportversjon hvis du legger til nye dokumenter eller oppdaterer rettsstatus.",
  },
];

export default function DemoCasePage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <Link href="/min-side" className="block">
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              PresseSjekk
            </h1>
            <p className="mt-1 hidden text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 sm:block">
              Sak
            </p>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/min-side"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"
            >
              Min Side
            </Link>
            <Link
              href="/pressesjekk"
              className="hidden rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 sm:block"
            >
              Ny sjekk
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <Link
          href="/min-side"
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          ← Tilbake til Min Side
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Demosak
            </p>

            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              {demoCase.title}
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
              Dette er en eksempelvisning av hvordan en lagret sak kan se ut.
              Her skal brukeren kunne oppdatere artikkeldata, tilsvar,
              rettsstatus og dokumentasjon før ny rapport eller PFU-klageutkast
              genereres.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">Status</p>
                <p className="mt-3 text-xl font-black text-cyan-700">
                  {demoCase.status}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">Risiko</p>
                <p className="mt-3 text-xl font-black text-amber-600">
                  {demoCase.risk}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  Neste steg
                </p>
                <p className="mt-3 text-xl font-black text-slate-950">
                  {demoCase.nextStep}
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Sakshandling
            </p>
            <h2 className="mt-3 text-2xl font-black text-slate-950">
              Hva vil du gjøre?
            </h2>

            <div className="mt-6 space-y-3">
              {caseActions.map((action, index) => (
                <button
                  key={action}
                  className={`w-full rounded-xl px-5 py-4 text-left text-sm font-black ${
                    index === 4
                      ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                      : "border border-slate-300 bg-white text-slate-950 hover:bg-slate-100"
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>
          </aside>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Artikkel
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Artikkeldata
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Medium
                  </p>
                  <p className="mt-2 font-black">{demoCase.media}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Publisert
                  </p>
                  <p className="mt-2 font-black">{demoCase.publishedAt}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Artikkeltype
                  </p>
                  <p className="mt-2 font-black">{demoCase.articleType}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Sjekket før
                  </p>
                  <p className="mt-2 font-black text-cyan-700">
                    {demoCase.checkedCount} ganger
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">URL</p>
                <p className="mt-2 break-words text-slate-700">
                  {demoCase.url}
                </p>
              </div>

              <button className="mt-6 rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100">
                Endre artikkeldata
              </button>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Tidslinje
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Hendelser i saken
              </h2>

              <div className="mt-6 space-y-4">
                {demoCase.timeline.map((item) => (
                  <div
                    key={`${item.date}-${item.title}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">
                      {item.date}
                    </p>
                    <h3 className="mt-2 text-lg font-black text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 leading-7 text-slate-700">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              <button className="mt-6 rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100">
                Legg til hendelse
              </button>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Tilsvar og rettsstatus
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Opplysninger brukeren har lagt inn
              </h2>

              <p className="mt-4 leading-8 text-slate-700">
                Dette bør kunne redigeres i ettertid dersom brukeren har valgt
                feil, finner nye e-poster, får svar fra redaksjonen eller
                oppdaterer rettsstatus.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {documentationStatus.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <p className="text-sm font-semibold text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-2 font-black">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100">
                  Endre tilsvar
                </button>
                <button className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100">
                  Oppdater rettsstatus
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Mulige funn
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Foreløpige problemområder
              </h2>

              <ul className="mt-6 space-y-3 text-slate-700">
                {demoCase.findings.map((finding) => (
                  <li key={finding} className="rounded-2xl bg-slate-50 p-4">
                    <span className="mr-2 text-cyan-700">✓</span>
                    {finding}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Rapportversjoner
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Rapporten kan oppdateres
              </h2>

              <p className="mt-4 leading-8 text-slate-700">
                Nye dokumenter, ny rettsstatus eller nytt svar fra redaksjonen
                bør kunne føre til ny rapportversjon og oppdatert klageutkast.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {reportVersions.map((item) => (
                  <div
                    key={item.version}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">
                      {item.version}
                    </p>
                    <h3 className="mt-2 text-lg font-black text-slate-950">
                      {item.status}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {item.date}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              <button className="mt-6 rounded-xl bg-cyan-500 px-5 py-4 text-sm font-black text-slate-950 hover:bg-cyan-400">
                Generer ny rapportversjon
              </button>
            </section>

            <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                PFU-klageutkast
              </p>
              <h2 className="mt-3 text-3xl font-black">
                Strukturert klagegrunnlag
              </h2>
              <p className="mt-5 leading-8 text-slate-300">
                Basert på rapport, tilsvar, rettsstatus og dokumentasjon kan
                PresseSjekk senere generere et strukturert PFU-klageutkast med
                vedleggsliste.
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="font-black text-white">Eksempel på klagepunkt:</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Klager mener at artikkelen kan reise spørsmål om samtidig
                  imøtegåelse, kildebruk og identifisering. Klager oppgir at
                  henvendelsen før publisering ikke ga tilstrekkelig grunnlag
                  for å svare konkret på alle beskyldninger.
                </p>
              </div>

              <button className="mt-6 rounded-xl bg-cyan-400 px-5 py-4 text-sm font-black text-slate-950 hover:bg-cyan-300">
                Generer PFU-klageutkast
              </button>
            </section>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
                Viktig
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                Ikke lås saken for tidlig
              </h2>
              <p className="mt-4 leading-7 text-slate-700">
                En mediesak kan endre seg. Saken bør kunne redigeres før ny
                rapport eller klageutkast genereres.
              </p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Dokumentasjon
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                Vedlegg i saken
              </h2>
              <div className="mt-5 space-y-3 text-sm font-medium text-slate-700">
                <div className="rounded-2xl bg-slate-50 p-4">
                  ✓ E-post fra journalist
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  ✓ Brukerens svar
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  ✓ Skjermbilde av artikkel
                </div>
              </div>

              <button className="mt-5 w-full rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100">
                Last opp nytt vedlegg
              </button>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Søkt på
              </p>
              <p className="mt-3 text-5xl font-black text-cyan-700">
                {demoCase.checkedCount}
              </p>
              <p className="mt-3 leading-7 text-slate-700">
                I ekte versjon lagres samme artikkel slik at grunnanalyse kan
                gjenbrukes og kostnader reduseres.
              </p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

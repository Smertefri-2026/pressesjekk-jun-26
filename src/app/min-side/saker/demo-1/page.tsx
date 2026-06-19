import Link from "next/link";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";

const timeline = [
  {
    date: "18.06.2026 kl. 09:12",
    title: "Journalist tok kontakt",
    text: "Bruker oppgir at henvendelsen kom på e-post med kort svarfrist.",
  },
  {
    date: "18.06.2026 kl. 11:30",
    title: "Bruker svarte",
    text: "Bruker oppgir at det ble sendt tilsvar, men at svaret bare delvis ble tatt med.",
  },
  {
    date: "18.06.2026 kl. 14:05",
    title: "Artikkel publisert",
    text: "Artikkelen ble publisert samme dag. Bruker mener saken inneholder sterke faktiske beskyldninger.",
  },
  {
    date: "18.06.2026 kl. 18:22",
    title: "PresseSjekk opprettet",
    text: "Saken er registrert i PresseSjekk med artikkel, tilsvar og foreløpig vurdering.",
  },
];

const findings = [
  "Mulig mangelfull samtidig imøtegåelse",
  "Kort svarfrist før publisering",
  "Spørsmål om identifisering",
  "Mulig behov for oppdatering etter rettslig utvikling",
  "Tittel/ingress bør vurderes mot innholdet i artikkelen",
];

export default function DemoCasePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <PublicHeader />

        <div className="py-14">
          <Link
            href="/min-side"
            className="text-sm text-cyan-300 hover:text-cyan-200"
          >
            ← Tilbake til Min Side
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <section>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                Demosak
              </p>

              <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                VG-artikkel om større mediesak
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                Dette er en dummyvisning av hvordan én sak kan se ut på Min
                Side. Senere skal denne siden hente ekte artikkel, analyse,
                dokumentasjon, betalinger og rapporter fra databasen.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-sm text-slate-400">Status</p>
                  <p className="mt-2 font-bold text-cyan-300">
                    Full rapport kjøpt
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-sm text-slate-400">Risiko</p>
                  <p className="mt-2 font-bold text-amber-300">Høy</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-sm text-slate-400">Neste steg</p>
                  <p className="mt-2 font-bold">Generer PFU-klage</p>
                </div>
              </div>

              <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-2xl font-bold">Artikkel</h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-400">Medium</p>
                    <p className="mt-1 font-semibold">VG</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Publisert</p>
                    <p className="mt-1 font-semibold">18.06.2026</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Artikkeltype</p>
                    <p className="mt-1 font-semibold">Nyhetsartikkel</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Sjekket før</p>
                    <p className="mt-1 font-semibold text-cyan-300">
                      47 ganger
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
                  <p className="text-sm text-slate-400">URL</p>
                  <p className="mt-2 break-words text-slate-300">
                    https://eksempel.no/artikkel/demo
                  </p>
                </div>
              </section>

              <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-2xl font-bold">Tidslinje</h2>

                <div className="mt-6 space-y-4">
                  {timeline.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/10 bg-slate-900 p-5"
                    >
                      <p className="text-sm text-cyan-300">{item.date}</p>
                      <h3 className="mt-2 font-bold">{item.title}</h3>
                      <p className="mt-2 leading-7 text-slate-300">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-2xl font-bold">
                  Tilsvar, rettsstatus og dokumentasjon
                </h2>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">
                      Kontakt før publisering
                    </p>
                    <p className="mt-2 font-semibold">Ja, e-post</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">
                      Konkrete beskyldninger
                    </p>
                    <p className="mt-2 font-semibold">Delvis</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">Rettsstatus</p>
                    <p className="mt-2 font-semibold">Ikke avgjort</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">Vedlegg</p>
                    <p className="mt-2 font-semibold">3 dokumenter</p>
                  </div>
                </div>
              </section>

              <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-2xl font-bold">Mulige funn</h2>

                <ul className="mt-5 space-y-3 text-slate-300">
                  {findings.map((finding) => (
                    <li key={finding} className="flex gap-3">
                      <span className="text-cyan-300">✓</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-2xl font-bold">PFU-klageutkast</h2>
                <p className="mt-4 leading-8 text-slate-300">
                  Basert på artikkel, tilsvar, rettsstatus og dokumentasjon kan
                  PresseSjekk senere generere et strukturert PFU-klageutkast
                  med vedleggsliste.
                </p>

                <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5 text-slate-300">
                  <p className="font-semibold text-white">
                    Utkast til klagepunkt:
                  </p>
                  <p className="mt-3 leading-8">
                    Klager mener at artikkelen kan reise spørsmål om samtidig
                    imøtegåelse, kildebruk og identifisering. Klager oppgir at
                    henvendelsen før publisering ikke ga tilstrekkelig grunnlag
                    for å svare konkret på alle beskyldninger.
                  </p>
                </div>
              </section>
            </section>

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
                  47 ganger
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  I ekte versjon lagres samme artikkel slik at grunnanalyse kan
                  gjenbrukes og trafikk/kostnad reduseres.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

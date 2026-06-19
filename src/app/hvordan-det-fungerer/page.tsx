import Link from "next/link";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";

const steps = [
  {
    title: "Legg inn artikkel",
    text: "Brukeren limer inn URL, laster opp PDF eller limer inn artikkeltekst. Hvis URL ikke kan leses, kan teksten legges inn manuelt.",
  },
  {
    title: "Svar på tilsvar-spørsmål",
    text: "Systemet spør om brukeren ble kontaktet før publisering, om konkrete beskyldninger ble forelagt, og om svaret ble tatt med.",
  },
  {
    title: "Vurder rettsstatus",
    text: "Hvis saken gjelder mistanke, siktelse, tiltale, dom, henleggelse eller frifinnelse, kan dette tas med i vurderingen.",
  },
  {
    title: "Få gratis forhåndsvurdering",
    text: "Brukeren får en kort, foreløpig vurdering av mulige problemområder og risikonivå.",
  },
  {
    title: "Lås opp full rapport",
    text: "Betalt rapport gir mer detaljert vurdering av artikkel, tilsvar, dokumentasjon og mulige presseetiske problemstillinger.",
  },
  {
    title: "Generer PFU-klageutkast",
    text: "Når rapport og dokumentasjon er klar, kan systemet lage et strukturert utkast til PFU-klage med vedleggsliste.",
  },
];

const checks = [
  "Samtidig imøtegåelse",
  "Tilsvar",
  "Kildebruk og dokumentasjon",
  "Tittel og ingress",
  "Identifisering",
  "Privatliv",
  "Bildebruk",
  "Straffesak, dom og rettsstatus",
  "Oppdateringsbehov ved ny utvikling",
];

const limitations = [
  "PresseSjekk erstatter ikke advokat.",
  "PresseSjekk avgjør ikke om pressen har brutt loven.",
  "PresseSjekk avgjør ikke utfallet i PFU.",
  "Brukeren må selv kontrollere og godkjenne alt før innsending.",
  "AI-vurderingen er veiledende og må ses som dokumenthjelp.",
];

export default function HvordanDetFungererPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <PublicHeader />

        <div className="py-14">
          <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
            ← Tilbake til forsiden
          </Link>

          <div className="mt-8 max-w-4xl">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
              Slik fungerer det
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
              Fra medieartikkel til strukturert vurdering
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              PresseSjekk skal gjøre det enklere å forstå om en medieartikkel
              kan reise presseetiske problemstillinger. Løsningen kombinerer
              artikkelsjekk, tilsvar-sjekk, rettsstatus, dokumentasjon og
              klageutkast i én samlet flyt.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/pressesjekk"
                className="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-200"
              >
                Start gratis sjekk
              </Link>
              <Link
                href="/priser"
                className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-white hover:bg-white/10"
              >
                Se priser
              </Link>
            </div>
          </div>

          <section className="mt-14">
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
              Prosess
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              Seks steg fra artikkel til klageutkast
            </h2>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <p className="text-sm font-semibold text-cyan-300">
                    Steg {index + 1}
                  </p>
                  <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
                  <p className="mt-4 leading-7 text-slate-300">{step.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-14 grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
                Hva sjekkes?
              </p>
              <h2 className="mt-3 text-3xl font-bold">
                Presseetiske og rettslige problemområder
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                Systemet bør ikke bare se på teksten i artikkelen, men også på
                prosessen før publisering, brukerens dokumentasjon og om saken
                gjelder straffesak eller rettsstatus.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {checks.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-sm"
                  >
                    <span className="text-cyan-300">✓</span>{" "}
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-300/30 bg-amber-300/10 p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-amber-200">
                Viktig forbehold
              </p>
              <h2 className="mt-3 text-3xl font-bold">
                PresseSjekk er dokumenthjelp, ikke en dom
              </h2>
              <p className="mt-4 leading-8 text-amber-50/80">
                For å være seriøs og trygg må tjenesten være tydelig på hva den
                gjør og ikke gjør. PresseSjekk skal hjelpe brukeren med struktur,
                dokumentasjon og klageutkast – ikke love et bestemt resultat.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-amber-50/90">
                {limitations.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-14 rounded-3xl border border-cyan-300/30 bg-cyan-300/10 p-8">
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
              Hvorfor dette er annerledes
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              Ikke bare URL-sjekk – men en saksflyt
            </h2>
            <p className="mt-5 max-w-4xl leading-8 text-slate-300">
              En vanlig AI-sjekk av en URL vil ofte bli for overflatisk.
              PresseSjekk bør derfor bygges som en saksflyt der brukeren også
              legger inn kontakt med journalist, svarfrist, dokumentasjon,
              rettsstatus og vedlegg. Det gir bedre grunnlag for rapport,
              PFU-klage og videre dokumenter.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-950 p-5">
                <h3 className="font-bold">Artikkel</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Hva står i saken, hvilke påstander fremsettes og hvordan er
                  den vinklet?
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950 p-5">
                <h3 className="font-bold">Prosess</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Ble brukeren kontaktet, fikk konkrete beskyldninger og reell
                  mulighet til å svare?
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950 p-5">
                <h3 className="font-bold">Dokumentasjon</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  E-post, SMS, svar, dom, henleggelse og andre vedlegg kan tas
                  med i saken.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

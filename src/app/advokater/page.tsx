import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

const features = [
  {
    title: "Klientmapper",
    text: "Samle artikler, dokumentasjon, tidslinje, rapporter og klageutkast per klient eller sak.",
  },
  {
    title: "Flere artikler i samme sak",
    text: "Analyser enkeltsaker eller større mediebilder der flere artikler bygger på samme påstander.",
  },
  {
    title: "Dokumentasjon og vedlegg",
    text: "Strukturer e-post, SMS, skjermbilder, dommer, henleggelser, tilsvar og redaktørsvar på ett sted.",
  },
  {
    title: "Rapporter og klageutkast",
    text: "Få utkast til PFU-klage, redaktørklage, dokumentasjonsnotat og videre saksgrunnlag.",
  },
];

const proWorkflow = [
  "Opprett klient eller sak",
  "Legg inn én eller flere artikler",
  "Registrer tilsvar, kontakt og svarfrist",
  "Legg til rettsstatus og dokumentasjon",
  "Generer rapport og klageutkast",
  "Følg status og videre steg",
];

const useCases = [
  "Privatpersoner omtalt i belastende mediesaker",
  "Bedrifter som mener omtalen er feil eller ubalansert",
  "Klienter som vurderer PFU-klage",
  "Saker med manglende samtidig imøtegåelse",
  "Saker med identifisering, bildebruk eller privatliv",
  "Saker der artikkel ikke er oppdatert etter ny utvikling",
];

const plans = [
  {
    name: "Proff Start",
    price: "Fra 4 990 kr/mnd",
    text: "For advokater, PR-rådgivere og mindre virksomheter med jevnlig behov.",
    items: ["Flere saker", "Klientmapper", "Månedsbaserte credits", "Rapporter"],
  },
  {
    name: "Proff Pluss",
    price: "Etter avtale",
    text: "For større advokatmiljøer, organisasjoner eller PR-byråer.",
    items: ["Flere brukere", "Teamoversikt", "Prioritert support", "Utvidet eksport"],
  },
];

export default function ForAdvokaterPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <Link href="/" className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">
          ← Tilbake til forsiden
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_390px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              For advokater og rådgivere
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Gjør mediesaker enklere å dokumentere.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              PresseSjekk Pro skal hjelpe advokater, PR-rådgivere, organisasjoner
              og bedrifter med å strukturere medieomtale, dokumentasjon, tilsvar,
              rettsstatus og mulige klagepunkter i én samlet saksflyt.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/pressesjekk"
                className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800"
              >
                Start en sjekk
              </Link>
              <Link
                href="/eksempelrapport"
                className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
              >
                Se eksempelrapport
              </Link>
            </div>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-7 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Proffløsning
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Bygget for flere saker
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              For profesjonelle brukere handler PresseSjekk ikke bare om én
              artikkel. Det handler om å samle dokumentasjon, bygge tidslinje og
              få et strukturert grunnlag for videre vurdering.
            </p>

            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Typisk kunde
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                Advokat / PR / organisasjon
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Flere saker, flere klienter og behov for systematisk
                dokumentasjon.
              </p>
            </div>
          </aside>
        </div>

        <section className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-lg font-black text-cyan-800">
                ✓
              </div>
              <h2 className="text-xl font-black text-slate-950">
                {item.title}
              </h2>
              <p className="mt-4 leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[420px_1fr]">
          <aside className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
              Viktig forbehold
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Ikke juridisk rådgivning
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              PresseSjekk skal være et dokumentasjons- og analyseverktøy.
              Tjenesten erstatter ikke advokatens egne vurderinger, og den gir
              ikke en endelig juridisk konklusjon.
            </p>

            <ul className="mt-6 space-y-3 text-sm font-medium text-slate-700">
              <li>• Advokat/rådgiver kontrollerer alltid innholdet.</li>
              <li>• Rapporten er et strukturert arbeidsgrunnlag.</li>
              <li>• AI-vurderinger må kvalitetssikres.</li>
              <li>• Klageutkast må godkjennes før bruk.</li>
            </ul>
          </aside>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Saksflyt
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Fra klienthenvendelse til strukturert sak
            </h2>
            <p className="mt-4 max-w-3xl leading-8 text-slate-700">
              Proffløsningen bør bygges rundt klientmapper, saksstatus,
              dokumentasjon og gjenbrukbare rapporter. Det gjør at man kan følge
              saken fra første artikkel til eventuell klage eller videre tiltak.
            </p>

            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {proWorkflow.map((item, index) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800"
                >
                  <span className="mr-2 font-black text-cyan-700">
                    {index + 1}.
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Bruksområder
              </p>
              <h2 className="mt-3 text-4xl font-black">
                Når proffbrukere trenger oversikt
              </h2>
              <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                I krevende mediesaker er det ofte mange detaljer: publiserte
                artikler, henvendelser fra journalister, tilsvar, redaktørsvar,
                rettsstatus og dokumentasjon. PresseSjekk kan samle dette i én
                struktur.
              </p>
            </div>

            <div className="grid gap-3">
              {useCases.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-2">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Proff
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                {plan.name}
              </h2>
              <p className="mt-3 text-4xl font-black text-slate-950">
                {plan.price}
              </p>
              <p className="mt-4 leading-8 text-slate-700">{plan.text}</p>

              <ul className="mt-6 space-y-3 text-sm font-medium text-slate-700">
                {plan.items.map((item) => (
                  <li key={item}>
                    <span className="mr-2 text-cyan-700">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/kontakt"
                className="mt-8 block rounded-xl bg-cyan-500 px-6 py-4 text-center font-bold text-slate-950 hover:bg-cyan-400"
              >
                Be om profftilgang
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Klar for neste steg?
          </p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            Bygg bedre dokumentasjon i mediesaker
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-700">
            Start med én sak, eller ta kontakt for en proffløsning med flere
            klientmapper, credits og saksoversikt.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/pressesjekk"
              className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800"
            >
              Start en sjekk
            </Link>
            <Link
              href="/priser"
              className="rounded-xl border border-slate-300 px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
            >
              Se priser
            </Link>
          </div>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}

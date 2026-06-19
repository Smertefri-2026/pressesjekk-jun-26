import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { pricingPlans } from "@/data/pricingPlans";

const creditExamples = [
  {
    title: "1 credit",
    text: "Én full rapport for én artikkel eller én avgrenset mediesak.",
  },
  {
    title: "2 credits",
    text: "Full rapport + strukturert PFU-klageutkast med vedleggsliste.",
  },
  {
    title: "3+ credits",
    text: "Større sak med flere artikler, mer dokumentasjon og oppdatert rapportversjon.",
  },
];

const whyPaid = [
  "AI-analyse og rapportgenerering har løpende kostnader.",
  "Dokumentasjon, rapportversjoner og lagring krever sikker plattform.",
  "Betalt rapport bør gi mer grundig vurdering enn gratis forhåndssjekk.",
  "Credits gjør det mulig å starte enkelt og kjøpe mer ved behov.",
];

export default function PriserPage() {
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
              Priser
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Start gratis. Betal når saken bør følges opp.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              PresseSjekk skal være enkelt å prøve, men samtidig robust nok til
              å gi grundige rapporter, lagre dokumentasjon og hjelpe brukeren
              videre med klageutkast eller proff saksflyt.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/pressesjekk"
                className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800"
              >
                Start gratis sjekk
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
              Anbefalt start
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Gratis forhåndssjekk
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Brukeren bør kunne teste én artikkel gratis først. Dersom saken
              virker alvorlig, kan brukeren gå videre til full rapport,
              dokumentasjon og PFU-klageutkast.
            </p>

            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Første steg
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">0 kr</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Kort forhåndsvurdering av mulige problemområder.
              </p>
            </div>
          </aside>
        </div>

        <section className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article
              key={plan.name}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
            >
              <p className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-cyan-800">
                {plan.tag}
              </p>

              <h2 className="mt-5 text-2xl font-black text-slate-950">
                {plan.name}
              </h2>

              <p className="mt-3 text-4xl font-black text-slate-950">
                {plan.price}
              </p>

              <p className="mt-4 leading-8 text-slate-700">
                {plan.description}
              </p>

              <ul className="mt-6 space-y-3 text-sm font-medium text-slate-700">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span className="mr-2 text-cyan-700">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/pressesjekk"
                className="mt-8 block rounded-xl bg-cyan-500 px-5 py-4 text-center font-black text-slate-950 hover:bg-cyan-400"
              >
                Start sjekk
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Credits
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              En fleksibel modell for rapporter og klageutkast
            </h2>
            <p className="mt-4 max-w-3xl leading-8 text-slate-700">
              Når betaling kobles på, bør PresseSjekk bruke credits. Da kan
              brukeren kjøpe én eller flere sjekker, og bruke dem når saken er
              klar for full rapport, ny rapportversjon eller PFU-klageutkast.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {creditExamples.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <h3 className="text-xl font-black text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
              Hvorfor betalt rapport?
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Gratis først, grundigere ved behov
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Gratis sjekk bør gi en enkel inngang. Betalt rapport bør brukes
              når brukeren trenger mer struktur, dokumentasjon og videre
              oppfølging.
            </p>

            <ul className="mt-6 space-y-3 text-sm font-medium text-slate-700">
              {whyPaid.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="mt-16 rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Proffbrukere
              </p>
              <h2 className="mt-3 text-4xl font-black">
                Advokater, PR-rådgivere og organisasjoner
              </h2>
              <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                For profesjonelle brukere bør PresseSjekk tilby klientmapper,
                flere saker, flere rapporter, saksoversikt og månedsbaserte
                credits.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="font-black text-white">Profftilgang</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Pris bør vurderes etter antall brukere, saker, rapportvolum og
                behov for support. Første forslag: fra 4 990 kr per måned.
              </p>
              <Link
                href="/advokater"
                className="mt-5 inline-block rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 hover:bg-cyan-300"
              >
                Les om proffløsning
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Klar til å starte?
          </p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            Begynn gratis med én artikkel
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-700">
            Du kan starte med en kort forhåndssjekk. Full rapport og
            klageutkast kan kjøpes når du vet at saken bør følges opp.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/pressesjekk"
              className="rounded-xl bg-cyan-500 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-400"
            >
              Start gratis sjekk
            </Link>
            <Link
              href="/eksempelrapport"
              className="rounded-xl border border-slate-300 px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
            >
              Se eksempelrapport
            </Link>
          </div>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}

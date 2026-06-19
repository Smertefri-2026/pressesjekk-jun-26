import Link from "next/link";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";

const plans = [
  {
    name: "Gratis forhåndssjekk",
    price: "0 kr",
    tag: "Start her",
    description:
      "Kort foreløpig vurdering av artikkel, mulig risikonivå og relevante problemområder.",
    features: [
      "Én URL eller artikkeltekst",
      "Kort sammendrag",
      "Foreløpig risikonivå",
      "Mulige presseetiske temaer",
      "Ingen full rapport",
    ],
  },
  {
    name: "PresseSjekk Enkel",
    price: "490 kr",
    tag: "Én artikkel",
    description:
      "Full rapport for én artikkel med vurdering av presseetiske problemstillinger.",
    features: [
      "Full artikkelanalyse",
      "Vurdering av tittel og ingress",
      "Kildebruk og dokumentasjon",
      "Identifisering og privatliv",
      "Anbefalt neste steg",
    ],
  },
  {
    name: "PresseSjekk + PFU",
    price: "790 kr",
    tag: "Mest relevant",
    description:
      "Full rapport, tilsvarsvurdering, rettsstatus og utkast til PFU-klage.",
    features: [
      "Alt i PresseSjekk Enkel",
      "Tilsvar og samtidig imøtegåelse",
      "Straffesak, dom og rettsstatus",
      "Vedleggsliste",
      "PFU-klageutkast",
    ],
  },
  {
    name: "PresseSjekk Sak",
    price: "1 490 kr",
    tag: "Flere artikler",
    description:
      "For saker med opptil tre artikler som skal vurderes samlet.",
    features: [
      "Opptil 3 artikler",
      "Samlet vurdering",
      "Tidslinje",
      "Felles dokumentasjon",
      "Samlet PFU-klageutkast",
    ],
  },
  {
    name: "Stor sak",
    price: "2 990 kr",
    tag: "Utvidet sak",
    description:
      "For større mediesaker med flere artikler, dokumentasjon og videre oppfølging.",
    features: [
      "Opptil 10 artikler",
      "Saksoversikt",
      "Utvidet tidslinje",
      "Flere vedlegg",
      "Grunnlag for videre dokumenter",
    ],
  },
  {
    name: "Proff",
    price: "Fra 4 990 kr/mnd",
    tag: "Advokat / PR",
    description:
      "For advokater, PR-rådgivere, organisasjoner og bedrifter med flere saker.",
    features: [
      "Flere klientmapper",
      "Flere brukere",
      "Månedsbaserte credits",
      "Adminoversikt",
      "Prioritert videreutvikling",
    ],
  },
];

export default function PriserPage() {
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
              Priser
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
              Start gratis – betal når du trenger full rapport
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              PresseSjekk bør være tilgjengelig for mange, men samtidig priset
              slik at tjenesten kan videreutvikles, driftes sikkert og tåle høy
              trafikk.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-xl"
              >
                <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                  {plan.tag}
                </p>

                <h2 className="mt-5 text-2xl font-bold">{plan.name}</h2>
                <p className="mt-3 text-4xl font-bold text-white">
                  {plan.price}
                </p>
                <p className="mt-4 leading-7 text-slate-300">
                  {plan.description}
                </p>

                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="text-cyan-300">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/pressesjekk"
                  className="mt-7 block rounded-xl bg-cyan-300 px-5 py-3 text-center font-semibold text-slate-950 hover:bg-cyan-200"
                >
                  Start sjekk
                </Link>
              </article>
            ))}
          </div>

          <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
              Credits
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              Senere bygges betaling med credits
            </h2>
            <p className="mt-5 max-w-3xl leading-8 text-slate-300">
              I første versjon viser vi bare prisene. Når Stripe eller Vipps
              kobles på, bør systemet bruke credits. Da kan brukeren kjøpe én,
              tre eller fem sjekker, og senere bruke dem på rapporter,
              PFU-klageutkast eller videre dokumenter.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                <strong>1 credit</strong>
                <p className="mt-2 text-sm text-slate-400">
                  Én full rapport for én artikkel.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                <strong>2 credits</strong>
                <p className="mt-2 text-sm text-slate-400">
                  Rapport + PFU-klageutkast.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                <strong>3+ credits</strong>
                <p className="mt-2 text-sm text-slate-400">
                  Større sak med flere artikler og dokumenter.
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

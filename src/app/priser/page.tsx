import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { v1PurchasablePackages } from "@/data/packagePlans";

const stepExplanations = [
  {
    title: "Steg 1–3",
    subtitle: "Rapportpakke",
    text: "Saken registreres, opplysninger legges inn, og PresseSjekk lager en strukturert rapport eller redaksjonell sjekk.",
  },
  {
    title: "Steg 1–4",
    subtitle: "PFU-pakke",
    text: "Alt i rapportpakken, i tillegg til et strukturert PFU-klage basert på saken og presseetiske vurderinger.",
  },
  {
    title: "Steg 1–6",
    subtitle: "Full dokumentpakke",
    text: "Komplett digital saksgang med rapport, PFU-klage og PFU-avgjørelse, PFU-status og politianmeldelse/dokumentgrunnlag.",
  },
  {
    title: "Steg 1–7",
    subtitle: "Utredningspakke",
    text: "Hele saksgangen samlet i en mer komplett utredning med tidslinje, dokumentasjon, vurderinger og vedleggsliste.",
  },
];

const upgrades = [
  {
    title: "Start enkelt",
    text: "Begynn med Rapportpakke dersom du først vil få oversikt over saken.",
  },
  {
    title: "Oppgrader ved behov",
    text: "Gå videre til PFU-pakke eller full dokumentpakke dersom saken bør følges opp.",
  },
  {
    title: "Velg profftilgang",
    text: "Bruk månedlig tilgang hvis du jobber med flere saker, klienter eller redaksjonelle vurderinger.",
  },
];

export default function PriserPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/"
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          ← Tilbake til forsiden
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_420px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Priser
            </p>

            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl md:text-7xl">
              Velg pakken som passer saken.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Du betaler per sak og kan oppgradere underveis. Jobber du med
              flere saker, klienter eller redaksjonelle vurderinger, kan du ta
              kontakt for profftilgang.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/min-side/saker/ny"
                className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800"
              >
                Start sak
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
              Fleksibel betaling
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Start med én sak eller velg profftilgang
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Enkeltkjøp passer for én konkret mediesak. Månedlig profftilgang
              passer for advokater, rådgivere, redaksjoner og organisasjoner
              som jobber med flere saker.
            </p>

            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Oppgradering
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                Du kan starte enkelt
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Begynn med rapportpakke og oppgrader dersom saken krever PFU,
                politianmeldelse eller utredning.
              </p>
            </div>
          </aside>
        </div>

        <section className="mt-16">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Enkeltkjøp per sak
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Velg riktig nivå for saken
          </h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-700">
            Du velger pakke, oppretter eller knytter den til en sak, og betaler
            trygt. Du kan oppgradere senere hvis saken bør følges opp videre.
          </p>
        </section>

        <section className="mt-8 grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
          {v1PurchasablePackages.map((plan) => (
            <article
              key={plan.id}
              className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="inline-flex w-fit rounded-full bg-cyan-100 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-cyan-800">
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

              <ul className="mb-8 mt-6 space-y-3 text-sm font-medium text-slate-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-cyan-700">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/min-side/saker/ny?package=${plan.id}`}
                className="mt-auto block rounded-xl bg-cyan-500 px-5 py-4 text-center font-black text-slate-950 hover:bg-cyan-400"
              >
                {plan.button}
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                  Profftilgang og utredning
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-950">
                  Flere saker, månedsavtale eller full utredning?
                </h2>
                <p className="mt-4 max-w-2xl leading-8 text-slate-700">
                  Månedlig profftilgang for advokater, rådgivere, redaksjoner og
                  organisasjoner, samt utredningspakke for større saker, avtales
                  direkte med oss.
                </p>
              </div>

              <Link
                href="/kontakt"
                className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-6 py-4 font-black text-slate-950 hover:bg-slate-100"
              >
                Kontakt oss
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Hva betyr pakkene?
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              Prisene følger saksgangen.
            </h2>
            <p className="mt-4 max-w-3xl leading-8 text-slate-700">
              Jo lenger saken skal følges opp, desto mer omfattende blir
              dokumentasjonen. Derfor er pakkene bygget rundt stegene i Min Side.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stepExplanations.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-700">
                    {item.title}
                  </p>
                  <h3 className="mt-2 text-xl font-black text-slate-950">
                    {item.subtitle}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Oppgradering
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Start enkelt. Oppgrader når saken krever mer.
          </h2>

          <p className="mt-4 max-w-3xl leading-8 text-slate-700">
            Mange saker starter med behov for oversikt. Dersom rapporten viser
            at saken bør tas videre, kan brukeren oppgradere til PFU-pakke, full
            dokumentpakke eller utredningspakke.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {upgrades.map((item) => (
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
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Klar til å starte?
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Start med én sak.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-700">
            Du kan begynne med enkeltkjøp per sak, eller velge profftilgang
            dersom du jobber med flere saker hver måned.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/min-side/saker/ny"
              className="rounded-xl bg-cyan-500 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-400"
            >
              Start sak
            </Link>
            <Link
              href="/kontakt"
              className="rounded-xl border border-slate-300 px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
            >
              Kontakt oss
            </Link>
          </div>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}

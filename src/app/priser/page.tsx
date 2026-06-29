import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { monthlyPackages, singlePackages } from "@/data/packagePlans";

const caseBundles = [
  {
    name: "3 saker",
    price: "1 390 kr",
    perCase: "ca. 463 kr per sak",
    tag: "Liten pakke",
    description:
      "For deg som vil teste flere mediesaker uten å binde deg til abonnement.",
    features: [
      "3 rapportpakke-saker",
      "Kan brukes på ulike mediesaker",
      "Hver sak kan oppgraderes ved behov",
      "Passer for privatpersoner og små virksomheter",
    ],
    button: "Velg 3 saker",
    href: "/kontakt",
  },
  {
    name: "5 saker",
    price: "2 190 kr",
    perCase: "ca. 438 kr per sak",
    tag: "Mest fleksibel",
    description:
      "For deg som har flere omtaler, klienter eller saker som bør struktureres.",
    features: [
      "5 rapportpakke-saker",
      "Bedre pris enn enkeltkjøp",
      "Kan brukes over tid",
      "Oppgradering per sak ved behov",
    ],
    button: "Velg 5 saker",
    href: "/kontakt",
  },
  {
    name: "10 saker",
    price: "3 990 kr",
    perCase: "ca. 399 kr per sak",
    tag: "Best uten abonnement",
    description:
      "For deg som trenger flere enkeltsaker, men ikke ønsker månedlig avtale.",
    features: [
      "10 rapportpakke-saker",
      "Lavere pris per sak",
      "Passer for sporadisk proffbruk",
      "Proff-abonnement anbefales ved løpende behov",
    ],
    button: "Velg 10 saker",
    href: "/kontakt",
  },
];

const usageModels = [
  {
    title: "Én sak",
    text: "Passer når du vil vurdere én konkret mediesituasjon. Én sak kan inneholde flere artikler eller URL-er om samme omtale.",
  },
  {
    title: "Sakspakker",
    text: "Passer når du har flere saker, men ikke ønsker abonnement. Hver sak starter som rapportpakke og kan oppgraderes.",
  },
  {
    title: "Proff",
    text: "Passer for advokater, rådgivere, organisasjoner og andre som jobber løpende med mediesaker.",
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

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_390px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Priser
            </p>

            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl md:text-7xl">
              Velg hvordan du vil bruke PresseSjekk.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Start med én sak, kjøp flere saker som pakke, eller velg
              proff-abonnement for løpende arbeid. Én sak kan inneholde flere
              artikler eller URL-er om samme mediesituasjon.
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
              Prislogikk
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Sakspakker er fleksible. Proff er for løpende bruk.
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Enkeltkjøp og sakspakker passer for sporadisk bruk. Proff passer
              når du jobber med mediesaker hver måned og ønsker lavere pris per
              sak over tid.
            </p>
          </aside>
        </div>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {usageModels.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-2xl font-black text-slate-950">
                {item.title}
              </h2>
              <p className="mt-4 leading-8 text-slate-700">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-16">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Én sak
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Kjøp pakke for én konkret mediesak.
          </h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-700">
            En sak kan bestå av flere artikler, oppfølgingssaker eller URL-er
            om samme mediesituasjon. Du kan starte enkelt og oppgradere saken
            hvis den bør følges opp videre.
          </p>

          <div className="mt-8 grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
            {singlePackages.map((plan) => (
              <article
                key={plan.id}
                className={`flex h-full flex-col rounded-3xl border p-6 shadow-sm ${
                  plan.id === "investigation_pack"
                    ? "border-amber-300 bg-amber-50"
                    : plan.id === "full_pack"
                      ? "border-cyan-300 bg-cyan-50"
                      : "border-slate-200 bg-white"
                }`}
              >
                <p className="inline-flex w-fit rounded-full bg-cyan-100 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-cyan-800">
                  {plan.tag}
                </p>

                <h3 className="mt-5 text-2xl font-black text-slate-950">
                  {plan.name}
                </h3>

                <p className="mt-3 text-4xl font-black text-slate-950">
                  {plan.price}
                </p>

                <p className="mt-4 leading-8 text-slate-700">
                  {plan.description}
                </p>

                <ul className="mb-8 mt-6 grid flex-1 content-start gap-3 text-sm font-medium text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="text-cyan-700">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={
                    plan.id === "investigation_pack"
                      ? "/kontakt"
                      : `/min-side/saker/ny?package=${plan.id}`
                  }
                  className="mt-auto block rounded-xl bg-cyan-500 px-5 py-4 text-center font-black text-slate-950 hover:bg-cyan-400"
                >
                  {plan.button}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Sakspakker
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Kjøp flere saker uten abonnement.
          </h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-700">
            Sakspakker passer når du har flere mediesaker, men ikke trenger
            løpende proff-abonnement. Hver inkluderte sak starter som
            rapportpakke og kan oppgraderes ved behov.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {caseBundles.map((bundle) => (
              <article
                key={bundle.name}
                className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="inline-flex w-fit rounded-full bg-cyan-100 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-cyan-800">
                  {bundle.tag}
                </p>

                <h3 className="mt-5 text-3xl font-black text-slate-950">
                  {bundle.name}
                </h3>

                <p className="mt-3 text-4xl font-black text-slate-950">
                  {bundle.price}
                </p>

                <p className="mt-2 text-sm font-black text-cyan-800">
                  {bundle.perCase}
                </p>

                <p className="mt-4 leading-8 text-slate-700">
                  {bundle.description}
                </p>

                <ul className="mb-8 mt-6 grid flex-1 content-start gap-3 text-sm font-medium text-slate-700">
                  {bundle.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="text-cyan-700">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={bundle.href}
                  className="mt-auto block rounded-xl border border-slate-300 bg-white px-5 py-4 text-center font-black text-slate-950 hover:bg-slate-100"
                >
                  {bundle.button}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Proff-abonnement
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            For deg som jobber løpende med mediesaker.
          </h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-700">
            Proff gir løpende tilgang og passer for advokater, rådgivere,
            organisasjoner, byråer og redaksjoner som vurderer flere saker hver
            måned.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {monthlyPackages.map((plan) => (
              <article
                key={plan.id}
                className={`flex h-full flex-col rounded-3xl border p-6 shadow-sm ${
                  plan.id === "monthly_pro"
                    ? "border-cyan-300 bg-cyan-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <p className="inline-flex w-fit rounded-full bg-cyan-100 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-cyan-800">
                  {plan.tag}
                </p>

                <h3 className="mt-5 text-2xl font-black text-slate-950">
                  {plan.name}
                </h3>

                <p className="mt-3 text-3xl font-black text-slate-950">
                  {plan.price}
                </p>

                <p className="mt-4 leading-8 text-slate-700">
                  {plan.description}
                </p>

                <ul className="mb-8 mt-6 grid flex-1 content-start gap-3 text-sm font-medium text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="text-cyan-700">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className="mt-auto block rounded-xl bg-slate-950 px-5 py-4 text-center font-black text-white hover:bg-slate-800"
                >
                  {plan.button}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Utredningspakke
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            For større saker som krever manuell gjennomgang.
          </h2>

          <p className="mt-4 max-w-3xl leading-8 text-slate-700">
            Utredningspakken kan inkludere manuell research, større gjennomgang,
            strukturering, dokumentliste og AI-støttet analyse ved behov. Denne
            pakken avtales manuelt.
          </p>

          <Link
            href="/kontakt"
            className="mt-7 inline-flex rounded-xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800"
          >
            Be om utredningspakke
          </Link>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Klar til å starte?
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Start med én sak.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-700">
            Du kan begynne med enkeltkjøp per sak, kjøpe en sakspakke eller
            kontakte oss om proff-abonnement.
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

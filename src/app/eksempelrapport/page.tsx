"use client";

import Link from "next/link";
import { useState } from "react";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

type ExampleKey = "rapport" | "pfu" | "politianmeldelse" | "utredning";

const tabs: {
  key: ExampleKey;
  label: string;
  step: string;
  packageName: string;
}[] = [
  {
    key: "rapport",
    label: "Rapport",
    step: "Steg 3",
    packageName: "Rapportpakke",
  },
  {
    key: "pfu",
    label: "PFU-klage",
    step: "Steg 4",
    packageName: "PFU-pakke",
  },
  {
    key: "politianmeldelse",
    label: "Politianmeldelse",
    step: "Steg 6",
    packageName: "Full dokumentpakke",
  },
  {
    key: "utredning",
    label: "Utredning",
    step: "Steg 7",
    packageName: "Utredningspakke",
  },
];

const exampleData = {
  rapport: {
    eyebrow: "PresseSjekk rapport",
    title: "Vurderingsrapport",
    subtitle:
      "Strukturert vurdering av artikkel, tilsvar, dokumentasjon og mulige presseetiske problemstillinger.",
    summary:
      "Ola Nordmann er omtalt i en lokalavis i forbindelse med en konflikt om et kommunalt prosjekt. Artikkelen inneholder sterke karakteristikker og viser til flere påstander om Olas rolle. Basert på opplysningene i saken kan det være relevant å vurdere samtidig imøtegåelse, tittelbruk, kildegrunnlag og identifisering.",
    sections: [
      {
        title: "Foreløpig sammendrag",
        text: "Saken gjelder en publisering der Ola Nordmann mener artikkelen gir et skjevt og belastende bilde av hans rolle. Han opplyser at han ble kontaktet kort tid før publisering, men at alle konkrete beskyldninger ikke ble forelagt tydelig.",
      },
      {
        title: "Mulige presseetiske problemstillinger",
        text: "Rapporten peker særlig på VVP 4.1 om saklighet og omtanke, VVP 4.4 om dekning for tittel og ingress, VVP 4.7 om identifisering og VVP 4.14 om samtidig imøtegåelse.",
      },
      {
        title: "Dokumentasjon som bør legges til",
        text: "E-post fra journalist, Olas svar, skjermbilder av artikkelen, eventuell redaktørdialog og dokumentasjon som viser sakens faktiske bakgrunn.",
      },
      {
        title: "Anbefalt neste steg",
        text: "Saken bør kompletteres med dokumentasjon før eventuell PFU-klage. Rapporten er ikke en konklusjon, men et strukturert arbeidsgrunnlag.",
      },
    ],
    bullets: [
      "Vurder om sterke faktiske beskyldninger ble forelagt tydelig nok.",
      "Vurder om tittel og ingress har dekning i artikkelens innhold.",
      "Vurder om Ola Nordmann er identifisert på en nødvendig og forholdsmessig måte.",
      "Samle dokumentasjon før saken eventuelt sendes videre.",
    ],
  },
  pfu: {
    eyebrow: "PFU-klage",
    title: "Utkast til PFU-klage",
    subtitle:
      "Et strukturert klageutkast basert på sak, rapport og dokumentasjon.",
    summary:
      "Ola Nordmann ønsker å klage inn en artikkel han mener er ubalansert og belastende. Klageutkastet samler sakens bakgrunn, hva Ola mener er problematisk, relevante VVP-punkter og forslag til vedlegg.",
    sections: [
      {
        title: "1. Innledning",
        text: "Klager er Ola Nordmann. Klagen gjelder en artikkel publisert av Eksempelavisen om en lokal konflikt. Klager mener artikkelen inneholder sterke og belastende påstander som ikke ble forelagt tydelig nok før publisering.",
      },
      {
        title: "2. Sakens bakgrunn",
        text: "Artikkelen omtaler et lokalt prosjekt og knytter Ola Nordmann til påstander om kritikkverdig opptreden. Ola mener artikkelen gir et uriktig helhetsinntrykk og at hans tilsvar bare delvis ble gjengitt.",
      },
      {
        title: "3. Mulige brudd på Vær Varsom-plakaten",
        text: "Klagen kan særlig knyttes til VVP 4.1, 4.4, 4.7, 4.13 og 4.14. Punktene må vurderes konkret opp mot artikkeltekst, dokumentasjon og kontakt med redaksjonen.",
      },
      {
        title: "4. Vedlegg",
        text: "Artikkelutskrift, e-post fra journalist, Olas svar, skjermbilder, eventuell redaktørdialog og dokumentasjon som viser senere utvikling.",
      },
    ],
    bullets: [
      "PFU-klagen bør være saklig, konkret og dokumentert.",
      "Klagen bør vise nøyaktig hva som oppleves feil eller ubalansert.",
      "Vedlegg bør nummereres og vises til i teksten.",
      "Klagen må kontrolleres før innsending.",
    ],
  },
  politianmeldelse: {
    eyebrow: "Politianmeldelse",
    title: "Foreløpig utkast til politianmeldelse",
    subtitle:
      "Et strukturert vurderingsgrunnlag for alvorlige mediesaker der politisporet, PFU-sporet og et mulig sivilt krav må skilles tydelig.",
    summary:
      "Dette eksempelet viser hvordan PresseSjekk kan hjelpe med å strukturere en mulig politianmeldelse uten å konkludere juridisk. Utkastet skiller mellom presseetiske forhold, mulige straffbare forhold og ærekrenkende eller omdømmeskadelig omtale som normalt må vurderes som et sivilt spor.",
    sections: [
      {
        title: "1. Anmelder / klager",
        text: "Navn: Ola Nordmann. Rolle: Privatperson. Saken gjelder medieomtale der Ola mener han er fremstilt på en uriktig, belastende og omdømmeskadelig måte.",
      },
      {
        title: "2. Kort sammendrag",
        text: "Eksempelavisen publiserte en artikkel der Ola Nordmann ble omtalt i en konflikt. Ola mener omtalen kan gi et uriktig og skadelig inntrykk, og at redaksjonen ikke har håndtert samtidig imøtegåelse, tilsvar eller senere oppdatering på en tilfredsstillende måte.",
      },
      {
        title: "3. Mulige strafferettslige spørsmål",
        text: "Politiet vurderer konkrete straffbare forhold, ikke PFU-spørsmål alene. I en mediesak kan det for eksempel være relevant å beskrive om publiseringen kan berøre privatlivets fred etter straffeloven § 267, hensynsløs atferd etter straffeloven § 266, trusler, hatefulle ytringer eller andre konkrete personrettede forhold. Utkastet skal ikke konkludere, men be om at forholdene vurderes dersom faktagrunnlaget tilsier det.",
      },
      {
        title: "4. Ærekrenkelse og sivilt spor",
        text: "Påstander som oppleves ærekrenkende eller omdømmeskadelige bør beskrives konkret. Samtidig er ærekrenkelser normalt ikke en vanlig politisak alene, men et mulig sivilt spor, blant annet etter skadeserstatningsloven § 3-6 a. Derfor bør utkastet skille tydelig mellom politisporet og et mulig krav om erstatning eller oppreisning.",
      },
      {
        title: "5. Dokumentasjon og vedlegg",
        text: "Utkastet bør vise til artikkel, publiseringsdato, skjermbilder, kontakt med journalist eller redaktør, eventuelt tilsvar, PFU-spor, senere oppdateringer og annen dokumentasjon som kan belyse saken.",
      },
      {
        title: "6. Forbehold",
        text: "Dette er et foreløpig utkast og et arbeidsgrunnlag. Det er ikke juridisk rådgivning, ikke en konklusjon om straffbart forhold og må kvalitetssikres av bruker eller advokat før eventuell innsending.",
      },
    ],
    bullets: [
      "Skiller mellom PFU-spor, mulig straffespor og sivilt/erstatningsrettslig spor.",
      "Forklarer at politiet vurderer konkrete straffbare forhold, ikke presseetikk alene.",
      "Kan omtale privatlivets fred, hensynsløs atferd, trusler eller hatefulle ytringer hvis faktagrunnlaget tilsier det.",
      "Plasserer ærekrenkende og omdømmeskadelig omtale i et mulig sivilt spor.",
      "Advokat bør vurdere teksten før bruk.",
    ],
  },
  utredning: {
    eyebrow: "PresseSjekk utredning",
    title: "Komplett utredningsgrunnlag",
    subtitle:
      "Samlet dokumentpakke med sak, tidslinje, rapport, PFU-klage, PFU-avgjørelse, politianmeldelse og vedleggsliste.",
    summary:
      "Utredningen samler hele saken om Ola Nordmann i én strukturert fremstilling. Målet er å gi en ryddig oversikt over publisering, dokumentasjon, kronologi, presseetiske spørsmål, mulige rettslige spor og videre anbefalt arbeid.",
    sections: [
      {
        title: "1. Saksforside / hovedopplysninger",
        text: "Sakstittel: Omtale av Ola Nordmann i lokal konflikt. Mediehus: Eksempelavisen. Dokumenttype: PresseSjekk utredning. Formål: Samle saken i ett strukturert grunnlag.",
      },
      {
        title: "2. Kronologisk gjennomgang",
        text: "Artikkel publiseres. Ola kontakter redaksjonen. Tilsvar sendes. Redaksjonen svarer. Dokumentasjon samles. Rapport og PFU-klage vurderes.",
      },
      {
        title: "3. Dokumentasjon og vedlegg",
        text: "Vedlegg 01: Artikkelutskrift. Vedlegg 02: E-post fra journalist. Vedlegg 03: Olas tilsvar. Vedlegg 04: Redaktørsvar. Vedlegg 05: Skjermbilder og senere oppdateringer.",
      },
      {
        title: "4. Videre anbefalt arbeid",
        text: "Sorter dokumentasjonen, kvalitetssikre tidslinjen, vurder PFU-klage og PFU-avgjørelse, vurder behov for juridisk bistand og oppdater saken dersom nye opplysninger kommer til.",
      },
    ],
    bullets: [
      "Egnet for større eller mer alvorlige saker.",
      "Samler rapport, klageutkast og dokumentasjon.",
      "Gir bedre oversikt før advokat, PFU eller videre oppfølging.",
      "Bør kvalitetssikres manuelt før formell bruk.",
    ],
  },
};

const timeline = [
  "Artikkel publiseres",
  "Ola Nordmann kontakter redaksjonen",
  "Tilsvar og dokumentasjon samles",
  "Rapport genereres",
  "PFU-klage, politianmeldelse eller utredning vurderes",
];

export default function EksempelrapportPage() {
  const [activeTab, setActiveTab] = useState<ExampleKey>("rapport");
  const active = exampleData[activeTab];
  const activeMeta = tabs.find((item) => item.key === activeTab) ?? tabs[0];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/"
          className="text-sm font-semibold text-red-700 hover:text-red-900"
        >
          ← Tilbake til forsiden
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_390px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-700">
              Eksempelrapport
            </p>

            <h1 className="mt-4 max-w-4xl [text-wrap:balance] text-4xl font-black sm:text-5xl tracking-tight text-slate-950 md:text-7xl">
              Se eksempel på dokumentene PresseSjekk kan lage.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Her bruker vi en anonym testperson, Ola Nordmann, for å vise
              hvordan saken kan bygges fra rapport til PFU-klage,
              politianmeldelse og utredning. Tekstene er forenklede eksempler,
              ikke ekte juridiske vurderinger.
            </p>

          </section>

          <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <img
              src="/images/eksempelrapport2.png"
              alt="Illustrasjon av fire dokumenttyper i en strukturert mediesak."
              className="h-full min-h-[210px] w-full object-cover sm:min-h-[280px] lg:min-h-[360px]"
            />
          </figure>
        </div>

        <section className="mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`min-w-[210px] rounded-2xl border px-4 py-4 text-left transition md:min-w-0 ${
                  activeTab === item.key
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-slate-50 hover:bg-white"
                }`}
              >
                <p
                  className={`text-xs font-black uppercase tracking-[0.18em] ${
                    activeTab === item.key ? "text-orange-300" : "text-red-700"
                  }`}
                >
                  {item.step}
                </p>
                <p
                  className={`mt-1 text-lg font-black ${
                    activeTab === item.key ? "text-white" : "text-slate-950"
                  }`}
                >
                  {item.label}
                </p>
                <p
                  className={`mt-1 text-xs font-semibold ${
                    activeTab === item.key ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {item.packageName}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_390px] lg:items-start">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
              {active.eyebrow}
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              {active.title}
            </h2>

            <p className="mt-2 text-sm font-bold text-slate-500">
              {activeMeta.step} · {activeMeta.packageName}
            </p>

            <p className="mt-5 text-lg leading-9 text-slate-700">
              {active.subtitle}
            </p>

            <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-red-800">
                Eksempel / sammendrag
              </p>
              <p className="mt-3 leading-8 text-slate-700">{active.summary}</p>
            </div>

            <div className="mt-8 grid gap-5">
              {active.sections.map((section) => (
                <section
                  key={section.title}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <h3 className="text-xl font-black text-slate-950">
                    {section.title}
                  </h3>
                  <p className="mt-3 leading-8 text-slate-700">
                    {section.text}
                  </p>
                </section>
              ))}
            </div>
          </article>

          <aside className="grid content-start gap-6">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
                Viktig forbehold
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Kun demo
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                Dette er et anonymisert og forenklet eksempel med Ola Nordmann.
                En ekte rapport må bygge på faktiske opplysninger, dokumentasjon
                og brukerens egen versjon.
              </p>
            </div>

            <figure className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
              <img
                src="/images/eksempelrapport3.png"
                alt="Illustrasjon av strukturert vurdering, dokumentasjon og vedlegg i en mediesak."
                className="w-full object-cover"
                loading="lazy"
              />
            </figure>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
                Innhold
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                Dette kan dokumentet inneholde
              </h2>

              <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
                {active.bullets.map((item) => (
                  <li key={item}>
                    <span className="mr-2 text-red-700">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-300">
                Test selv
              </p>
              <h2 className="mt-3 text-3xl font-black">
                Start med én sak
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                Bruk rask sjekk først, eller opprett en lagret sak dersom du er
                omtalt og trenger dokumentasjon.
              </p>
              <Link
                href="/pressesjekk"
                className="mt-6 block rounded-xl bg-red-500 px-5 py-4 text-center font-black text-white hover:bg-orange-600"
              >
                Start sjekk
              </Link>
            </div>
          </aside>
        </section>

        <section className="mt-16 overflow-hidden rounded-3xl bg-slate-950 text-white shadow-sm">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_460px] lg:items-stretch">
            <div className="grid content-start gap-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-300">
                  Eksempel på tidslinje
                </p>
                <h2 className="mt-3 text-4xl font-black">
                  Samme sak kan bygges videre
                </h2>
                <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                  En mediesak endrer seg ofte etter publisering. Derfor bør
                  dokumentasjon, tilsvar, rapporter og videre oppfølging samles i
                  én saksgang.
                </p>
              </div>

              <div className="grid gap-3">
                {timeline.map((item, index) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-slate-200"
                  >
                    <span className="mr-2 text-orange-300">{index + 1}.</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <figure className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <img
                src="/images/eksempelrapport4.png"
                alt="Illustrasjon av en komplett mediesak med dokumenter, tidslinje og vedlegg."
                className="h-full min-h-[230px] w-full object-cover sm:min-h-[300px] lg:min-h-[420px]"
                loading="lazy"
              />
            </figure>
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
            Klar til å teste?
          </p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            Start med én artikkel
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-700">
            Du kan starte med rask sjekk uten innlogging, eller opprette en
            lagret sak dersom du er omtalt og trenger rapport, PFU-klage eller
            videre dokumentasjon.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/pressesjekk"
              className="rounded-xl bg-red-500 px-6 py-4 font-bold text-slate-950 hover:bg-red-500"
            >
              Start sjekk
            </Link>
            <Link
              href="/priser"
              className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
            >
              Se pakker og priser
            </Link>
          </div>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}

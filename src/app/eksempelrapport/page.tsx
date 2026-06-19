import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

const reportFindings = [
  {
    title: "Samtidig imøtegåelse",
    level: "Høy relevans",
    text: "Artikkelen inneholder sterke faktiske beskyldninger. Brukeren oppgir at henvendelsen før publisering var kort, og at alle konkrete påstander ikke ble forelagt tydelig nok før publisering.",
  },
  {
    title: "Kildebruk og dokumentasjon",
    level: "Middels relevans",
    text: "Flere påstander fremstår belastende. Rapporten bør undersøke om artikkelen tydelig viser hvilket faktisk grunnlag redaksjonen bygger på.",
  },
  {
    title: "Identifisering",
    level: "Middels/høy relevans",
    text: "Dersom personen er navngitt, avbildet eller indirekte identifiserbar, bør det vurderes om identifiseringen er nødvendig og forholdsmessig.",
  },
  {
    title: "Rettsstatus og oppdateringsbehov",
    level: "Middels relevans",
    text: "Hvis saken senere er henlagt, endret, frifunnet eller rettskraftig avgjort, kan det være relevant å vurdere om artikkelen bør oppdateres.",
  },
];

const evidenceItems = [
  "Kopi eller lenke til publisert artikkel",
  "E-post eller SMS fra journalist før publisering",
  "Brukerens svar til journalist eller redaksjon",
  "Skjermbilde av tittel, ingress, bildebruk og publiseringstidspunkt",
  "Eventuell dokumentasjon på rettsstatus, dom, henleggelse eller frifinnelse",
];

const reportSections = [
  "Sammendrag av artikkelen",
  "Mulige presseetiske problemstillinger",
  "Vurdering av tilsvar og kontakt før publisering",
  "Vurdering av identifisering og skadevirkning",
  "Dokumentasjon og vedleggsliste",
  "Anbefalt neste steg",
  "Utkast til PFU-klage",
];

export default function EksempelrapportPage() {
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
              Eksempelrapport
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Slik kan en full rapport se ut.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              En PresseSjekk-rapport skal samle artikkel, tilsvar,
              rettsstatus, dokumentasjon og mulige presseetiske
              problemstillinger i én strukturert vurdering. Her ser du et
              forenklet og anonymisert eksempel.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/pressesjekk"
                className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800"
              >
                Start egen sjekk
              </Link>
              <Link
                href="/priser"
                className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
              >
                Se priser
              </Link>
            </div>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-7 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Hva får kunden?
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Rapport + klagegrunnlag
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Målet er å gi brukeren et bedre grunnlag før videre oppfølging:
              redaktørklage, PFU-klage, dialog med advokat eller intern
              dokumentasjon.
            </p>

            <div className="mt-6 space-y-3">
              {reportSections.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm"
                >
                  <span className="mr-2 text-cyan-700">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </div>

        <section className="mt-16 rounded-3xl border border-cyan-200 bg-cyan-50 p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
            Sammendrag
          </p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            Foreløpig vurdering av saken
          </h2>
          <p className="mt-5 max-w-4xl leading-8 text-slate-700">
            Artikkelen omtaler en person i en belastende sammenheng. Basert på
            opplysningene i denne eksempelrapporten kan saken reise spørsmål om
            samtidig imøtegåelse, kildebruk, identifisering og om artikkelen gir
            et balansert bilde av hendelsesforløpet.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Risikonivå
              </p>
              <p className="mt-2 text-3xl font-black text-amber-600">
                Middels/høy
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Mulige funn
              </p>
              <p className="mt-2 text-3xl font-black text-cyan-700">4</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Anbefalt neste steg
              </p>
              <p className="mt-2 text-xl font-black text-slate-950">
                PFU-vurdering
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Artikkeldata
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Grunnlaget rapporten bygger på
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">Medium</p>
                <p className="mt-2 font-black text-slate-950">
                  Eksempelavisen
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Publisert
                </p>
                <p className="mt-2 font-black text-slate-950">18.06.2026</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Artikkeltype
                </p>
                <p className="mt-2 font-black text-slate-950">
                  Nyhetsartikkel
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Sjekket før
                </p>
                <p className="mt-2 font-black text-cyan-700">47 ganger</p>
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
              Viktig
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Eksempelet er forenklet
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              En ekte rapport vil avhenge av artikkeltekst, dokumentasjon,
              brukerens egne opplysninger og eventuell rettslig utvikling.
              Rapporten må alltid kontrolleres før bruk.
            </p>
          </aside>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Mulige funn
          </p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            Presseetiske problemstillinger som bør vurderes
          </h2>

          <div className="mt-8 space-y-4">
            {reportFindings.map((finding) => (
              <article
                key={finding.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <h3 className="text-xl font-black text-slate-950">
                    {finding.title}
                  </h3>
                  <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
                    {finding.level}
                  </span>
                </div>
                <p className="mt-3 leading-7 text-slate-700">
                  {finding.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Tilsvar
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Kontakt før publisering
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Brukeren oppgir at journalist tok kontakt samme dag som
              artikkelen ble publisert. Henvendelsen skal ha inneholdt noen
              spørsmål, men ikke alle konkrete beskyldninger som senere kom frem
              i artikkelen. Brukeren oppgir også at svaret bare delvis ble tatt
              med.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">Kontakt</p>
                <p className="mt-2 font-black">Ja, e-post</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Svarfrist
                </p>
                <p className="mt-2 font-black">1–3 timer</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Svar tatt med
                </p>
                <p className="mt-2 font-black">Delvis</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Vedlegg
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Dokumentasjon som bør samles
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              En sterk klage bør bygge på dokumentasjon. PresseSjekk bør derfor
              samle vedleggene i en strukturert liste som kan brukes videre.
            </p>

            <ul className="mt-6 space-y-3 text-sm font-medium text-slate-700">
              {evidenceItems.map((item) => (
                <li key={item}>
                  <span className="mr-2 text-cyan-700">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                PFU-klageutkast
              </p>
              <h2 className="mt-3 text-4xl font-black">
                Fra rapport til strukturert klage
              </h2>
              <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                Rapporten kan danne grunnlag for et klageutkast. Brukeren må
                alltid kontrollere teksten, legge til egne opplysninger og selv
                godkjenne innholdet før eventuell innsending.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="font-black text-white">Eksempel på klagepunkt:</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Klager mener at artikkelen kan reise spørsmål om manglende reell
                samtidig imøtegåelse. Klager oppgir at redaksjonen ikke forela
                alle konkrete beskyldninger før publisering, og at klagers svar
                bare delvis ble gjengitt i artikkelen.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-cyan-200 bg-cyan-50 p-8 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
                Rapportversjoner
              </p>
              <h2 className="mt-3 text-4xl font-black text-slate-950">
                Rapporten kan oppdateres
              </h2>
              <p className="mt-5 max-w-3xl leading-8 text-slate-700">
                En mediesak kan endre seg etter publisering. Brukeren kan ha
                valgt feil i skjemaet, finne nye e-poster, få svar fra
                redaksjonen, motta ny dokumentasjon eller få oppdatert
                rettsstatus. Derfor bør PresseSjekk bygges slik at saken kan
                redigeres og rapporten kan genereres på nytt.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm">
                <span className="mr-2 text-cyan-700">✓</span>
                Endre artikkeldata, tilsvar og svarfrist
              </div>
              <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm">
                <span className="mr-2 text-cyan-700">✓</span>
                Legg til nye e-poster, SMS-er og vedlegg
              </div>
              <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm">
                <span className="mr-2 text-cyan-700">✓</span>
                Oppdater rettsstatus, dom, henleggelse eller frifinnelse
              </div>
              <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm">
                <span className="mr-2 text-cyan-700">✓</span>
                Lag ny rapportversjon og oppdatert PFU-klageutkast
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-cyan-200 bg-cyan-50 p-8 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
                Rapportversjoner
              </p>
              <h2 className="mt-3 text-4xl font-black text-slate-950">
                Rapporten kan oppdateres
              </h2>
              <p className="mt-5 max-w-3xl leading-8 text-slate-700">
                En mediesak kan endre seg etter publisering. Brukeren kan ha
                valgt feil i skjemaet, finne nye e-poster, få svar fra
                redaksjonen, motta ny dokumentasjon eller få oppdatert
                rettsstatus. Derfor bør PresseSjekk bygges slik at saken kan
                redigeres og rapporten kan genereres på nytt.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm">
                <span className="mr-2 text-cyan-700">✓</span>
                Endre artikkeldata, tilsvar og svarfrist
              </div>
              <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm">
                <span className="mr-2 text-cyan-700">✓</span>
                Legg til nye e-poster, SMS-er og vedlegg
              </div>
              <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm">
                <span className="mr-2 text-cyan-700">✓</span>
                Oppdater rettsstatus, dom, henleggelse eller frifinnelse
              </div>
              <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm">
                <span className="mr-2 text-cyan-700">✓</span>
                Lag ny rapportversjon og oppdatert PFU-klageutkast
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Se hvordan din sak vurderes
          </p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            Start med én artikkel
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-700">
            Du kan starte med en gratis forhåndssjekk og senere låse opp full
            rapport hvis saken bør følges opp.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/pressesjekk"
              className="rounded-xl bg-cyan-500 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-400"
            >
              Start gratis sjekk
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

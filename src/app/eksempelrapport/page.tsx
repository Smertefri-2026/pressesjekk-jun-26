import Link from "next/link";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";

const reportFindings = [
  {
    title: "Samtidig imøtegåelse",
    level: "Høy relevans",
    text: "Artikkelen inneholder sterke faktiske beskyldninger. Brukeren oppgir at henvendelsen før publisering var kort og ikke tydelig nok på hvilke konkrete påstander som skulle publiseres.",
  },
  {
    title: "Kildebruk og dokumentasjon",
    level: "Middels relevans",
    text: "Flere påstander fremstår som belastende. Rapporten bør undersøke om artikkelen tydelig viser hvilket faktisk grunnlag redaksjonen bygger på.",
  },
  {
    title: "Identifisering",
    level: "Middels/høy relevans",
    text: "Dersom den omtalte personen er navngitt, avbildet eller indirekte identifiserbar, bør det vurderes om identifiseringen er nødvendig og forholdsmessig.",
  },
  {
    title: "Rettsstatus og oppdateringsbehov",
    level: "Middels relevans",
    text: "Hvis saken senere er henlagt, endret, frifunnet eller rettskraftig avgjort, kan det være relevant å vurdere om artikkelen bør oppdateres.",
  },
];

const evidenceItems = [
  "Vedlegg 1: Kopi av publisert artikkel",
  "Vedlegg 2: E-post fra journalist før publisering",
  "Vedlegg 3: Brukerens svar til journalist",
  "Vedlegg 4: Skjermbilde av publiseringstidspunkt",
  "Vedlegg 5: Eventuell dokumentasjon på rettsstatus",
];

export default function EksempelrapportPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <PublicHeader />

        <div className="py-14">
          <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
            ← Tilbake til forsiden
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <section>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                Eksempelrapport
              </p>

              <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                Slik kan en full PresseSjekk-rapport se ut
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                Dette er en anonymisert eksempelrapport. Den viser hvordan
                PresseSjekk kan samle artikkel, tilsvar, rettsstatus,
                dokumentasjon og mulige presseetiske problemstillinger i én
                strukturert vurdering.
              </p>

              <section className="mt-8 rounded-3xl border border-cyan-300/30 bg-cyan-300/10 p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
                  Sammendrag
                </p>
                <h2 className="mt-3 text-2xl font-bold">
                  Foreløpig vurdering
                </h2>
                <p className="mt-4 leading-8 text-slate-300">
                  Artikkelen omtaler en person i en belastende sammenheng.
                  Basert på opplysningene i denne eksempelrapporten kan saken
                  reise spørsmål om samtidig imøtegåelse, kildebruk,
                  identifisering og om artikkelen gir et balansert bilde av
                  hendelsesforløpet.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-950 p-5">
                    <p className="text-sm text-slate-400">Risikonivå</p>
                    <p className="mt-2 text-3xl font-bold text-amber-300">
                      Middels/høy
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-950 p-5">
                    <p className="text-sm text-slate-400">Mulige funn</p>
                    <p className="mt-2 text-3xl font-bold text-cyan-300">4</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950 p-5">
                    <p className="text-sm text-slate-400">Neste steg</p>
                    <p className="mt-2 font-bold">PFU-vurdering</p>
                  </div>
                </div>
              </section>

              <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-2xl font-bold">Artikkeldata</h2>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">Medium</p>
                    <p className="mt-2 font-semibold">Eksempelavisen</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">Publisert</p>
                    <p className="mt-2 font-semibold">18.06.2026</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">Artikkeltype</p>
                    <p className="mt-2 font-semibold">Nyhetsartikkel</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">Sjekket før</p>
                    <p className="mt-2 font-semibold text-cyan-300">
                      47 ganger
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-2xl font-bold">
                  Mulige presseetiske problemstillinger
                </h2>

                <div className="mt-6 space-y-4">
                  {reportFindings.map((finding) => (
                    <article
                      key={finding.title}
                      className="rounded-2xl border border-white/10 bg-slate-900 p-5"
                    >
                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                        <h3 className="text-lg font-bold">{finding.title}</h3>
                        <span className="rounded-full bg-amber-300/15 px-3 py-1 text-sm font-semibold text-amber-200">
                          {finding.level}
                        </span>
                      </div>
                      <p className="mt-3 leading-7 text-slate-300">
                        {finding.text}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-2xl font-bold">
                  Tilsvar og kontakt før publisering
                </h2>
                <p className="mt-4 leading-8 text-slate-300">
                  Brukeren oppgir at journalist tok kontakt samme dag som
                  artikkelen ble publisert. Henvendelsen skal ha inneholdt noen
                  spørsmål, men ikke alle konkrete beskyldninger som senere kom
                  frem i artikkelen. Brukeren oppgir også at svaret bare delvis
                  ble tatt med.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">Kontakt</p>
                    <p className="mt-2 font-semibold">Ja, e-post</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">Svarfrist</p>
                    <p className="mt-2 font-semibold">1–3 timer</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">Svar tatt med</p>
                    <p className="mt-2 font-semibold">Delvis</p>
                  </div>
                </div>
              </section>

              <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-2xl font-bold">
                  Dokumentasjon og vedlegg
                </h2>
                <p className="mt-4 leading-8 text-slate-300">
                  En sterk klage bør bygge på dokumentasjon. PresseSjekk bør
                  derfor samle vedleggene i en strukturert liste som kan brukes
                  videre i PFU-klage, redaktørklage eller annen dokumentasjon.
                </p>

                <ul className="mt-6 space-y-3 text-slate-300">
                  {evidenceItems.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="text-cyan-300">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-2xl font-bold">PFU-klageutkast</h2>
                <p className="mt-4 leading-8 text-slate-300">
                  Rapporten kan danne grunnlag for et strukturert klageutkast.
                  Brukeren må alltid kontrollere teksten, legge til egne
                  opplysninger og selv godkjenne innholdet før eventuell
                  innsending.
                </p>

                <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
                  <p className="font-semibold text-white">
                    Eksempel på klagepunkt:
                  </p>
                  <p className="mt-3 leading-8 text-slate-300">
                    Klager mener at artikkelen kan reise spørsmål om manglende
                    reell samtidig imøtegåelse. Klager oppgir at redaksjonen
                    ikke forela alle konkrete beskyldninger før publisering, og
                    at klagers svar bare delvis ble gjengitt i artikkelen.
                  </p>
                </div>
              </section>
            </section>

            <aside className="h-fit rounded-3xl border border-cyan-300/30 bg-cyan-300/10 p-6 lg:sticky lg:top-8">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
                Hva får kunden?
              </p>

              <h2 className="mt-4 text-2xl font-bold">Full rapport</h2>

              <ul className="mt-5 space-y-3 text-sm text-slate-300">
                <li>✓ Strukturert artikkelanalyse</li>
                <li>✓ Tilsvarsvurdering</li>
                <li>✓ Rettsstatus og dokumentasjon</li>
                <li>✓ Mulige problemområder</li>
                <li>✓ Vedleggsliste</li>
                <li>✓ PFU-klageutkast</li>
              </ul>

              <div className="mt-6 space-y-3">
                <Link
                  href="/pressesjekk"
                  className="block rounded-xl bg-cyan-300 px-5 py-3 text-center font-semibold text-slate-950 hover:bg-cyan-200"
                >
                  Start egen sjekk
                </Link>
                <Link
                  href="/priser"
                  className="block rounded-xl border border-white/10 px-5 py-3 text-center font-semibold text-white hover:bg-white/10"
                >
                  Se priser
                </Link>
              </div>

              <p className="mt-5 text-xs leading-6 text-slate-400">
                Eksempelet er anonymisert og forenklet. Faktiske rapporter vil
                avhenge av artikkeltekst, dokumentasjon og brukerens egne
                opplysninger.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

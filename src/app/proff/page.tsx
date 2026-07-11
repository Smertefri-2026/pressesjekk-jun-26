import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

const audiences = [
  {
    title: "Redaksjoner og journalister",
    text: "Bruk PresseSjekk som et ekstra kontrollpunkt før publisering i krevende saker med sterke påstander, tilsvar, identifisering eller rettsstatus.",
  },
  {
    title: "Advokater",
    text: "Samle medieomtale, dokumentasjon, tidslinje, PFU-klage og PFU-avgjørelse og utredningsgrunnlag på ett sted før videre vurdering.",
  },
  {
    title: "PR-rådgivere og kommunikasjonsmiljøer",
    text: "Få bedre oversikt i saker der virksomheter, organisasjoner eller personer mener omtalen er feil, skjev eller belastende.",
  },
  {
    title: "Organisasjoner og virksomheter",
    text: "Dokumenter omtale, kontakt med redaksjonen, tilsvar, rapporter og videre oppfølging i en ryddig saksflyt.",
  },
];

const workflow = [
  "Opprett sak eller klient",
  "Legg inn artikkel, lenke og hovedopplysninger",
  "Samle dokumentasjon, tilsvar og redaktørsvar",
  "Generer rapport eller redaksjonell sjekk",
  "Lag PFU-klage ved behov",
  "Bygg politianmeldelse eller utredningspakke for større saker",
];


export default function ProffPage() {
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
              Proff
            </p>

            <h1 className="mt-4 max-w-4xl [text-wrap:balance] text-4xl font-black sm:text-5xl tracking-tight text-slate-950 md:text-7xl">
              For alle som jobber profesjonelt med mediesaker.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              PresseSjekk Pro er laget for advokater, rådgivere,
              organisasjoner, virksomheter og redaksjoner som trenger en
              ryddig måte å kontrollere, dokumentere og følge opp mediesaker på.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/priser"
                className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800"
              >
                Se priser
              </Link>
              <Link
                href="/kontakt"
                className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
              >
                Kontakt oss
              </Link>
            </div>
          </section>

          <aside className="rounded-3xl border border-red-200 bg-red-50 p-7 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-800">
              Profftilgang
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Én plattform for flere saker
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Proffbrukere kan jobbe med flere saker, rapporter,
              dokumentpakker og vurderinger over tid. Målet er bedre kontroll,
              bedre dokumentasjon og mer effektiv saksflyt.
            </p>

            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Typisk bruk
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                Flere saker hver måned
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Egnet for rådgivere, redaksjoner og organisasjoner med løpende
                behov for dokumentasjon og vurderinger.
              </p>
            </div>
          </aside>
        </div>

        <section className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {audiences.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-lg font-black text-red-800">
                ✓
              </div>
              <h2 className="text-xl font-black text-slate-950">
                {item.title}
              </h2>
              <p className="mt-4 leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
              Saksflyt
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Fra første vurdering til komplett dokumentpakke
            </h2>
            <p className="mt-4 max-w-3xl leading-8 text-slate-700">
              Proffløsningen bygger på samme saksgang som kundesidene, men er
              bedre egnet for flere saker, flere klienter og månedlig bruk.
            </p>

            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {workflow.map((item, index) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800"
                >
                  <span className="mr-2 font-black text-red-700">
                    {index + 1}.
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
              Viktig forbehold
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Et arbeidsverktøy, ikke en fasit
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              PresseSjekk erstatter ikke redaktøransvar, advokat, PFU eller
              domstoler. Tjenesten gir strukturert dokumentasjon og veiledende
              analyser som må kvalitetssikres av fagpersoner.
            </p>
          </aside>
        </section>

        <section className="mt-16 rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
                Prisnivå
              </p>

              <h2 className="mt-3 text-4xl font-black text-slate-950">
                Velg pris etter hvor mange saker dere jobber med.
              </h2>

              <p className="mt-4 max-w-3xl leading-8 text-slate-700">
                Proffbrukere kan starte med sakspakker eller velge abonnement
                for løpende arbeid. Full prisliste ligger samlet på prissiden,
                slik at priser og pakker alltid er oppdatert ett sted.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="grid gap-3 text-sm font-bold text-slate-700">
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                  <span>Sakspakker</span>
                  <span className="text-slate-950">fra 1 390 kr</span>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                  <span>Abonnement</span>
                  <span className="text-slate-950">fra 1 290 kr/mnd</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Utredningspakke</span>
                  <span className="text-slate-950">etter avtale</span>
                </div>
              </div>

              <Link
                href="/priser"
                className="mt-6 block rounded-xl bg-slate-950 px-5 py-4 text-center font-black text-white hover:bg-slate-800"
              >
                Se alle priser
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-300">
                Klar for proffbruk?
              </p>
              <h2 className="mt-3 text-4xl font-black">
                Velg månedlig tilgang når du jobber med flere saker.
              </h2>
              <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                Enkeltkjøp passer for én konkret sak. Proffbruk passer når
                dere jobber med flere klienter, flere artikler eller løpende
                vurderinger av medieomtale.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="font-black text-white">Neste steg</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Start med prissiden, eller kontakt oss dersom dere ønsker
                løsning for redaksjon, byrå, advokatmiljø eller organisasjon.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/priser"
                  className="rounded-xl bg-orange-400 px-5 py-3 font-black text-slate-950 hover:bg-orange-500"
                >
                  Se priser
                </Link>
                <Link
                  href="/kontakt"
                  className="rounded-xl border border-white/20 px-5 py-3 font-black text-white hover:bg-white/10"
                >
                  Kontakt oss
                </Link>
              </div>
            </div>
          </div>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}

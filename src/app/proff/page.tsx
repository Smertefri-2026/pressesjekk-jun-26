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
    text: "Samle medieomtale, dokumentasjon, tidslinje, PFU-spor og utredningsgrunnlag på ett sted før videre vurdering.",
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
  "Lag PFU-klageutkast ved behov",
  "Bygg politianmeldelse eller utredningspakke for større saker",
];

const plans = [
  {
    name: "Proff Start",
    price: "1 990 kr/mnd",
    text: "For enkeltpersoner, mindre virksomheter og rådgivere som vurderer flere saker.",
    items: ["3 saker per måned", "Rapportpakker inkludert", "Oppgradering ved behov"],
  },
  {
    name: "Proff",
    price: "4 990 kr/mnd",
    text: "For advokater, PR-rådgivere, organisasjoner og redaksjoner med løpende behov.",
    items: ["15 saker per måned", "Rapportpakker inkludert", "Rabatt på oppgraderinger"],
  },
  {
    name: "Byrå / redaksjon",
    price: "14 990 kr/mnd",
    text: "For større miljøer som trenger løpende kontroll, dokumentasjon og oversikt.",
    items: ["50 saker inkludert", "Flere brukere", "Egnet for fakturering"],
  },
];

export default function ProffPage() {
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
              Proff
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              For alle som jobber profesjonelt med mediesaker.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              PresseSjekk Pro er laget for redaksjoner, journalister, advokater,
              PR-rådgivere, organisasjoner og virksomheter som trenger en
              ryddig måte å kontrollere, dokumentere og følge opp medieomtale.
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

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-7 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Profftilgang
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Én plattform for flere saker
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Proffbrukere kan jobbe med flere saker, rapporter og
              dokumentpakker over tid. Målet er bedre kontroll, bedre
              dokumentasjon og mer effektiv saksflyt.
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

        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
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
                  <span className="mr-2 font-black text-cyan-700">
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

        <section className="mt-16 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
            >
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">
                Proff
              </p>
              <h2 className="mt-4 text-2xl font-black text-slate-950">
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
                className="mt-8 block rounded-xl bg-cyan-500 px-5 py-4 text-center font-black text-slate-950 hover:bg-cyan-400"
              >
                Kontakt oss
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-16 rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Klar for proffbruk?
              </p>
              <h2 className="mt-3 text-4xl font-black">
                Velg månedlig tilgang når du jobber med flere saker.
              </h2>
              <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                Enkeltkjøp passer for én konkret sak. Profftilgang passer når
                du jobber med flere klienter, flere artikler eller løpende
                redaksjonelle vurderinger.
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
                  className="rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 hover:bg-cyan-300"
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

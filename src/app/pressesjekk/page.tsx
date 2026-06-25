import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { QuickCheckBox } from "@/components/public/QuickCheckBox";

const startOptions = [
  {
    title: "Privatperson",
    text: "For deg som er omtalt i en artikkel og ønsker oversikt over saken, tilsvar, dokumentasjon og mulige neste steg.",
  },
  {
    title: "Bedrift eller organisasjon",
    text: "For virksomheter som mener omtalen er feil, ubalansert eller mangler viktige opplysninger.",
  },
  {
    title: "Proffbruker",
    text: "For advokater, PR-rådgivere, redaksjoner og organisasjoner som jobber med flere mediesaker.",
  },
];

const whatYouCanDo = [
  "Registrere artikkel, lenke eller artikkeltekst",
  "Legge inn saksopplysninger og tilsvar",
  "Laste opp dokumentasjon og vedlegg",
  "Generere rapport",
  "Lage PFU-klage",
  "Lage politianmeldelse i alvorlige saker",
  "Bygge komplett utredningspakke",
];

const packages = [
  {
    title: "Rapportpakke",
    text: "For deg som vil få en strukturert rapport med mulige problemområder.",
    href: "/priser",
  },
  {
    title: "PFU-pakke",
    text: "For deg som vil gå videre fra rapport til utkast til PFU-klage.",
    href: "/priser",
  },
  {
    title: "Full dokumentpakke",
    text: "For saker der du også trenger PFU-avgjørelse og politianmeldelse som del av saksgangen.",
    href: "/priser",
  },
  {
    title: "Utredningspakke",
    text: "For større saker der dokumentasjon, tidslinje, vurderinger og vedlegg bør samles i én utredning.",
    href: "/kontakt",
  },
];

export default function PresseSjekkPage() {
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
              Start sjekk
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Start en sak og bygg dokumentasjonen steg for steg.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              PresseSjekk starter ikke med en løs analyse, men med en sak. Du
              legger inn artikkel, tilsvar, rettsstatus og dokumentasjon. Derfra
              kan du bygge rapport, PFU-klage, politianmeldelse og utredning
              etter behov.
            </p>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Kom i gang
            </p>

            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Velg rask sjekk eller lagret sak
            </h2>

            <p className="mt-4 leading-8 text-slate-700">
              Lesere kan bruke rask sjekk uten innlogging. Er du omtalt,
              pårørende eller representerer en virksomhet, bør du opprette en
              lagret sak på Min Side.
            </p>

            <div className="mt-6 grid gap-3">
              <Link
                href="/min-side/saker/ny"
                className="rounded-xl bg-slate-950 px-6 py-4 text-center font-black text-white hover:bg-slate-800"
              >
                Start ny sak
              </Link>

              <Link
                href="/priser"
                className="rounded-xl border border-slate-300 bg-white px-6 py-4 text-center font-black text-slate-950 hover:bg-slate-100"
              >
                Se pakker og priser
              </Link>
            </div>
          </aside>
        </div>

        <section className="mt-12 rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[360px_1fr] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
                Rask sjekk eller egen sak
              </p>

              <h2 className="mt-4 text-4xl font-black text-slate-950">
                Start med URL og rolle
              </h2>

              <p className="mt-4 leading-8 text-slate-700">
                Velg om du bare vil gjøre en rask lesersjekk, eller om du er
                omtalt i saken og bør opprette en lagret sak. Hurtigsjekken kan
                brukes uten innlogging, mens full saksgang krever Min Side.
              </p>

              <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm font-black text-slate-950">
                  To måter å starte på
                </p>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                  <li>• Leser: rask offentlig sjekk uten innlogging.</li>
                  <li>• Omtalt/pårørende/bedrift: opprett lagret sak.</li>
                  <li>• Proffbruker: gå videre til proffløsningen.</li>
                </ul>
              </div>
            </div>

            <div>
              <QuickCheckBox />
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          {startOptions.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-lg font-black text-cyan-800">
                ✓
              </div>
              <h2 className="text-2xl font-black text-slate-950">
                {item.title}
              </h2>
              <p className="mt-4 leading-8 text-slate-700">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_390px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Hva kan du gjøre?
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Hele saken samlet på ett sted
            </h2>
            <p className="mt-4 max-w-3xl leading-8 text-slate-700">
              PresseSjekk er laget for å samle informasjonen som ofte ligger
              spredt i e-poster, skjermbilder, artikler, tilsvar og dokumenter.
            </p>

            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {whatYouCanDo.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800"
                >
                  <span className="mr-2 text-cyan-700">✓</span>
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
              Veiledende dokumenthjelp
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              PresseSjekk gir strukturert hjelp til dokumentasjon og vurdering.
              Tjenesten erstatter ikke advokat, PFU, politiet, redaktøransvar
              eller domstolene.
            </p>
          </aside>
        </section>

        <section className="mt-16">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Pakker
          </p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            Velg riktig nivå for saken
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {packages.map((item) => (
              <article
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-black text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-4 leading-7 text-slate-600">{item.text}</p>
                <Link
                  href={item.href}
                  className="mt-6 inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100"
                >
                  Les mer
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr_390px] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Klar til å starte?
              </p>
              <h2 className="mt-3 text-4xl font-black">
                Opprett første sak på Min Side
              </h2>
              <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                Start med én sak. Du kan fylle ut mer dokumentasjon etter hvert
                og oppgradere til riktig pakke når du ser hvor omfattende saken
                er.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="font-black text-white">Neste steg</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Logg inn, opprett sak og legg inn artikkel eller dokumentasjon.
              </p>

              <Link
                href="/min-side/saker/ny"
                className="mt-5 block rounded-xl bg-cyan-400 px-5 py-4 text-center font-black text-slate-950 hover:bg-cyan-300"
              >
                Start ny sak
              </Link>
            </div>
          </div>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}

import Link from "next/link";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";

const stats = [
  { label: "Brukere", value: "128", note: "+24 siste 7 dager" },
  { label: "Saker", value: "312", note: "47 aktive saker" },
  { label: "Analyser", value: "1 284", note: "183 siste døgn" },
  { label: "Betalinger", value: "42 180 kr", note: "Dummy tall" },
  { label: "OpenAI-kostnad", value: "1 940 kr", note: "Må overvåkes" },
  { label: "Feilede jobber", value: "7", note: "Krever sjekk" },
];

const popularArticles = [
  {
    title: "VG-artikkel om større mediesak",
    media: "VG",
    checks: 47,
    risk: "Høy",
  },
  {
    title: "Lokalavis-artikkel med manglende tilsvar",
    media: "Lokalavis",
    checks: 31,
    risk: "Middels",
  },
  {
    title: "Artikkel om rettssak og identifisering",
    media: "Nettavis",
    checks: 22,
    risk: "Middels/høy",
  },
];

const latestCases = [
  {
    user: "Privatperson",
    case: "Ny artikkel lagt inn",
    status: "Venter på analyse",
    time: "07:12",
  },
  {
    user: "Advokatkonto",
    case: "PFU-klage generert",
    status: "Ferdig",
    time: "06:48",
  },
  {
    user: "Bedrift",
    case: "Full rapport kjøpt",
    status: "Betalt",
    time: "06:21",
  },
  {
    user: "Journalist",
    case: "Før publisering-sjekk",
    status: "Gratis preview",
    time: "05:55",
  },
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <PublicHeader />

        <div className="py-14">
          <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
            ← Tilbake til forsiden
          </Link>

          <div className="mt-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                Admin
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
                Drift og oversikt
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                Adminpanelet skal senere brukes til å følge med på brukere,
                saker, betalinger, AI-kostnader, køjobber, feilede analyser og
                mest søkte artikler.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-5 py-4 text-sm text-amber-100">
              Dummydata – ikke koblet til database enda
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
              >
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-3 text-4xl font-bold">{item.value}</p>
                <p className="mt-3 text-sm text-cyan-300">{item.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_420px]">
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
                    Mest søkte
                  </p>
                  <h2 className="mt-3 text-2xl font-bold">
                    Artikler som sjekkes ofte
                  </h2>
                </div>
                <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-200">
                  Cache viktig
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {popularArticles.map((article) => (
                  <div
                    key={article.title}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <p className="text-sm text-cyan-300">
                          {article.media}
                        </p>
                        <h3 className="mt-2 font-bold">{article.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">
                          Sjekket {article.checks} ganger
                        </p>
                      </div>

                      <span className="rounded-full bg-amber-300/15 px-3 py-1 text-sm font-semibold text-amber-200">
                        Risiko: {article.risk}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="rounded-3xl border border-cyan-300/30 bg-cyan-300/10 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
                Kostnadskontroll
              </p>
              <h2 className="mt-4 text-2xl font-bold">
                Dette må bygges før markedsføring
              </h2>

              <ul className="mt-5 space-y-3 text-sm text-slate-300">
                <li>✓ Køsystem for analyser</li>
                <li>✓ Cache for samme URL</li>
                <li>✓ Begrense gratisbruk</li>
                <li>✓ Logge OpenAI-kostnad per rapport</li>
                <li>✓ Varsle ved feilede analyser</li>
                <li>✓ Vise inntekt mot AI-kostnad</li>
              </ul>

              <div className="mt-6 rounded-2xl bg-slate-950 p-5">
                <p className="text-sm text-slate-400">Estimert margin</p>
                <p className="mt-2 text-4xl font-bold text-cyan-300">God</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Men bare hvis samme artikkel kan gjenbrukes og tunge AI-kall
                  ligger bak betaling.
                </p>
              </div>
            </aside>
          </div>

          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
              Siste aktivitet
            </p>
            <h2 className="mt-3 text-2xl font-bold">Siste saker og hendelser</h2>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <div className="hidden grid-cols-4 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-300 md:grid">
                <span>Bruker</span>
                <span>Sak</span>
                <span>Status</span>
                <span>Tid</span>
              </div>

              {latestCases.map((item) => (
                <div
                  key={`${item.user}-${item.time}`}
                  className="grid gap-2 border-t border-white/10 px-5 py-4 text-sm md:grid-cols-4"
                >
                  <span className="font-semibold">{item.user}</span>
                  <span className="text-slate-300">{item.case}</span>
                  <span className="text-cyan-300">{item.status}</span>
                  <span className="text-slate-400">{item.time}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

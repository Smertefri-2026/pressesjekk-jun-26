import Link from "next/link";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";

export default function AdminPage() {
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
              Admin
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
              Adminpanel kommer senere
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              Dette området er reservert for drift, kundesaker, betalinger,
              rapportpakker, dokumentpakker, AI-kostnader og intern
              saksoppfølging. Det er ikke koblet til produksjonsdata ennå.
            </p>

            <div className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
              <h2 className="text-2xl font-bold text-white">
                Planlagte adminfunksjoner
              </h2>

              <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                <li>✓ Oversikt over brukere og saker</li>
                <li>✓ Status på rapportpakker og dokumentpakker</li>
                <li>✓ Oversikt over raske sjekker og AI-kostnader</li>
                <li>✓ Varsling ved feilede analyser</li>
                <li>✓ Intern oppfølging av utredningspakker</li>
                <li>✓ Inntekt, kostnad og margin per sak</li>
              </ul>
            </div>

            <div className="mt-8 rounded-3xl border border-amber-300/30 bg-amber-300/10 p-6 text-amber-100">
              <h2 className="text-xl font-bold">Ikke aktivt i beta</h2>
              <p className="mt-3 leading-7">
                I første betaversjon håndteres drift manuelt. Adminpanelet kan
                bygges ut når Stripe, kundepakker og flere brukere er koblet på.
              </p>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

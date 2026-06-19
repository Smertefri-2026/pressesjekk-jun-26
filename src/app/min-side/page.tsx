import Link from "next/link";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { CaseCard } from "@/components/dashboard/CaseCard";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { NextStepCard } from "@/components/dashboard/NextStepCard";
import { demoCaseSummaries } from "@/data/demoCases";

export default function MinSidePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <PublicHeader />

        <div className="py-14">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                Min Side
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
                Dine PresseSjekk-saker
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                Her samles artikler, analyser, tilsvar, dokumentasjon,
                rapporter og PFU-klageutkast. Foreløpig viser siden dummydata.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/pressesjekk"
                className="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-200"
              >
                Ny sjekk
              </Link>
              <Link
                href="/priser"
                className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-white hover:bg-white/10"
              >
                Kjøp credits
              </Link>
            </div>
          </div>

          <DashboardStats activeCases={demoCaseSummaries.length} />

          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px]">
            <section>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Mine saker</h2>
                <Link
                  href="/pressesjekk"
                  className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                >
                  + Opprett ny sak
                </Link>
              </div>

              <div className="space-y-4">
                {demoCaseSummaries.map((item) => (
                  <CaseCard key={item.id} item={item} />
                ))}
              </div>
            </section>

            <NextStepCard />
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

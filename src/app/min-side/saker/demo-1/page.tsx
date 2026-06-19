import Link from "next/link";
import { CaseActionPanel } from "@/components/dashboard/CaseActionPanel";
import { CaseArticleCard } from "@/components/dashboard/CaseArticleCard";
import { CaseDocumentationSummary } from "@/components/dashboard/CaseDocumentationSummary";
import { CaseFindings } from "@/components/dashboard/CaseFindings";
import { CasePfuDraft } from "@/components/dashboard/CasePfuDraft";
import { CaseStatusGrid } from "@/components/dashboard/CaseStatusGrid";
import { CaseTimeline } from "@/components/dashboard/CaseTimeline";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { demoCase } from "@/data/demoCases";

export default function DemoCasePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <PublicHeader />

        <div className="py-14">
          <Link
            href="/min-side"
            className="text-sm text-cyan-300 hover:text-cyan-200"
          >
            ← Tilbake til Min Side
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <section>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                Demosak
              </p>

              <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                {demoCase.title}
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                Dette er en dummyvisning av hvordan én sak kan se ut på Min
                Side. Senere skal denne siden hente ekte artikkel, analyse,
                dokumentasjon, betalinger og rapporter fra databasen.
              </p>

              <CaseStatusGrid item={demoCase} />
              <CaseArticleCard item={demoCase} />
              <CaseTimeline timeline={demoCase.timeline} />
              <CaseDocumentationSummary />
              <CaseFindings findings={demoCase.findings} />
              <CasePfuDraft />
            </section>

            <CaseActionPanel checkedCount={demoCase.checkedCount} />
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";
import { Badge, Button, Card, EmptyState, ErrorBanner, LoadingState } from "@/components/design-system";

type CaseRow = {
  id: string;
  title: string | null;
  media_name: string | null;
  article_title: string | null;
};

type DocumentRow = {
  case_id: string;
  extraction_status: string | null;
};

type ClaimRow = {
  case_id: string;
  no_evidence_confirmed_at: string | null;
  claim_evidence_links: { id: string }[] | null;
};

type CaseDocumentationSummary = {
  caseId: string;
  title: string;
  subtitle: string;
  documentCount: number;
  processingCount: number;
  failedCount: number;
  undocumentedClaimCount: number;
};

function caseTitle(row: CaseRow) {
  return row.title ?? row.article_title ?? "Sak uten tittel";
}

function caseSubtitle(row: CaseRow) {
  const parts = [row.media_name, row.article_title].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "PresseSjekk-sak";
}

export default function DokumentasjonOversiktPage() {
  const [user, setUser] = useState<User | null>(null);
  const [summaries, setSummaries] = useState<CaseDocumentationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadOverview() {
      setIsLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);

      const { data: caseRows, error: caseError } = await supabase
        .from("cases")
        .select("id,title,media_name,article_title")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (caseError) {
        setErrorMessage(caseError.message);
        setIsLoading(false);
        return;
      }

      const cases = (caseRows ?? []) as CaseRow[];
      const caseIds = cases.map((c) => c.id);

      if (caseIds.length === 0) {
        setSummaries([]);
        setIsLoading(false);
        return;
      }

      const [documentsResult, claimsResult] = await Promise.all([
        supabase.from("case_documents").select("case_id,extraction_status").in("case_id", caseIds).is("deleted_at", null),
        supabase
          .from("claims")
          .select("case_id,no_evidence_confirmed_at,claim_evidence_links(id)")
          .in("case_id", caseIds)
          .is("deleted_at", null),
      ]);

      if (documentsResult.error) {
        setErrorMessage(documentsResult.error.message);
        setIsLoading(false);
        return;
      }

      if (claimsResult.error) {
        setErrorMessage(claimsResult.error.message);
        setIsLoading(false);
        return;
      }

      const documents = (documentsResult.data ?? []) as unknown as DocumentRow[];
      const claims = (claimsResult.data ?? []) as unknown as ClaimRow[];

      const result = cases.map((caseItem) => {
        const caseDocuments = documents.filter((d) => d.case_id === caseItem.id);
        const caseClaims = claims.filter((c) => c.case_id === caseItem.id);

        return {
          caseId: caseItem.id,
          title: caseTitle(caseItem),
          subtitle: caseSubtitle(caseItem),
          documentCount: caseDocuments.length,
          processingCount: caseDocuments.filter((d) => d.extraction_status === "pending" || d.extraction_status === "processing").length,
          failedCount: caseDocuments.filter((d) => d.extraction_status === "failed").length,
          undocumentedClaimCount: caseClaims.filter(
            (c) => !c.no_evidence_confirmed_at && (c.claim_evidence_links ?? []).length === 0
          ).length,
        };
      });

      setSummaries(result);
      setIsLoading(false);
    }

    loadOverview();
  }, []);

  const totalDocuments = summaries.reduce((sum, s) => sum + s.documentCount, 0);
  const casesWithGaps = summaries.filter((s) => s.undocumentedClaimCount > 0).length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link href="/min-side" className="text-sm font-bold text-red-700">
          ← Tilbake til Min Side
        </Link>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">Dokumentasjon</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              Dokumentasjon på tvers av saker
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
              Se dokumentstatus for alle sakene dine samlet, og åpne dokumentasjonen for en enkelt sak når du vil gå i detalj.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {user ? <SignOutButton /> : null}
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-8">
            <ErrorBanner message={errorMessage} />
          </div>
        ) : null}

        {!isLoading && summaries.length > 0 ? (
          <section className="mt-10 grid gap-6 md:grid-cols-3">
            <Card>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Saker</p>
              <p className="mt-4 text-4xl font-black text-slate-950 sm:text-5xl">{summaries.length}</p>
              <p className="mt-3 leading-7 text-slate-600">Saker med dokumentasjon tilgjengelig.</p>
            </Card>
            <Card>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Dokumenter</p>
              <p className="mt-4 text-4xl font-black text-slate-950 sm:text-5xl">{totalDocuments}</p>
              <p className="mt-3 leading-7 text-slate-600">Dokumenter lastet opp totalt.</p>
            </Card>
            <Card tone={casesWithGaps > 0 ? "warning" : "neutral"}>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Påstander uten dokumentasjon</p>
              <p className="mt-4 text-4xl font-black text-slate-950 sm:text-5xl">{casesWithGaps}</p>
              <p className="mt-3 leading-7 text-slate-600">
                {casesWithGaps === 1 ? "sak har" : "saker har"} minst én påstand uten dokumentasjon.
              </p>
            </Card>
          </section>
        ) : null}

        <section className="mt-10">
          {isLoading ? (
            <LoadingState message="Laster dokumentasjonsoversikt..." />
          ) : summaries.length === 0 ? (
            <EmptyState
              title="Ingen saker ennå"
              description="Når du oppretter en sak og laster opp dokumentasjon, vises status her."
              action={<Button href="/min-side/saker/ny">Opprett sak</Button>}
            />
          ) : (
            <div className="grid gap-4">
              {summaries.map((summary) => (
                <Card key={summary.caseId} padding="md">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-xl font-black text-slate-950">{summary.title}</h2>
                      <p className="mt-1 text-sm text-slate-600">{summary.subtitle}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge tone="neutral">
                          {summary.documentCount} {summary.documentCount === 1 ? "dokument" : "dokumenter"}
                        </Badge>
                        {summary.processingCount > 0 ? (
                          <Badge tone="info">
                            {summary.processingCount} under behandling
                          </Badge>
                        ) : null}
                        {summary.failedCount > 0 ? (
                          <Badge tone="danger">
                            {summary.failedCount} kunne ikke analyseres
                          </Badge>
                        ) : null}
                        {summary.undocumentedClaimCount > 0 ? (
                          <Badge tone="warning">
                            {summary.undocumentedClaimCount} {summary.undocumentedClaimCount === 1 ? "påstand" : "påstander"} uten dokumentasjon
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <Button href={`/min-side/saker/${summary.caseId}/dokumentasjon`} variant="secondary">
                      Åpne dokumentasjon
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}

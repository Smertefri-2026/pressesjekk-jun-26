"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { CaseWorkflowCard } from "@/components/cases/CaseWorkflowCard";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";
import type { PackagePlanId } from "@/data/packagePlans";

type CaseStatus = "draft" | "in_progress" | "report_ready" | "closed";

type CaseAccessRow = {
  package_id: PackagePlanId;
  status: "active" | "pending" | "cancelled" | "expired";
};

type CaseRow = {
  id: string;
  title: string;
  status: CaseStatus;
  media_name: string | null;
  article_title: string | null;
  article_url: string | null;
  published_date: string | null;
  short_description: string | null;
};

type CaseInputRow = {
  id: string;
};

type CaseReportRow = {
  id: string;
  report_type: "free_check" | "full_report" | "pfu_draft";
};

type PfuDecisionRow = {
  id: string;
  decision_received: boolean | null;
  uploaded_file_name: string | null;
};

function statusLabel(status: CaseStatus) {
  if (status === "draft") return "Utkast";
  if (status === "in_progress") return "Under arbeid";
  if (status === "report_ready") return "Rapport klar";
  if (status === "closed") return "Lukket";
  return status;
}

export default function EditCasePage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [caseAccessPackageId, setCaseAccessPackageId] =
    useState<PackagePlanId | null>(null);
  const [workflowType, setWorkflowType] = useState<"standard" | "journalist">("standard");
  const [caseInput, setCaseInput] = useState<CaseInputRow | null>(null);
  const [reports, setReports] = useState<CaseReportRow[]>([]);
  const [pfuDecision, setPfuDecision] = useState<PfuDecisionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<CaseStatus>("draft");
  const [mediaName, setMediaName] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [shortDescription, setShortDescription] = useState("");

  useEffect(() => {
    async function loadCase() {
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

      const { data: accessData } = await supabase
        .from("case_access")
        .select("package_id,status")
        .eq("case_id", params.id)
        .eq("status", "active")
        .maybeSingle();

      const caseAccess = accessData as CaseAccessRow | null;

      setCaseAccessPackageId(caseAccess?.package_id ?? null);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role_type")
        .eq("id", user.id)
        .maybeSingle();

      setWorkflowType(
        profileData?.role_type === "journalist" ? "journalist" : "standard"
      );

      const { data, error } = await supabase
        .from("cases")
        .select(
          "id,title,status,media_name,article_title,article_url,published_date,short_description"
        )
        .eq("id", params.id)
        .single();

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      const caseData = data as CaseRow;

      setTitle(caseData.title ?? "");
      setStatus(caseData.status ?? "draft");
      setMediaName(caseData.media_name ?? "");
      setArticleTitle(caseData.article_title ?? "");
      setArticleUrl(caseData.article_url ?? "");
      setPublishedDate(caseData.published_date ?? "");
      setShortDescription(caseData.short_description ?? "");

      const { data: inputData } = await supabase
        .from("case_inputs")
        .select("id")
        .eq("case_id", params.id)
        .maybeSingle();

      setCaseInput((inputData as CaseInputRow | null) ?? null);

      const { data: reportsData } = await supabase
        .from("case_reports")
        .select("id,report_type")
        .eq("case_id", params.id);

      setReports((reportsData ?? []) as CaseReportRow[]);

      const { data: pfuDecisionData } = await supabase
        .from("pfu_decisions")
        .select("id,decision_received,uploaded_file_name")
        .eq("case_id", params.id)
        .maybeSingle();

      setPfuDecision((pfuDecisionData as PfuDecisionRow | null) ?? null);

      setIsLoading(false);
    }

    if (params.id) {
      loadCase();
    }
  }, [params.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setErrorMessage("Du må være innlogget for å redigere saken.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    const cleanTitle =
      title.trim() ||
      articleTitle.trim() ||
      `PresseSjekk-sak${mediaName.trim() ? ` – ${mediaName.trim()}` : ""}`;

    const { error } = await supabase
      .from("cases")
      .update({
        title: cleanTitle,
        status,
        media_name: mediaName.trim() || null,
        article_title: articleTitle.trim() || null,
        article_url: articleUrl.trim() || null,
        published_date: publishedDate || null,
        short_description: shortDescription.trim() || null,
      })
      .eq("id", params.id);

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    window.location.href = `/min-side/saker/${params.id}`;
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              Laster saken...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (errorMessage && !title) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Link
            href="/min-side"
            className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
          >
            ← Tilbake til Min Side
          </Link>

          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
              Feil
            </p>
            <h1 className="mt-3 text-3xl font-black text-red-950">
              Kunne ikke åpne saken
            </h1>
            <p className="mt-4 leading-8 text-red-800">{errorMessage}</p>
          </div>
        </section>

        <LightPublicFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href={`/min-side/saker/${params.id}`}
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          ← Tilbake til saken
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Rediger sak
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Rediger sak
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Oppdater grunninformasjon, status, mediehus, artikkellenke og
              kort beskrivelse. Saksopplysninger, rapport, PFU-klage og PFU-avgjørelse og videre
              vurdering håndteres i saksgangen.
            </p>

            {user?.email ? (
              <p className="mt-5 text-sm font-semibold text-slate-500">
                Innlogget som:{" "}
                <span className="text-slate-950">{user.email}</span>
              </p>
            ) : null}
          </section>

          <CaseWorkflowCard
            caseId={params.id}
            statusLabel={statusLabel(status)}
            activeStep="case"
            workflowType={workflowType}
              currentPackageId={caseAccessPackageId ?? undefined}
            stepsDone={{
              caseRegistered: true,
              caseInputs: Boolean(caseInput),
              report: reports.some((report) => report.report_type !== "pfu_draft"),
              pfuDraft: reports.some((report) => report.report_type === "pfu_draft"),
              pfuDecision: Boolean(
                pfuDecision?.decision_received || pfuDecision?.uploaded_file_name
              ),
              policeReport: false,
            }}
          />
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_390px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Saksinformasjon
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Grunnopplysninger
            </h2>

            <div className="mt-8 grid gap-5">
              <div>
                <label
                  htmlFor="title"
                  className="text-sm font-bold text-slate-800"
                >
                  Tittel på saken
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="text-sm font-bold text-slate-800"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as CaseStatus)
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                >
                  <option value="draft">Utkast</option>
                  <option value="in_progress">Under arbeid</option>
                  <option value="report_ready">Rapport klar</option>
                  <option value="closed">Lukket</option>
                </select>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="mediaName"
                    className="text-sm font-bold text-slate-800"
                  >
                    Mediehus
                  </label>
                  <input
                    id="mediaName"
                    type="text"
                    value={mediaName}
                    onChange={(event) => setMediaName(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="publishedDate"
                    className="text-sm font-bold text-slate-800"
                  >
                    Publiseringsdato
                  </label>
                  <input
                    id="publishedDate"
                    type="date"
                    value={publishedDate}
                    onChange={(event) => setPublishedDate(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="articleTitle"
                  className="text-sm font-bold text-slate-800"
                >
                  Artikkeloverskrift
                </label>
                <input
                  id="articleTitle"
                  type="text"
                  value={articleTitle}
                  onChange={(event) => setArticleTitle(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="articleUrl"
                  className="text-sm font-bold text-slate-800"
                >
                  Lenke til artikkel
                </label>
                <input
                  id="articleUrl"
                  type="url"
                  value={articleUrl}
                  onChange={(event) => setArticleUrl(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="shortDescription"
                  className="text-sm font-bold text-slate-800"
                >
                  Kort beskrivelse
                </label>
                <textarea
                  id="shortDescription"
                  rows={6}
                  value={shortDescription}
                  onChange={(event) => setShortDescription(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Lagrer..." : "Lagre endringer"}
                </button>

                <Link
                  href={`/min-side/saker/${params.id}`}
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-4 font-black text-slate-950 hover:bg-slate-100"
                >
                  Avbryt
                </Link>
              </div>
            </div>
          </form>

          <aside className="grid content-start gap-6">
            <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
                Oppdatert grunnlag
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Endringer kan påvirke rapporten
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                Hvis du endrer artikkeldata, status eller beskrivelse, kan det
                være lurt å gå gjennom rapport og PFU-klage på nytt.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Videre arbeid
              </p>
              <h2 className="mt-3 text-3xl font-black">
                Bruk saksgangen
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                Etter at grunninformasjonen er lagret, kan du gå videre til
                saksopplysninger, rapport, PFU-klage eller annen oppfølging i
                saksgangen.
              </p>
            </div>
          </aside>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}

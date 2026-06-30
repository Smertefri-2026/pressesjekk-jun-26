"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { CaseWorkflowCard } from "@/components/cases/CaseWorkflowCard";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { StripeCheckoutButton } from "@/components/stripe/StripeCheckoutButton";
import { supabase } from "@/lib/supabase/client";
import type { PackagePlanId } from "@/data/packagePlans";
import { isV1Purchasable, upgradePaths } from "@/data/packagePlans";

type CaseRow = {
  id: string;
  title: string;
  status: "draft" | "in_progress" | "report_ready" | "closed";
  media_name: string | null;
  article_title: string | null;
  article_url: string | null;
  published_date: string | null;
  short_description: string | null;
  created_at: string;
  updated_at: string;
};

type CaseInputRow = {
  id: string;
  article_text: string | null;
  what_happened: string | null;
  your_role: string | null;
  reply_sent: boolean | null;
  reply_text: string | null;
  editor_response: string | null;
  legal_status: string | null;
  legal_status_details: string | null;
  documentation_summary: string | null;
  desired_outcome: string | null;
};

type CaseReportRow = {
  id: string;
  version: number;
  report_type: "free_check" | "full_report" | "pfu_draft" | "police_draft" | "investigation_draft";
  status: "draft" | "ready" | "archived";
  created_at: string;
};

type CaseAccessRow = {
  package_id: PackagePlanId;
  status: "active" | "pending" | "cancelled" | "expired";
};

type PfuDecisionRow = {
  id: string;
  pfu_complaint_sent: boolean | null;
  pfu_sent_date: string | null;
  pfu_case_number: string | null;
  pfu_case_url: string | null;
  decision_received: boolean | null;
  decision_date: string | null;
  decision_result: string | null;
  uploaded_file_name: string | null;
  next_step_interest: string | null;
};

function statusLabel(status: CaseRow["status"]) {
  if (status === "draft") return "Utkast";
  if (status === "in_progress") return "Under arbeid";
  if (status === "report_ready") return "Rapport klar";
  if (status === "closed") return "Lukket";
  return status;
}

function legalStatusLabel(status: string | null) {
  if (!status) return "Ikke satt";
  if (status === "not_relevant") return "Ikke relevant";
  if (status === "unknown") return "Uavklart";
  if (status === "reported") return "Anmeldt";
  if (status === "dismissed") return "Henlagt";
  if (status === "court_case") return "Rettssak";
  if (status === "judgment") return "Dom/avgjørelse";
  if (status === "appeal") return "Klage/anke";
  return status;
}

function pfuDecisionResultLabel(status: string | null) {
  if (!status) return "Ikke satt";
  if (status === "upheld") return "Felt";
  if (status === "partly_upheld") return "Delvis felt";
  if (status === "not_upheld") return "Ikke felt";
  if (status === "dismissed") return "Avvist";
  if (status === "withdrawn") return "Trukket";
  if (status === "other") return "Annet";
  return status;
}

function formatDate(date: string | null) {
  if (!date) return "Ikke satt";

  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function packageLabel(packageId: PackagePlanId | null) {
  if (packageId === "report_pack") return "Rapportpakke";
  if (packageId === "pfu_pack") return "PFU-pakke";
  if (packageId === "full_pack") return "Full dokumentpakke";
  if (packageId === "investigation_pack") return "Utredningspakke";
  if (packageId === "monthly_start") return "Månedsavtale Start";
  if (packageId === "monthly_pro") return "Månedsavtale Pro";
  if (packageId === "monthly_agency") return "Månedsavtale Byrå";
  if (packageId === "monthly_enterprise") return "Enterprise";
  return "Ingen aktiv pakke";
}

function hasPackageAccess(
  currentPackageId: PackagePlanId | null,
  requiredPackageId: PackagePlanId
) {
  const accessRank: Record<PackagePlanId, number> = {
    report_pack: 1,
    case_bundle_3: 1,
    case_bundle_5: 1,
    case_bundle_10: 1,
    monthly_start: 1,
    monthly_pro: 1,
    monthly_agency: 1,
    monthly_enterprise: 1,
    pfu_pack: 2,
    full_pack: 3,
    investigation_pack: 4,
  };

  return (
    Boolean(currentPackageId) &&
    accessRank[currentPackageId as PackagePlanId] >= accessRank[requiredPackageId]
  );
}

function InfoBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <div className="mt-3 whitespace-pre-line leading-8 text-slate-700">
        {children}
      </div>
    </div>
  );
}

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [workflowType, setWorkflowType] = useState<"standard" | "journalist">("standard");
  const [caseAccessPackageId, setCaseAccessPackageId] =
    useState<PackagePlanId | null>(null);
  const [selectedPackage, setSelectedPackage] =
    useState<PackagePlanId | null>(null);
  const [caseItem, setCaseItem] = useState<CaseRow | null>(null);
  const [caseInput, setCaseInput] = useState<CaseInputRow | null>(null);
  const [reports, setReports] = useState<CaseReportRow[]>([]);
  const [pfuDecision, setPfuDecision] = useState<PfuDecisionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [isSavingBasicInfo, setIsSavingBasicInfo] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [editTitle, setEditTitle] = useState("");
  const [editStatus, setEditStatus] = useState<CaseRow["status"]>("draft");
  const [editMediaName, setEditMediaName] = useState("");
  const [editArticleTitle, setEditArticleTitle] = useState("");
  const [editArticleUrl, setEditArticleUrl] = useState("");
  const [editPublishedDate, setEditPublishedDate] = useState("");
  const [editShortDescription, setEditShortDescription] = useState("");

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

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role_type")
        .eq("id", user.id)
        .maybeSingle();

      setWorkflowType(
        profileData?.role_type === "journalist" ? "journalist" : "standard"
      );

      const { data: accessData } = await supabase
        .from("case_access")
        .select("package_id,status")
        .eq("case_id", params.id)
        .eq("status", "active")
        .maybeSingle();

      const caseAccess = accessData as CaseAccessRow | null;

      setCaseAccessPackageId(caseAccess?.package_id ?? null);

      const { data, error } = await supabase
        .from("cases")
        .select(
          "id,title,status,media_name,article_title,article_url,published_date,short_description,created_at,updated_at"
        )
        .eq("id", params.id)
        .single();

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      const loadedCase = data as CaseRow;

      setCaseItem(loadedCase);
      setEditTitle(loadedCase.title ?? "");
      setEditStatus(loadedCase.status ?? "draft");
      setEditMediaName(loadedCase.media_name ?? "");
      setEditArticleTitle(loadedCase.article_title ?? "");
      setEditArticleUrl(loadedCase.article_url ?? "");
      setEditPublishedDate(loadedCase.published_date ?? "");
      setEditShortDescription(loadedCase.short_description ?? "");

      const { data: inputData, error: inputError } = await supabase
        .from("case_inputs")
        .select(
          "id,article_text,what_happened,your_role,reply_sent,reply_text,editor_response,legal_status,legal_status_details,documentation_summary,desired_outcome"
        )
        .eq("case_id", params.id)
        .maybeSingle();

      if (inputError) {
        setErrorMessage(inputError.message);
      } else {
        setCaseInput((inputData as CaseInputRow | null) ?? null);
      }

      const { data: reportsData, error: reportsError } = await supabase
        .from("case_reports")
        .select("id,version,report_type,status,created_at")
        .eq("case_id", params.id)
        .order("version", { ascending: false });

      if (!reportsError) {
        setReports((reportsData ?? []) as CaseReportRow[]);
      }

      const { data: pfuDecisionData, error: pfuDecisionError } = await supabase
        .from("pfu_decisions")
        .select(
          "id,pfu_complaint_sent,pfu_sent_date,pfu_case_number,pfu_case_url,decision_received,decision_date,decision_result,uploaded_file_name,next_step_interest"
        )
        .eq("case_id", params.id)
        .maybeSingle();

      if (!pfuDecisionError) {
        setPfuDecision((pfuDecisionData as PfuDecisionRow | null) ?? null);
      }

      setIsLoading(false);
    }

    if (params.id) {
      loadCase();
    }
  }, [params.id]);

  useEffect(() => {
    const pkg = new URLSearchParams(window.location.search).get("package");
    if (pkg && isV1Purchasable(pkg)) {
      setSelectedPackage(pkg as PackagePlanId);
    }
  }, []);

  useEffect(() => {
    if (selectedPackage && !isLoading) {
      document
        .getElementById("betaling")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedPackage, isLoading]);

  async function handleBasicInfoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !caseItem) {
      setErrorMessage("Du må være innlogget for å redigere saken.");
      return;
    }

    setIsSavingBasicInfo(true);
    setErrorMessage("");

    const cleanTitle =
      editTitle.trim() ||
      editArticleTitle.trim() ||
      `PresseSjekk-sak${editMediaName.trim() ? ` – ${editMediaName.trim()}` : ""}`;

    const updates = {
      title: cleanTitle,
      status: editStatus,
      media_name: editMediaName.trim() || null,
      article_title: editArticleTitle.trim() || null,
      article_url: editArticleUrl.trim() || null,
      published_date: editPublishedDate || null,
      short_description: editShortDescription.trim() || null,
    };

    const { error } = await supabase
      .from("cases")
      .update(updates)
      .eq("id", params.id);

    if (error) {
      setErrorMessage(error.message);
      setIsSavingBasicInfo(false);
      return;
    }

    setCaseItem({
      ...caseItem,
      ...updates,
    });

    setIsSavingBasicInfo(false);
    setIsEditingBasicInfo(false);
  }

  const reportDrafts = reports.filter(
    (report) =>
      report.report_type === "free_check" || report.report_type === "full_report"
  );

  const pfuDrafts = reports.filter(
    (report) => report.report_type === "pfu_draft"
  );

  const policeDrafts = reports.filter(
    (report) => report.report_type === "police_draft"
  );

  const investigationDrafts = reports.filter(
    (report) => report.report_type === "investigation_draft"
  );

  const recommendedNext: PackagePlanId | null =
    workflowType === "journalist"
      ? !caseAccessPackageId
        ? "report_pack"
        : null
      : !caseAccessPackageId
        ? "report_pack"
        : ((upgradePaths as Record<string, PackagePlanId>)[caseAccessPackageId] ??
          null);

  const selectedAlreadyCovered =
    selectedPackage !== null &&
    hasPackageAccess(caseAccessPackageId, selectedPackage);

  const checkoutOptions: {
    id: PackagePlanId;
    name: string;
    price: string;
    label: string;
    buttonClass: string;
  }[] = [
    {
      id: "report_pack",
      name: "Rapportpakke",
      price: "490 kr",
      label: "Kjøp rapportpakke – 490 kr",
      buttonClass:
        "w-full rounded-xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60",
    },
    {
      id: "pfu_pack",
      name: "PFU-pakke",
      price: "1 490 kr",
      label: "Oppgrader til PFU-pakke – 1 490 kr",
      buttonClass:
        "w-full rounded-xl bg-cyan-600 px-5 py-4 text-sm font-black text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60",
    },
    {
      id: "full_pack",
      name: "Full dokumentpakke",
      price: "2 990 kr",
      label: "Oppgrader til full dokumentpakke – 2 990 kr",
      buttonClass:
        "w-full rounded-xl bg-cyan-500 px-5 py-4 text-sm font-black text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60",
    },
  ];

  const visibleCheckoutOptions =
    workflowType === "journalist"
      ? checkoutOptions.filter((option) => option.id === "report_pack")
      : checkoutOptions;

  const isJournalistWorkflow = workflowType === "journalist";

  const isOwned = (id: PackagePlanId) =>
    hasPackageAccess(caseAccessPackageId, id);

  const primaryPackage: PackagePlanId | null =
    selectedPackage && !selectedAlreadyCovered
      ? selectedPackage
      : recommendedNext &&
          visibleCheckoutOptions.some((opt) => opt.id === recommendedNext) &&
          !isOwned(recommendedNext)
        ? recommendedNext
        : null;

  const primaryIsSelected =
    primaryPackage !== null && primaryPackage === selectedPackage;

  const primaryOption = visibleCheckoutOptions.find(
    (opt) => opt.id === primaryPackage
  );

  const primaryButtonClass =
    "w-full rounded-xl bg-slate-950 px-5 py-5 text-base font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60";


  const paymentTitle = isJournalistWorkflow
    ? "Tilgang og redaksjonell sjekk"
    : "Tilgang og betaling";

  const unlockedTitle = isJournalistWorkflow
    ? "Hva er tilgjengelig for redaksjonen"
    : "Hva er låst opp for saken";

  const nextDocumentsTitle = isJournalistWorkflow
    ? "Videre redaksjonelt arbeid"
    : "Videre dokumenter";

  const nextDocumentsText = isJournalistWorkflow
    ? "Når rapporten er klar, kan saken bygges videre med publiseringsgrunnlag, kildevurdering og redaksjonell risikosjekk."
    : "Når rapporten er klar, kan saken bygges videre med PFU-klage, politianmeldelse eller utredningspakke ved behov.";

  const unlockedCapabilities = isJournalistWorkflow
    ? [
        { label: "Redaksjonell rapport", id: "report_pack" as PackagePlanId },
        { label: "Publiseringsgrunnlag", id: "pfu_pack" as PackagePlanId },
        { label: "Utvidet VVP-risiko", id: "full_pack" as PackagePlanId },
      ]
    : [
        { label: "Rapport", id: "report_pack" as PackagePlanId },
        { label: "PFU-klage", id: "pfu_pack" as PackagePlanId },
        { label: "Politianmeldelse", id: "full_pack" as PackagePlanId },
      ];

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">Laster saken...</p>
          </div>
        </section>
      </main>
    );
  }

  if (errorMessage || !caseItem) {
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
              Fant ikke saken
            </h1>
            <p className="mt-4 leading-8 text-red-800">
              {errorMessage || "Saken finnes ikke, eller du har ikke tilgang."}
            </p>
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
          href="/min-side"
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          ← Tilbake til Min Side
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_390px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              PresseSjekk-sak
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              {caseItem.title}
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Dette er startsiden for saken. Her får du oversikt over artikkel,
              mediehus, status, rapporter og videre arbeid. Bruk Saksgang til
              høyre for å gå mellom stegene i saken.
            </p>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Grunninformasjon
              </p>

              <div className="flex flex-wrap items-start justify-between gap-4">
                <h2 className="mt-3 text-4xl font-black text-slate-950">
                  Artikkel og sak
                </h2>

                {!isEditingBasicInfo ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingBasicInfo(true)}
                    className="mt-3 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800"
                  >
                    Rediger grunninformasjon
                  </button>
                ) : null}
              </div>

              <p className="mt-4 max-w-3xl leading-8 text-slate-700">
                {workflowType === "journalist"
                  ? "Sjekk at mediehus, publiseringsdato, artikkeloverskrift, lenke og kort beskrivelse stemmer. Dette er grunnlaget som brukes videre i saksopplysninger, redaksjonell sjekk og publiseringsgrunnlag."
                  : "Sjekk at mediehus, publiseringsdato, artikkeloverskrift, lenke og kort beskrivelse stemmer. Dette er grunnlaget som brukes videre i saksopplysninger, rapport og PFU-klage og PFU-avgjørelse."}
              </p>

              {isEditingBasicInfo ? (
                <form onSubmit={handleBasicInfoSubmit} className="mt-8 grid gap-5">
                  <div>
                    <label
                      htmlFor="editTitle"
                      className="text-sm font-bold text-slate-800"
                    >
                      Tittel på saken
                    </label>
                    <input
                      id="editTitle"
                      type="text"
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="editStatus"
                      className="text-sm font-bold text-slate-800"
                    >
                      Status
                    </label>
                    <select
                      id="editStatus"
                      value={editStatus}
                      onChange={(event) =>
                        setEditStatus(event.target.value as CaseRow["status"])
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
                        htmlFor="editMediaName"
                        className="text-sm font-bold text-slate-800"
                      >
                        Mediehus
                      </label>
                      <input
                        id="editMediaName"
                        type="text"
                        value={editMediaName}
                        onChange={(event) => setEditMediaName(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="editPublishedDate"
                        className="text-sm font-bold text-slate-800"
                      >
                        Publiseringsdato
                      </label>
                      <input
                        id="editPublishedDate"
                        type="date"
                        value={editPublishedDate}
                        onChange={(event) =>
                          setEditPublishedDate(event.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="editArticleTitle"
                      className="text-sm font-bold text-slate-800"
                    >
                      Artikkeloverskrift
                    </label>
                    <input
                      id="editArticleTitle"
                      type="text"
                      value={editArticleTitle}
                      onChange={(event) => setEditArticleTitle(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="editArticleUrl"
                      className="text-sm font-bold text-slate-800"
                    >
                      Lenke til artikkel
                    </label>
                    <input
                      id="editArticleUrl"
                      type="url"
                      value={editArticleUrl}
                      onChange={(event) => setEditArticleUrl(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="editShortDescription"
                      className="text-sm font-bold text-slate-800"
                    >
                      Kort beskrivelse
                    </label>
                    <textarea
                      id="editShortDescription"
                      rows={5}
                      value={editShortDescription}
                      onChange={(event) =>
                        setEditShortDescription(event.target.value)
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isSavingBasicInfo}
                      className="rounded-xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingBasicInfo ? "Lagrer..." : "Lagre grunninformasjon"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditTitle(caseItem.title ?? "");
                        setEditStatus(caseItem.status ?? "draft");
                        setEditMediaName(caseItem.media_name ?? "");
                        setEditArticleTitle(caseItem.article_title ?? "");
                        setEditArticleUrl(caseItem.article_url ?? "");
                        setEditPublishedDate(caseItem.published_date ?? "");
                        setEditShortDescription(caseItem.short_description ?? "");
                        setIsEditingBasicInfo(false);
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-4 text-sm font-black text-slate-950 hover:bg-slate-100"
                    >
                      Avbryt
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-8 grid gap-4">
                  <InfoBlock label="Status">
                    <p className="text-xl font-black text-slate-950">
                      {statusLabel(caseItem.status)}
                    </p>
                  </InfoBlock>

                  <InfoBlock label="Mediehus">
                    <p className="text-xl font-black text-slate-950">
                      {caseItem.media_name || "Ikke satt"}
                    </p>
                  </InfoBlock>

                  <InfoBlock label="Publiseringsdato">
                    <p className="text-xl font-black text-slate-950">
                      {formatDate(caseItem.published_date)}
                    </p>
                  </InfoBlock>

                  <InfoBlock label="Artikkeloverskrift">
                    <p className="text-xl font-black text-slate-950">
                      {caseItem.article_title || "Ikke satt"}
                    </p>
                  </InfoBlock>

                  <InfoBlock label="Lenke">
                    {caseItem.article_url ? (
                      <a
                        href={caseItem.article_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block break-words text-lg font-bold text-cyan-700 hover:text-cyan-900"
                      >
                        {caseItem.article_url}
                      </a>
                    ) : (
                      <p className="text-xl font-black text-slate-950">
                        Ikke satt
                      </p>
                    )}
                  </InfoBlock>

                  <InfoBlock label="Kort beskrivelse">
                    {caseItem.short_description || "Ikke lagt inn ennå."}
                  </InfoBlock>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/min-side/saker/${params.id}/opplysninger`}
                className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800"
              >
                Gå til saksopplysninger
              </Link>

              <Link
                href="/min-side"
                className="rounded-2xl border border-slate-300 bg-white px-6 py-4 font-black text-slate-950 hover:bg-slate-100"
              >
                Til Min Side
              </Link>
            </div>

          </section>

          <aside className="grid content-start gap-6">
          <CaseWorkflowCard
            caseId={params.id}
            statusLabel={statusLabel(caseItem.status)}
            activeStep="case"
            workflowType={workflowType}
            currentPackageId={caseAccessPackageId ?? undefined}
            stepsDone={{
              caseRegistered: true,
              caseInputs: Boolean(caseInput),
              report: reports.some(
                (report) =>
                  report.report_type === "free_check" ||
                  report.report_type === "full_report"
              ),
              pfuDraft: reports.some((report) => report.report_type === "pfu_draft"),
              pfuDecision: Boolean(
                pfuDecision?.decision_received || pfuDecision?.uploaded_file_name
              ),
              policeReport: reports.some((report) => report.report_type === "police_draft"),
              investigation: reports.some((report) => report.report_type === "investigation_draft"),
            }}
          />

            <div
              id="betaling"
              className="scroll-mt-24 rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm ring-2 ring-cyan-100 sm:p-7"
            >
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
                {paymentTitle}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-slate-600">
                  Aktiv pakke:
                </span>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-black ${
                    caseAccessPackageId
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {caseAccessPackageId
                    ? packageLabel(caseAccessPackageId)
                    : "Ingen"}
                </span>
              </div>

              {primaryOption ? (
                <div
                  className={`mt-5 rounded-2xl border-2 p-5 ${
                    primaryIsSelected
                      ? "border-amber-400 bg-amber-50"
                      : "border-cyan-400 bg-cyan-50"
                  }`}
                >
                  <p
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.15em] ${
                      primaryIsSelected
                        ? "bg-amber-200 text-amber-900"
                        : "bg-cyan-200 text-cyan-900"
                    }`}
                  >
                    {primaryIsSelected
                      ? "Valgt fra priser"
                      : "Anbefalt neste steg"}
                  </p>

                  <h3 className="mt-3 text-2xl font-black text-slate-950">
                    {primaryIsSelected
                      ? `Du valgte ${primaryOption.name} fra priser`
                      : primaryOption.name}
                  </h3>
                  <p className="mt-1 text-3xl font-black text-slate-950">
                    {primaryOption.price}
                  </p>

                  <div className="mt-4">
                    <StripeCheckoutButton
                      packageId={primaryOption.id}
                      caseId={params.id}
                      className={primaryButtonClass}
                    >
                      {`Betal ${primaryOption.price} – ${primaryOption.name}`}
                    </StripeCheckoutButton>
                  </div>
                </div>
              ) : null}

              {selectedAlreadyCovered ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-800">
                  Denne saken har allerede {packageLabel(selectedPackage)} eller
                  bedre. Ingen ny betaling er nødvendig.
                </div>
              ) : null}

              <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                {unlockedTitle}
              </p>
              <div className="mt-3 grid gap-2">
                {unlockedCapabilities.map((cap) => {
                  const unlocked = hasPackageAccess(caseAccessPackageId, cap.id);
                  return (
                    <div
                      key={cap.id}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                        unlocked
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <span aria-hidden>{unlocked ? "✓" : "🔒"}</span>
                        {cap.label}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.15em] ${
                          unlocked
                            ? "bg-emerald-200 text-emerald-900"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {unlocked ? "Låst opp" : "Låst"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {visibleCheckoutOptions.filter(
                (opt) => !isOwned(opt.id) && opt.id !== primaryPackage
              ).length > 0 ? (
                <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                  Andre pakker
                </p>
              ) : null}

              <div className="mt-3 grid gap-3">
                {visibleCheckoutOptions
                  .filter(
                    (opt) => !isOwned(opt.id) && opt.id !== primaryPackage
                  )
                  .map((opt) => (
                    <StripeCheckoutButton
                      key={opt.id}
                      packageId={opt.id}
                      caseId={params.id}
                      className={opt.buttonClass}
                    >
                      {opt.label}
                    </StripeCheckoutButton>
                  ))}

                {!isJournalistWorkflow ? (
                  <Link
                    href="/kontakt"
                    className="rounded-xl border border-cyan-200 bg-white px-5 py-4 text-center text-sm font-black text-cyan-900 hover:bg-cyan-100"
                  >
                    {caseAccessPackageId === "full_pack"
                      ? "Neste steg: spør om utredning eller proffhjelp"
                      : "Spør om utredningspakke"}
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Rapport
              </p>
              <h2 className="mt-3 text-3xl font-black">
                {reportDrafts.length > 1
                  ? `${reportDrafts.length} rapporter lagret`
                  : reportDrafts.length === 1
                    ? "1 rapport lagret"
                    : "Ingen rapport lagret"}
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                {reportDrafts.length > 0
                  ? `Siste rapportversjon er v${reportDrafts[0]?.version}. Du kan åpne rapporten eller lage en ny versjon.`
                  : "Når saksopplysninger er lagt inn, kan du lage første rapport."}
              </p>

              <Link
                href={`/min-side/saker/${params.id}/rapport`}
                className="mt-6 inline-flex rounded-xl bg-cyan-400 px-5 py-4 text-sm font-black text-slate-950 hover:bg-cyan-300"
              >
                {reportDrafts.length > 0 ? "Åpne rapport" : "Lag rapport"}
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                {isJournalistWorkflow ? "Redaksjonelt arbeid" : "Videre dokumenter"}
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                {nextDocumentsTitle}
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                {nextDocumentsText}
              </p>

              <div className="mt-5 grid gap-3">
                {isJournalistWorkflow ? (
                  <>
                    <Link
                      href={`/min-side/saker/${params.id}/opplysninger`}
                      className="rounded-xl border border-slate-300 bg-slate-50 px-5 py-4 text-sm font-black text-slate-950 hover:bg-slate-100"
                    >
                      Åpne publiseringsgrunnlag
                    </Link>

                    <Link
                      href={`/min-side/saker/${params.id}/rapport`}
                      className="rounded-xl border border-slate-300 bg-slate-50 px-5 py-4 text-sm font-black text-slate-950 hover:bg-slate-100"
                    >
                      {reportDrafts.length > 0
                        ? "Åpne redaksjonell rapport"
                        : "Lag redaksjonell rapport"}
                    </Link>

                    <Link
                      href={`/min-side/saker/${params.id}/pakke`}
                      className="rounded-xl border border-cyan-300 bg-cyan-50 px-5 py-4 text-sm font-black text-cyan-900 hover:bg-cyan-100"
                    >
                      Se redaksjonelle pakker
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/min-side/saker/${params.id}/pfu`}
                      className="rounded-xl border border-slate-300 bg-slate-50 px-5 py-4 text-sm font-black text-slate-950 hover:bg-slate-100"
                    >
                      {pfuDrafts.length > 0 ? "Åpne PFU-klage" : "Lag PFU-klage"}
                    </Link>

                    <Link
                      href={`/min-side/saker/${params.id}/politianmeldelse`}
                      className="rounded-xl border border-slate-300 bg-slate-50 px-5 py-4 text-sm font-black text-slate-950 hover:bg-slate-100"
                    >
                      {policeDrafts.length > 0
                        ? "Åpne politianmeldelse"
                        : "Lag politianmeldelse"}
                    </Link>

                    <Link
                      href={`/min-side/saker/${params.id}/utredning`}
                      className="rounded-xl border border-slate-300 bg-slate-50 px-5 py-4 text-sm font-black text-slate-950 hover:bg-slate-100"
                    >
                      {investigationDrafts.length > 0
                        ? "Åpne utredning"
                        : "Åpne utredning"}
                    </Link>
                  </>
                )}
              </div>
            </div>

            {!isJournalistWorkflow ? (
              <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
                  Status
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-950">
                  {pfuDecision?.decision_received
                    ? pfuDecisionResultLabel(pfuDecision.decision_result)
                    : pfuDecision?.pfu_complaint_sent
                      ? "PFU-klage sendt"
                      : "Ikke registrert"}
                </h2>

                <div className="mt-5 grid gap-3 text-sm font-semibold text-slate-700">
                  <p>
                    Klage sendt:{" "}
                    <span className="font-black text-slate-950">
                      {pfuDecision?.pfu_complaint_sent ? "Ja" : "Nei / ikke satt"}
                    </span>
                  </p>
                  <p>
                    Avgjørelse mottatt:{" "}
                    <span className="font-black text-slate-950">
                      {pfuDecision?.decision_received ? "Ja" : "Nei / ikke satt"}
                    </span>
                  </p>
                  <p>
                    Opplastet fil:{" "}
                    <span className="font-black text-slate-950">
                      {pfuDecision?.uploaded_file_name || "Ingen fil"}
                    </span>
                  </p>
                </div>

                <Link
                  href={`/min-side/saker/${params.id}/pfu-avgjorelse`}
                  className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800"
                >
                  Åpne PFU-avgjørelse
                </Link>
              </div>
            ) : null}
          </aside>
        </div>

      </section>

      <LightPublicFooter />
    </main>
  );
}

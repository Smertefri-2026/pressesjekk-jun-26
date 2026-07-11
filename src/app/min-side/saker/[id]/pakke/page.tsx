"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import {
  caseBundles,
  monthlyPackages,
  type PackagePlanId,
} from "@/data/packagePlans";
import { supabase } from "@/lib/supabase/client";

type CaseRow = {
  id: string;
  title: string;
  media_name: string | null;
  article_title: string | null;
};

type CaseAccessRow = {
  package_id: PackagePlanId;
  status: "active" | "pending" | "cancelled" | "expired";
};

type PackageTab = "upgrade" | "bundles" | "monthly";

type UpgradeOption = {
  id: PackagePlanId;
  name: string;
  price: number;
  tag: string;
  description: string;
  features: string[];
};

const upgradeOptions: UpgradeOption[] = [
  {
    id: "report_pack",
    name: "Rapportpakke",
    price: 490,
    tag: "Start",
    description:
      "For deg som vil få struktur, vurdering og en ryddig rapport på saken.",
    features: [
      "Rapport basert på saksopplysninger",
      "Mulige presseetiske punkter",
      "Ryddig PDF-grunnlag",
    ],
  },
  {
    id: "pfu_pack",
    name: "PFU-pakke",
    price: 1490,
    tag: "Mest relevant",
    description:
      "For deg som vil gå videre fra rapport til strukturert PFU-klage.",
    features: [
      "Alt i rapportpakke",
      "Utkast til PFU-klage",
      "Kobling mot relevante VVP-punkter",
    ],
  },
  {
    id: "full_pack",
    name: "Full dokumentpakke",
    price: 2990,
    tag: "Best verdi",
    description:
      "For deg som også vil ha videre dokumenter som politianmeldelse og mer komplett saksgrunnlag.",
    features: [
      "Alt i PFU-pakke",
      "Utkast til politianmeldelse",
      "Videre dokumentgrunnlag for saken",
    ],
  },
  {
    id: "investigation_pack",
    name: "Utredningspakke",
    price: 100000,
    tag: "Manuell hjelp",
    description:
      "For større eller mer alvorlige saker der du ønsker manuell gjennomgang, strukturering og videre strategi.",
    features: [
      "Alt i full dokumentpakke",
      "Manuell vurdering av saken",
      "Gjennomgang av dokumentasjon",
      "Kvalitetssikring av rapport og dokumentpakke",
      "Forslag til videre strategi",
    ],
  },
];

const tabText = {
  upgrade: {
    eyebrow: "Oppgrader saken",
    title: "Oppgrader denne saken.",
    description:
      "Dette gjelder bare saken du står på nå. Ved oppgradering betaler du bare mellomlegget.",
  },
  bundles: {
    eyebrow: "Flere saker",
    title: "Kjøp flere ledige saker.",
    description:
      "Sakspakker legges på kontoen din som ledige saker. Du kan opprette nye saker etter kjøp.",
  },
  monthly: {
    eyebrow: "Abonnement",
    title: "Start abonnement for løpende arbeid.",
    description:
      "For deg som jobber med flere mediesaker hver måned. Abonnement gir inkluderte saker per måned.",
  },
} as const;

function packageLabel(packageId: PackagePlanId | null) {
  if (packageId === "report_pack") return "Rapportpakke";
  if (packageId === "pfu_pack") return "PFU-pakke";
  if (packageId === "full_pack") return "Full dokumentpakke";
  if (packageId === "investigation_pack") return "Utredningspakke";
  if (packageId === "case_bundle_3") return "3 saker";
  if (packageId === "case_bundle_5") return "5 saker";
  if (packageId === "case_bundle_10") return "10 saker";
  if (packageId === "monthly_start") return "Månedsavtale Start";
  if (packageId === "monthly_pro") return "Månedsavtale Pro";
  if (packageId === "monthly_agency") return "Månedsavtale Byrå";
  if (packageId === "monthly_enterprise") return "Enterprise";
  return "Ingen aktiv pakke";
}

function journalistPackageLabel(packageId: PackagePlanId | null) {
  if (packageId === "report_pack") return "Redaksjonell rapport";
  if (packageId === "pfu_pack") return "VVP-risiko og forbedringspunkter";
  if (packageId === "full_pack") return "Utvidet publiseringsgrunnlag";
  if (packageId === "investigation_pack") return "Manuell redaksjonell gjennomgang";
  if (packageId === "case_bundle_3") return "3 redaksjonelle saker";
  if (packageId === "case_bundle_5") return "5 redaksjonelle saker";
  if (packageId === "case_bundle_10") return "10 redaksjonelle saker";
  if (packageId === "monthly_start") return "Redaksjonell månedsavtale Start";
  if (packageId === "monthly_pro") return "Redaksjonell månedsavtale Pro";
  if (packageId === "monthly_agency") return "Redaksjonell månedsavtale Byrå";
  if (packageId === "monthly_enterprise") return "Enterprise";
  return "Ingen aktiv tilgang";
}

function packageRank(packageId: PackagePlanId | null) {
  if (!packageId) return 0;
  if (packageId === "report_pack") return 1;
  if (packageId === "pfu_pack") return 2;
  if (packageId === "full_pack") return 3;
  if (packageId === "investigation_pack") return 4;
  return 1;
}

function packagePrice(packageId: PackagePlanId | null) {
  if (packageId === "report_pack") return 490;
  if (packageId === "pfu_pack") return 1490;
  if (packageId === "full_pack") return 2990;
  if (packageId === "investigation_pack") return 100000;
  return 0;
}

function formatKr(amount: number) {
  return new Intl.NumberFormat("nb-NO").format(amount);
}

export default function CasePackagePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<PackageTab>("upgrade");
  const [workflowType, setWorkflowType] = useState<"standard" | "journalist">("standard");
  const [caseItem, setCaseItem] = useState<CaseRow | null>(null);
  const [currentPackageId, setCurrentPackageId] =
    useState<PackagePlanId | null>(null);
  const [activeSubscriptionPackageId, setActiveSubscriptionPackageId] =
    useState<PackagePlanId | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [portalMessage, setPortalMessage] = useState("");

  const checkoutStatus = searchParams.get("checkout");

  useEffect(() => {
    async function loadPackagePage() {
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

      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("id,title,media_name,article_title")
        .eq("id", params.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (caseError || !caseData) {
        setErrorMessage("Fant ikke saken, eller du har ikke tilgang.");
        setIsLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role_type")
        .eq("id", user.id)
        .maybeSingle();

      const nextWorkflowType =
        profileData?.role_type === "journalist" ? "journalist" : "standard";

      setWorkflowType(nextWorkflowType);

      if (nextWorkflowType === "journalist") {
        setActiveTab("bundles");
      }

      setCaseItem(caseData as CaseRow);

      const { data: accessData } = await supabase
        .from("case_access")
        .select("package_id,status")
        .eq("case_id", params.id)
        .eq("status", "active")
        .maybeSingle();

      const access = accessData as CaseAccessRow | null;
      setCurrentPackageId(access?.package_id ?? null);

      const { data: subscriptionData } = await supabase
        .from("user_subscriptions")
        .select("package_id,status")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing", "past_due"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setActiveSubscriptionPackageId(
        (subscriptionData?.package_id as PackagePlanId | null) ?? null
      );

      setIsLoading(false);
    }

    if (params.id) {
      loadPackagePage();
    }
  }, [params.id, checkoutStatus]);

  const currentRank = packageRank(currentPackageId);
  const currentPrice = packagePrice(currentPackageId);

  const visibleUpgradeOptions = upgradeOptions;

  const isJournalistWorkflow = workflowType === "journalist";

  const pageEyebrow = isJournalistWorkflow
    ? "Redaksjonell tilgang"
    : "Pakke og betaling";

  const pageTitle = isJournalistWorkflow
    ? "Pakker for redaksjonell sjekk"
    : "Pakker og betaling";

  const visibleTabs: PackageTab[] = isJournalistWorkflow
    ? ["bundles", "monthly"]
    : ["upgrade", "bundles", "monthly"];

  const currentPackageLabel = isJournalistWorkflow
    ? journalistPackageLabel(currentPackageId)
    : packageLabel(currentPackageId);

  const tabIntro =
    isJournalistWorkflow && activeTab === "bundles"
      ? {
          eyebrow: "Enkeltsaker",
          title: "Kjøp flere redaksjonelle saker.",
          description:
            "Sakspakker legges på kontoen din som ledige redaksjonelle saker. Hver sak kan brukes til publiseringsgrunnlag og rapport før publisering.",
        }
      : isJournalistWorkflow && activeTab === "monthly"
        ? {
            eyebrow: "Abonnement",
            title: "Start abonnement for løpende redaksjonelt arbeid.",
            description:
              "For redaksjoner som jobber med flere saker hver måned. Abonnement gir inkluderte saker per måned.",
          }
        : tabText[activeTab];

  function displayUpgradeOption(option: UpgradeOption): UpgradeOption {
    if (!isJournalistWorkflow) return option;

    const journalistOptions: Partial<Record<PackagePlanId, UpgradeOption>> = {
      report_pack: {
        ...option,
        name: "Redaksjonell rapport",
        tag: "Start",
        description:
          "For redaksjoner som vil få en ryddig vurdering av saken før publisering.",
        features: [
          "Redaksjonell rapport basert på saksopplysninger",
          "Mulige VVP-risikopunkter",
          "Ryddig PDF-grunnlag før publisering",
        ],
      },
      pfu_pack: {
        ...option,
        name: "VVP-risiko og forbedringspunkter",
        tag: "Anbefalt",
        description:
          "For redaksjoner som vil se tydeligere presseetisk risiko og konkrete forbedringspunkter før publisering.",
        features: [
          "Alt i redaksjonell rapport",
          "VVP-risiko og forbedringspunkter",
          "Sjekk av samtidig imøtegåelse og kildegrunnlag",
        ],
      },
      full_pack: {
        ...option,
        name: "Utvidet publiseringsgrunnlag",
        tag: "Best verdi",
        description:
          "For redaksjoner som vil ha et mer komplett grunnlag før publisering av krevende saker.",
        features: [
          "Alt i VVP-risiko og forbedringspunkter",
          "Utvidet publiseringsgrunnlag",
          "Redaksjonell risikosjekk og dokumentasjonsoversikt",
        ],
      },
      investigation_pack: {
        ...option,
        name: "Manuell redaksjonell gjennomgang",
        tag: "Manuell hjelp",
        description:
          "For større eller mer krevende saker der redaksjonen ønsker manuell gjennomgang før publisering.",
        features: [
          "Alt i utvidet publiseringsgrunnlag",
          "Manuell vurdering av saken",
          "Gjennomgang av dokumentasjon og kildegrunnlag",
          "Kvalitetssikring av rapport og risikopunkter",
          "Forslag til videre redaksjonell håndtering",
        ],
      },
    };

    return journalistOptions[option.id] ?? option;
  }

  async function openCustomerPortal() {
    setIsOpeningPortal(true);
    setPortalMessage("");
    setErrorMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setPortalMessage("Du må være innlogget for å administrere abonnement.");
      setIsOpeningPortal(false);
      return;
    }

    const response = await fetch("/api/stripe/create-customer-portal", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        returnPath: `/min-side/saker/${params.id}/pakke`,
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.url) {
      setPortalMessage(
        payload?.error ?? "Kunne ikke åpne abonnementportalen akkurat nå."
      );
      setIsOpeningPortal(false);
      return;
    }

    window.location.href = payload.url;
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              Laster pakkevalg...
            </p>
          </div>
        </section>
        <LightPublicFooter />
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
            className="text-sm font-bold text-red-700"
          >
            ← Tilbake til Min Side
          </Link>

          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <h1 className="text-3xl font-black text-red-950">
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
          href={`/min-side/saker/${params.id}`}
          className="text-sm font-bold text-red-700"
        >
          ← Tilbake til saken
        </Link>

        {checkoutStatus === "success" ? (
          <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <p className="font-black text-emerald-950">
              Betaling registrert. Oppdater siden om pakken ikke vises med en gang.
            </p>
          </div>
        ) : null}

        {checkoutStatus === "cancelled" ? (
          <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <p className="font-black text-amber-950">
              Betaling ble avbrutt. Du kan prøve igjen når du er klar.
            </p>
          </div>
        ) : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_390px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-700">
              {pageEyebrow}
            </p>

            <h1 className="mt-4 max-w-4xl [text-wrap:balance] text-4xl font-black sm:text-5xl tracking-tight text-slate-950 md:text-7xl">
              {pageTitle}
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              {isJournalistWorkflow
                ? "Kjøp enkeltsaker eller start abonnement for redaksjonell sjekk. Én sak kan inneholde flere artikler eller URL-er om samme mediesituasjon."
                : "Oppgrader denne saken, kjøp flere ledige saker eller start abonnement. Én sak kan inneholde flere artikler eller URL-er om samme mediesituasjon."}
            </p>
          </section>

          <aside className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-800">
              {isJournalistWorkflow ? "Nåværende tilgang" : "Nåværende pakke"}
            </p>

            <h2 className="mt-4 text-3xl font-black text-slate-950">
              {currentPackageLabel}
            </h2>

            <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
              Sak: <span className="text-slate-950">{caseItem.title}</span>
            </p>

            {caseItem.media_name ? (
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                Mediehus:{" "}
                <span className="text-slate-950">{caseItem.media_name}</span>
              </p>
            ) : null}

            <Link
              href={`/min-side/saker/${params.id}`}
              className="mt-6 inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
            >
              Tilbake til saken
            </Link>
          </aside>
        </div>

        <section className="sticky top-0 z-20 -mx-4 mt-8 border-y border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-3xl sm:border sm:px-3">
          <div
            className={`grid gap-2 ${
              isJournalistWorkflow ? "sm:grid-cols-2" : "sm:grid-cols-3"
            }`}
          >
            {visibleTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-2xl px-4 py-4 text-sm font-black transition ${
                  activeTab === tab
                    ? "bg-slate-950 text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {tab === "upgrade"
                  ? "Oppgrader saken"
                  : tab === "bundles"
                    ? isJournalistWorkflow
                      ? "Enkeltsaker"
                      : "Kjøp flere saker"
                    : "Abonnement"}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
            {tabIntro.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            {tabIntro.title}
          </h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-700">
            {tabIntro.description}
          </p>
        </section>

        {activeTab === "upgrade" ? (
          <section className="mt-8">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {visibleUpgradeOptions.map((option) => {
                const displayOption = displayUpgradeOption(option);
                const optionRank = packageRank(option.id);
                const upgradeAmount = Math.max(option.price - currentPrice, 0);
                const isCurrent = currentPackageId === option.id;
                const isIncluded = currentRank > optionRank;
                const canUpgrade = optionRank > currentRank;

                return (
                  <article
                    key={option.id}
                    className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-red-700">
                      {displayOption.tag}
                    </p>
                    <h2 className="mt-3 text-3xl font-black text-slate-950">
                      {displayOption.name}
                    </h2>
                    <p className="mt-4 min-h-28 leading-8 text-slate-700">
                      {displayOption.description}
                    </p>

                    <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white">
                      <p className="text-sm font-bold text-slate-300">
                        Ordinær pris
                      </p>
                      <p className="mt-1 text-3xl font-black">
                        {formatKr(option.price)} kr
                      </p>
                      <p className="mt-2 text-sm font-semibold text-red-200">
                        {canUpgrade
                          ? `Mellomlegg nå: ${formatKr(upgradeAmount)} kr`
                          : isCurrent
                            ? "Dette er pakken du har nå"
                            : "Inkludert i pakken du har"}
                      </p>
                    </div>

                    <ul className="mt-5 grid flex-1 content-start gap-3 text-sm font-semibold text-slate-700">
                      {displayOption.features.map((feature) => (
                        <li key={feature}>✓ {feature}</li>
                      ))}
                    </ul>

                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      {currentPackageId ? (
                        <div className="mb-4 rounded-xl bg-white p-3 text-sm font-semibold text-slate-700">
                          Du har nå:{" "}
                          <span className="font-black text-slate-950">
                            {currentPackageLabel}
                          </span>
                        </div>
                      ) : null}

                      <div className="grid gap-2 text-sm font-semibold text-slate-700">
                        <div className="flex items-center justify-between gap-4">
                          <span>Ordinær pris</span>
                          <span className="font-black text-slate-950">
                            {formatKr(option.price)} kr
                          </span>
                        </div>

                        {currentPackageId && canUpgrade ? (
                          <div className="flex items-center justify-between gap-4">
                            <span>Fradrag</span>
                            <span className="font-black text-emerald-700">
                              -{formatKr(currentPrice)} kr
                            </span>
                          </div>
                        ) : null}

                        {canUpgrade ? (
                          <div className="mt-2 flex items-center justify-between gap-4 border-t border-slate-200 pt-3">
                            <span className="font-black text-slate-950">
                              {currentPackageId ? "Mellomlegg" : "Pris"}
                            </span>
                            <span className="text-lg font-black text-slate-950">
                              {formatKr(upgradeAmount)} kr
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4">
                        {canUpgrade ? (
                          <Link
                            href={`/utsjekk?plan=${option.id}&caseId=${params.id}&mode=upgrade`}
                            className="block w-full rounded-2xl bg-slate-950 px-5 py-4 text-center text-sm font-black text-white hover:bg-slate-800"
                          >
                            {currentPackageId
                              ? `Oppgrader for ${formatKr(upgradeAmount)} kr`
                              : `Velg ${displayOption.name}`}
                          </Link>
                        ) : isCurrent ? (
                          <div className="rounded-2xl bg-emerald-100 px-5 py-4 text-center text-sm font-black text-emerald-900">
                            Aktiv pakke
                          </div>
                        ) : isIncluded ? (
                          <div className="rounded-2xl bg-slate-100 px-5 py-4 text-center text-sm font-black text-slate-600">
                            Inkludert
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-800">
                Endre eller justere pakke
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                Vi hjelper deg med endringer
              </h2>
              <p className="mt-4 max-w-3xl leading-8 text-slate-700">
                Har du valgt feil pakke, eller ønsker du å endre noe etter kjøp,
                kan du ta kontakt. Vi vurderer endringen manuelt slik at tilgang,
                dokumenter og eventuell betaling blir riktig.
              </p>
              <Link
                href="/kontakt"
                className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800"
              >
                Kontakt oss
              </Link>
            </div>
          </section>
        ) : null}

        {activeTab === "bundles" ? (
          <section className="mt-8 grid gap-5 md:grid-cols-3">
            {caseBundles.map((bundle) => (
              <article
                key={bundle.id}
                className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="inline-flex w-fit rounded-full bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-red-800">
                  {bundle.tag}
                </p>

                <h2 className="mt-5 text-3xl font-black text-slate-950">
                  {bundle.name}
                </h2>

                <p className="mt-3 text-4xl font-black text-slate-950">
                  {bundle.price}
                </p>

                <p className="mt-4 leading-8 text-slate-700">
                  {bundle.description}
                </p>

                <ul className="mb-8 mt-6 grid flex-1 content-start gap-3 text-sm font-medium text-slate-700">
                  {bundle.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="text-red-700">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/utsjekk?plan=${bundle.id}`}
                  className="mt-auto block rounded-xl bg-orange-400 px-5 py-4 text-center font-black text-slate-950 hover:bg-orange-500"
                >
                  {bundle.button}
                </Link>
              </article>
            ))}
          </section>
        ) : null}

        {activeTab === "monthly" ? (
          <section className="mt-8">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {monthlyPackages.map((plan) => {
                const isActiveSubscription =
                  activeSubscriptionPackageId === plan.id;

                return (
                  <article
                    key={plan.id}
                    className={`flex h-full flex-col rounded-3xl border p-6 shadow-sm ${
                      isActiveSubscription
                        ? "border-emerald-300 bg-emerald-50"
                        : plan.id === "monthly_pro"
                          ? "border-red-300 bg-red-50"
                          : "border-slate-200 bg-white"
                    }`}
                  >
                  <p className="inline-flex w-fit rounded-full bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-red-800">
                    {plan.tag}
                  </p>

                  <h2 className="mt-5 text-2xl font-black text-slate-950">
                    {plan.name}
                  </h2>

                  <p className="mt-3 text-3xl font-black text-slate-950">
                    {plan.price}
                  </p>

                  <p className="mt-4 leading-8 text-slate-700">
                    {plan.description}
                  </p>

                  <ul className="mb-8 mt-6 grid flex-1 content-start gap-3 text-sm font-medium text-slate-700">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <span className="text-red-700">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isActiveSubscription ? (
                    <div className="mt-auto rounded-xl bg-emerald-100 px-5 py-4 text-center font-black text-emerald-900">
                      Aktiv avtale
                    </div>
                  ) : (
                    <Link
                      href={
                        plan.id === "monthly_enterprise"
                          ? "/kontakt"
                          : `/utsjekk?plan=${plan.id}`
                      }
                      className="mt-auto block rounded-xl bg-slate-950 px-5 py-4 text-center font-black text-white hover:bg-slate-800"
                    >
                      {plan.id === "monthly_enterprise"
                        ? "Be om tilbud"
                        : "Start abonnement"}
                    </Link>
                  )}
                </article>
                );
              })}
            </div>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
                Administrer abonnement
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                Kundeportal, kvitteringer og betaling
              </h2>
              <p className="mt-4 max-w-3xl leading-8 text-slate-700">
                Har du aktivt abonnement, kan du åpne Stripe kundeportal for å
                se avtalen, oppdatere betalingskort, se kvitteringer og
                administrere abonnementet.
              </p>

              {activeSubscriptionPackageId ? (
                <button
                  type="button"
                  onClick={openCustomerPortal}
                  disabled={isOpeningPortal}
                  className="mt-5 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-sm font-black text-slate-950 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isOpeningPortal ? "Åpner kundeportal ..." : "Åpne Stripe kundeportal"}
                </button>
              ) : (
                <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">
                  Du har ikke et aktivt abonnement nå. Velg en månedsavtale over
                  dersom du ønsker løpende tilgang.
                </p>
              )}

              {portalMessage ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                  {portalMessage}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </section>

      <LightPublicFooter />
    </main>
  );
}

"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { StripeCheckoutButton } from "@/components/stripe/StripeCheckoutButton";
import { supabase } from "@/lib/supabase/client";
import type { PackagePlanId } from "@/data/packagePlans";

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

type UpgradeOption = {
  id: PackagePlanId;
  name: string;
  price: number;
  tag: string;
  description: string;
  features: string[];
  manual?: boolean;
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

  const [caseItem, setCaseItem] = useState<CaseRow | null>(null);
  const [currentPackageId, setCurrentPackageId] =
    useState<PackagePlanId | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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

      setCaseItem(caseData as CaseRow);

      const { data: accessData } = await supabase
        .from("case_access")
        .select("package_id,status")
        .eq("case_id", params.id)
        .eq("status", "active")
        .maybeSingle();

      const access = accessData as CaseAccessRow | null;
      setCurrentPackageId(access?.package_id ?? null);

      setIsLoading(false);
    }

    if (params.id) {
      loadPackagePage();
    }
  }, [params.id, checkoutStatus]);

  const currentRank = packageRank(currentPackageId);
  const currentPrice = packagePrice(currentPackageId);

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
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
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

        <div className="mt-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_390px] lg:items-start">
            <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Pakke og betaling
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Velg pakke for saken
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Her ser du hva saken har nå, hva som er inkludert og hva det koster
              å oppgradere videre. Ved oppgradering betaler du bare mellomlegget.
            </p>

            </section>

          <aside className="hidden rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7 lg:block">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Nåværende pakke
            </p>

            <h2 className="mt-4 text-3xl font-black text-slate-950">
              {packageLabel(currentPackageId)}
            </h2>

            <p className="mt-4 break-words text-sm font-semibold leading-6 text-slate-600">
              Sak: <span className="text-slate-950">{caseItem.title}</span>
            </p>

            {caseItem.media_name ? (
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                Mediehus: <span className="text-slate-950">{caseItem.media_name}</span>
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

          <section className="mt-8">

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {upgradeOptions.map((option) => {
                const optionRank = packageRank(option.id);
                const upgradeAmount = Math.max(option.price - currentPrice, 0);
                const isCurrent = currentPackageId === option.id;
                const isIncluded = currentRank > optionRank;
                const canUpgrade = optionRank > currentRank;

                return (
                  <article
                    key={option.id}
                    className={`flex h-full flex-col rounded-3xl border p-6 shadow-sm ${
                      option.id === "investigation_pack"
                        ? "border-amber-300 bg-amber-50"
                        : option.id === "full_pack"
                          ? "border-cyan-300 bg-cyan-50"
                          : "border-slate-200 bg-white"
                    }`}
                  >
                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-700">
                      {option.tag}
                    </p>
                    <h2 className="mt-3 text-3xl font-black text-slate-950">
                      {option.name}
                    </h2>
                    <p className="mt-4 min-h-28 leading-8 text-slate-700">
                      {option.description}
                    </p>

                    <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white">
                      <p className="text-sm font-bold text-slate-300">
                        Ordinær pris
                      </p>
                      <p className="mt-1 text-3xl font-black">
                        {formatKr(option.price)} kr
                      </p>
                      <p className="mt-2 text-sm font-semibold text-cyan-200">
                        {canUpgrade
                          ? `Mellomlegg nå: ${formatKr(upgradeAmount)} kr`
                          : isCurrent
                            ? "Dette er pakken du har nå"
                            : "Inkludert i pakken du har"}
                      </p>
                    </div>

                    <ul className="mt-5 grid flex-1 content-start gap-3 text-sm font-semibold text-slate-700">
                      {option.features.map((feature) => (
                        <li key={feature}>✓ {feature}</li>
                      ))}
                    </ul>

                    <div className="mt-6">
                      {canUpgrade ? (
                        <StripeCheckoutButton
                          packageId={option.id}
                          caseId={params.id}
                          className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {currentPackageId
                            ? `Oppgrader for ${formatKr(upgradeAmount)} kr`
                            : `Velg ${option.name}`}
                        </StripeCheckoutButton>
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
                  </article>
                );
              })}
            </div>

            <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-800">
                Nedgradering / endring
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                Kontakt oss
              </h2>
              <p className="mt-4 max-w-3xl leading-8 text-slate-700">
                Nedgradering eller endring etter at en pakke er brukt må vurderes
                manuelt, slik at tilgang og dokumenter ikke blir feil.
              </p>
              <Link
                href="/kontakt"
                className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800"
              >
                Kontakt oss
              </Link>
            </div>
          </section>
        </div>

        <section className="mt-8 lg:hidden">
          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Nåværende pakke
            </p>

            <h2 className="mt-4 text-3xl font-black text-slate-950">
              {packageLabel(currentPackageId)}
            </h2>

            <p className="mt-4 break-words text-sm font-semibold leading-6 text-slate-600">
              Sak: <span className="text-slate-950">{caseItem.title}</span>
            </p>

            {caseItem.media_name ? (
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                Mediehus: <span className="text-slate-950">{caseItem.media_name}</span>
              </p>
            ) : null}

            <Link
              href={`/min-side/saker/${params.id}`}
              className="mt-6 inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
            >
              Tilbake til saken
            </Link>
          </aside>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}

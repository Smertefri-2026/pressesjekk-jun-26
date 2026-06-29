"use client";

import Link from "next/link";
import { useState } from "react";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { monthlyPackages, singlePackages } from "@/data/packagePlans";

type PricingTab = "single" | "bundles" | "monthly";

const caseBundles = [
  {
    name: "3 saker",
    price: "1 390 kr",
    perCase: "ca. 463 kr per sak",
    tag: "Liten pakke",
    description:
      "For deg som vil teste flere mediesaker uten å binde deg til abonnement.",
    features: [
      "3 rapportpakke-saker",
      "Kan brukes på ulike mediesaker",
      "Hver sak kan oppgraderes ved behov",
      "Passer for privatpersoner og små virksomheter",
    ],
    button: "Kjøp 3 saker",
    href: "/min-side/pakker/kjop?plan=case_bundle_3",
  },
  {
    name: "5 saker",
    price: "2 190 kr",
    perCase: "ca. 438 kr per sak",
    tag: "Mest fleksibel",
    description:
      "For deg som har flere omtaler, klienter eller saker som bør struktureres.",
    features: [
      "5 rapportpakke-saker",
      "Bedre pris enn enkeltkjøp",
      "Kan brukes over tid",
      "Oppgradering per sak ved behov",
    ],
    button: "Kjøp 5 saker",
    href: "/min-side/pakker/kjop?plan=case_bundle_5",
  },
  {
    name: "10 saker",
    price: "3 990 kr",
    perCase: "ca. 399 kr per sak",
    tag: "Best uten abonnement",
    description:
      "For deg som trenger flere enkeltsaker, men ikke ønsker månedlig avtale.",
    features: [
      "10 rapportpakke-saker",
      "Lavere pris per sak",
      "Passer for sporadisk proffbruk",
      "Proff-abonnement anbefales ved løpende behov",
    ],
    button: "Kjøp 10 saker",
    href: "/min-side/pakker/kjop?plan=case_bundle_10",
  },
];

const tabInfo = {
  single: {
    label: "Enkeltkjøp",
    title: "Kjøp pakke for én konkret mediesak.",
    text: "En sak kan inneholde flere artikler eller URL-er om samme mediesituasjon. Start enkelt og oppgrader saken hvis den bør følges opp videre.",
  },
  bundles: {
    label: "Flere saker",
    title: "Kjøp flere saker uten abonnement.",
    text: "Sakspakker passer når du har flere mediesaker, men ikke trenger løpende proff-abonnement. Hver inkluderte sak starter som rapportpakke.",
  },
  monthly: {
    label: "Abonnement",
    title: "For deg som jobber løpende med mediesaker.",
    text: "Proff-abonnement passer for advokater, rådgivere, organisasjoner, byråer og redaksjoner som vurderer flere saker hver måned.",
  },
} as const;

export default function PriserPage() {
  const [activeTab, setActiveTab] = useState<PricingTab>("single");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Link
          href="/"
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          ← Tilbake til forsiden
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Priser
            </p>

            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
              Velg hvordan du vil bruke PresseSjekk.
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700 sm:text-xl sm:leading-9">
              Start med én sak, kjøp flere saker som pakke, eller velg
              proff-abonnement for løpende arbeid.
            </p>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Viktig
            </p>
            <h2 className="mt-3 text-2xl font-black text-slate-950">
              Én sak kan ha flere artikler.
            </h2>
            <p className="mt-3 leading-7 text-slate-700">
              En sak kan inneholde flere URL-er, oppfølgingssaker og artikler om
              samme mediesituasjon.
            </p>
          </aside>
        </div>

        <section className="sticky top-0 z-20 -mx-4 mt-8 border-y border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-3xl sm:border sm:px-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {(["single", "bundles", "monthly"] as PricingTab[]).map((tab) => (
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
                {tabInfo[tab].label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            {tabInfo[activeTab].label}
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            {tabInfo[activeTab].title}
          </h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-700">
            {tabInfo[activeTab].text}
          </p>
        </section>

        {activeTab === "single" ? (
          <section className="mt-8 grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
            {singlePackages.map((plan) => (
              <article
                key={plan.id}
                className={`flex h-full flex-col rounded-3xl border p-6 shadow-sm ${
                  plan.id === "investigation_pack"
                    ? "border-amber-300 bg-amber-50"
                    : plan.id === "full_pack"
                      ? "border-cyan-300 bg-cyan-50"
                      : "border-slate-200 bg-white"
                }`}
              >
                <p className="inline-flex w-fit rounded-full bg-cyan-100 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-cyan-800">
                  {plan.tag}
                </p>

                <h3 className="mt-5 text-2xl font-black text-slate-950">
                  {plan.name}
                </h3>

                <p className="mt-3 text-4xl font-black text-slate-950">
                  {plan.price}
                </p>

                <p className="mt-4 leading-8 text-slate-700">
                  {plan.description}
                </p>

                <ul className="mb-8 mt-6 grid flex-1 content-start gap-3 text-sm font-medium text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="text-cyan-700">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={
                    plan.id === "investigation_pack"
                      ? "/kontakt"
                      : `/min-side/saker/ny?package=${plan.id}`
                  }
                  className="mt-auto block rounded-xl bg-cyan-500 px-5 py-4 text-center font-black text-slate-950 hover:bg-cyan-400"
                >
                  {plan.button}
                </Link>
              </article>
            ))}
          </section>
        ) : null}

        {activeTab === "bundles" ? (
          <section className="mt-8 grid gap-6 md:grid-cols-3">
            {caseBundles.map((bundle) => (
              <article
                key={bundle.name}
                className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="inline-flex w-fit rounded-full bg-cyan-100 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-cyan-800">
                  {bundle.tag}
                </p>

                <h3 className="mt-5 text-3xl font-black text-slate-950">
                  {bundle.name}
                </h3>

                <p className="mt-3 text-4xl font-black text-slate-950">
                  {bundle.price}
                </p>

                <p className="mt-2 text-sm font-black text-cyan-800">
                  {bundle.perCase}
                </p>

                <p className="mt-4 leading-8 text-slate-700">
                  {bundle.description}
                </p>

                <ul className="mb-8 mt-6 grid flex-1 content-start gap-3 text-sm font-medium text-slate-700">
                  {bundle.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="text-cyan-700">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={bundle.href}
                  className="mt-auto block rounded-xl border border-slate-300 bg-white px-5 py-4 text-center font-black text-slate-950 hover:bg-slate-100"
                >
                  {bundle.button}
                </Link>
              </article>
            ))}
          </section>
        ) : null}

        {activeTab === "monthly" ? (
          <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {monthlyPackages.map((plan) => (
              <article
                key={plan.id}
                className={`flex h-full flex-col rounded-3xl border p-6 shadow-sm ${
                  plan.id === "monthly_pro"
                    ? "border-cyan-300 bg-cyan-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <p className="inline-flex w-fit rounded-full bg-cyan-100 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-cyan-800">
                  {plan.tag}
                </p>

                <h3 className="mt-5 text-2xl font-black text-slate-950">
                  {plan.name}
                </h3>

                <p className="mt-3 text-3xl font-black text-slate-950">
                  {plan.price}
                </p>

                <p className="mt-4 leading-8 text-slate-700">
                  {plan.description}
                </p>

                <ul className="mb-8 mt-6 grid flex-1 content-start gap-3 text-sm font-medium text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="text-cyan-700">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={
                    plan.id === "monthly_enterprise"
                      ? "/kontakt"
                      : `/min-side/pakker/kjop?plan=${plan.id}`
                  }
                  className="mt-auto block rounded-xl bg-slate-950 px-5 py-4 text-center font-black text-white hover:bg-slate-800"
                >
                  {plan.id === "monthly_enterprise"
                    ? "Be om tilbud"
                    : plan.id === "monthly_start"
                      ? "Start abonnement"
                      : plan.id === "monthly_pro"
                        ? "Start Pro"
                        : "Start Byrå"}
                </Link>
              </article>
            ))}
          </section>
        ) : null}

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Klar til å starte?
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Start med én sak.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-700">
            Du kan begynne med enkeltkjøp per sak, kjøpe en sakspakke eller
            starte proff-abonnement når løsningen er klar.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/min-side/saker/ny"
              className="rounded-xl bg-cyan-500 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-400"
            >
              Start sak
            </Link>
            <Link
              href="/kontakt"
              className="rounded-xl border border-slate-300 px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
            >
              Kom i gang
            </Link>
          </div>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}

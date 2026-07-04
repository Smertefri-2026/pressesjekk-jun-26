"use client";

import Link from "next/link";
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter, useSearchParams } from "next/navigation";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { allPackagePlans, type PackagePlan, type PackagePlanId } from "@/data/packagePlans";
import { supabase } from "@/lib/supabase/client";
import { StripePaymentElementBox } from "@/components/checkout/StripePaymentElementBox";

type ProfileRow = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role_type: string | null;
  organization_name: string | null;
  organization_number: string | null;
  billing_email: string | null;
};

type AuthMode = "login" | "signup";

const roleOptions = [
  { value: "private_person", label: "Privatperson" },
  { value: "advisor", label: "Rådgiver" },
  { value: "lawyer", label: "Advokat" },
  { value: "journalist", label: "Journalist/redaksjon" },
  { value: "organization", label: "Organisasjon/bedrift" },
];

const checkoutPlanIds: PackagePlanId[] = [
  "report_pack",
  "pfu_pack",
  "full_pack",
  "case_bundle_3",
  "case_bundle_5",
  "case_bundle_10",
  "monthly_start",
  "monthly_pro",
  "monthly_agency",
];

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

const paymentElementPlanIds: PackagePlanId[] = [
  "report_pack",
  "pfu_pack",
  "full_pack",
  "case_bundle_3",
  "case_bundle_5",
  "case_bundle_10",
];

const checkoutPlans = allPackagePlans.filter((plan) =>
  checkoutPlanIds.includes(plan.id)
);

const planAmounts: Record<PackagePlanId, number> = {
  report_pack: 49000,
  pfu_pack: 149000,
  full_pack: 299000,
  investigation_pack: 10000000,
  case_bundle_3: 139000,
  case_bundle_5: 219000,
  case_bundle_10: 399000,
  monthly_start: 129000,
  monthly_pro: 499000,
  monthly_agency: 1499000,
  monthly_enterprise: 0,
};

function isPackagePlanId(value: string | null): value is PackagePlanId {
  return Boolean(value && checkoutPlans.some((plan) => plan.id === value));
}

function formatKrFromOre(amount: number) {
  return new Intl.NumberFormat("nb-NO").format(Math.round(amount / 100));
}

function planTypeTitle(type: PackagePlan["type"]) {
  if (type === "bundle") return "Sakspakke";
  if (type === "monthly") return "Abonnement";
  return "Enkeltkjøp";
}

function roleLabel(roleType: string | null) {
  if (roleType === "advisor") return "Rådgiver";
  if (roleType === "lawyer") return "Advokat";
  if (roleType === "journalist") return "Journalist/redaksjon";
  if (roleType === "organization") return "Organisasjon/bedrift";
  return "Privatperson";
}

function UtsjekkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPlan = searchParams.get("plan");
  const incomingUrl = searchParams.get("url") ?? "";

  const [selectedPlanId, setSelectedPlanId] = useState<PackagePlanId>(
    isPackagePlanId(initialPlan) ? initialPlan : "report_pack"
  );
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [authFullName, setAuthFullName] = useState("");
  const [authRoleType, setAuthRoleType] = useState("private_person");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authShowPassword, setAuthShowPassword] = useState(false);
  const [authIsLoading, setAuthIsLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authErrorMessage, setAuthErrorMessage] = useState("");

  const [clientSecret, setClientSecret] = useState("");
  const [paymentErrorMessage, setPaymentErrorMessage] = useState("");
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);

  const selectedPlan =
    checkoutPlans.find((plan) => plan.id === selectedPlanId) ??
    checkoutPlans[0];

  const amount = planAmounts[selectedPlan.id];
  const isMonthly = selectedPlan.type === "monthly";
  const canUsePaymentElement = paymentElementPlanIds.includes(selectedPlan.id);
  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/min-side?payment=success`
      : "/min-side?payment=success";
  const nextPath = `/utsjekk?plan=${selectedPlan.id}${
    incomingUrl ? `&url=${encodeURIComponent(incomingUrl)}` : ""
  }`;

  const loadUserAndProfile = useCallback(async () => {
    setIsCheckingUser(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setUserEmail("");
      setIsCheckingUser(false);
      return;
    }

    setUserEmail(user.email ?? "");

    const { data } = await supabase
      .from("profiles")
      .select(
        "id,full_name,first_name,last_name,email,phone,role_type,organization_name,organization_number,billing_email"
      )
      .eq("id", user.id)
      .maybeSingle();

    setProfile((data as ProfileRow | null) ?? null);
    setIsCheckingUser(false);
  }, []);

  useEffect(() => {
    loadUserAndProfile();
  }, [loadUserAndProfile]);

  useEffect(() => {
    async function createPaymentIntent() {
      setClientSecret("");
      setPaymentErrorMessage("");

      if (!userEmail || !canUsePaymentElement) {
        return;
      }

      if (!stripePromise) {
        setPaymentErrorMessage(
          "Stripe publishable key mangler. Legg inn NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY."
        );
        return;
      }

      setIsPreparingPayment(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setPaymentErrorMessage("Du må være innlogget før betaling.");
          return;
        }

        const response = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            packageId: selectedPlan.id,
            url: incomingUrl,
          }),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          setPaymentErrorMessage(
            payload?.error ?? "Kunne ikke klargjøre betaling."
          );
          return;
        }

        if (!payload?.clientSecret) {
          setPaymentErrorMessage("Stripe svarte ikke med betalingsnøkkel.");
          return;
        }

        setClientSecret(payload.clientSecret);
      } catch (error) {
        setPaymentErrorMessage(
          error instanceof Error
            ? error.message
            : "Kunne ikke klargjøre betaling."
        );
      } finally {
        setIsPreparingPayment(false);
      }
    }

    createPaymentIntent();
  }, [canUsePaymentElement, incomingUrl, selectedPlan.id, userEmail]);

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setAuthIsLoading(true);
    setAuthMessage("");
    setAuthErrorMessage("");

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            data: {
              full_name: authFullName.trim(),
              role_type: authRoleType,
            },
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}${nextPath}`
                : undefined,
          },
        });

        if (error) {
          setAuthErrorMessage(error.message);
          return;
        }

        if (data.session) {
          setAuthMessage("Kontoen er opprettet. Du kan fortsette til betaling.");
          setAuthPassword("");
          await loadUserAndProfile();
          return;
        }

        setAuthMessage(
          "Kontoen er opprettet. Sjekk e-posten din og bekreft kontoen før du fortsetter til betaling."
        );
        setAuthPassword("");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });

      if (error) {
        setAuthErrorMessage(error.message);
        return;
      }

      setAuthMessage("Du er logget inn. Du kan fortsette til betaling.");
      setAuthPassword("");
      await loadUserAndProfile();
    } finally {
      setAuthIsLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setUserEmail("");
    setAuthMessage("Du er logget ut.");
    setAuthErrorMessage("");
  }

  function handlePlanChange(value: string) {
    if (!isPackagePlanId(value)) return;

    setSelectedPlanId(value);

    const params = new URLSearchParams(searchParams.toString());
    params.set("plan", value);

    router.replace(`/utsjekk?${params.toString()}`, { scroll: false });
  }

  return (
    <main className="min-h-screen bg-stone-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Link
          href="/priser"
          className="text-sm font-semibold text-orange-700 hover:text-orange-900"
        >
          ← Tilbake til priser
        </Link>

        <div className="mt-8">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-orange-700">
            Utsjekk
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
            Velg pakke, bekreft konto og betal.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
            Kjøpet knyttes til Min Side, slik at du kan lagre saken, laste ned
            rapporter og bygge videre med dokumentasjon senere.
          </p>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1fr_1.05fr_0.95fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-700">
              1. Din pakke
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Velg produkt
            </h2>

            <label
              htmlFor="checkout-plan"
              className="mt-6 block text-sm font-bold text-slate-800"
            >
              Pakke
            </label>

            <select
              id="checkout-plan"
              value={selectedPlan.id}
              onChange={(event) => handlePlanChange(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-stone-50 px-4 py-4 text-base font-bold text-slate-950 outline-none focus:border-orange-500 focus:bg-white"
            >
              <optgroup label="Enkeltkjøp">
                {checkoutPlans
                  .filter((plan) => plan.type === "single")
                  .map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} – {plan.price}
                    </option>
                  ))}
              </optgroup>

              <optgroup label="Sakspakker">
                {checkoutPlans
                  .filter((plan) => plan.type === "bundle")
                  .map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} – {plan.price}
                    </option>
                  ))}
              </optgroup>

              <optgroup label="Abonnement">
                {checkoutPlans
                  .filter((plan) => plan.type === "monthly")
                  .map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} – {plan.price}
                    </option>
                  ))}
              </optgroup>
            </select>

            <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-amber-800">
                {planTypeTitle(selectedPlan.type)}
              </p>

              <h3 className="mt-4 text-3xl font-black text-slate-950">
                {selectedPlan.name}
              </h3>

              <p className="mt-2 text-2xl font-black text-slate-950">
                {selectedPlan.price}
              </p>

              <p className="mt-4 leading-7 text-slate-700">
                {selectedPlan.description}
              </p>

              <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                {selectedPlan.features.slice(0, 5).map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="font-black text-orange-700">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {incomingUrl ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-stone-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  URL fra rask sjekk
                </p>
                <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                  {incomingUrl}
                </p>
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-700">
              2. Konto for Min Side
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Kontakt og tilgang
            </h2>

            <p className="mt-4 leading-8 text-slate-700">
              Vi bruker eksisterende profilfelt. Konto trengs fordi pakken skal
              lagres på Min Side og knyttes til rapporter, saker og betaling.
            </p>

            {isCheckingUser ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-stone-50 p-5">
                <p className="font-bold text-slate-700">
                  Sjekker innlogging...
                </p>
              </div>
            ) : profile || userEmail ? (
              <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-5">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-green-800">
                  Innlogget
                </p>

                <h3 className="mt-3 text-2xl font-black text-slate-950">
                  {profile?.full_name ||
                    [profile?.first_name, profile?.last_name]
                      .filter(Boolean)
                      .join(" ") ||
                    "Navn ikke satt"}
                </h3>

                <div className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                  <p>
                    <span className="font-bold">E-post:</span>{" "}
                    {userEmail || profile?.email || "Ikke funnet"}
                  </p>
                  <p>
                    <span className="font-bold">Mobil:</span>{" "}
                    {profile?.phone || "Kan fylles ut senere"}
                  </p>
                  <p>
                    <span className="font-bold">Rolle:</span>{" "}
                    {roleLabel(profile?.role_type ?? null)}
                  </p>
                  {profile?.organization_name ? (
                    <p>
                      <span className="font-bold">Virksomhet:</span>{" "}
                      {profile.organization_name}
                    </p>
                  ) : null}
                  {profile?.billing_email ? (
                    <p>
                      <span className="font-bold">Fakturaepost:</span>{" "}
                      {profile.billing_email}
                    </p>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/min-side/profil"
                    className="rounded-xl border border-green-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-green-100"
                  >
                    Endre profil
                  </Link>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-stone-100"
                  >
                    Logg ut
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-800">
                  Konto kreves før betaling
                </p>

                <h3 className="mt-3 text-2xl font-black text-slate-950">
                  Opprett konto eller logg inn her
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Dette gjør at pakken lagres trygt på Min Side etter betaling.
                  Du kan fylle ut mer profilinformasjon senere.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-white/70 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthMessage("");
                      setAuthErrorMessage("");
                    }}
                    className={`rounded-xl px-4 py-3 text-sm font-black ${
                      authMode === "signup"
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    Opprett konto
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthMessage("");
                      setAuthErrorMessage("");
                    }}
                    className={`rounded-xl px-4 py-3 text-sm font-black ${
                      authMode === "login"
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    Logg inn
                  </button>
                </div>

                <form onSubmit={handleAuthSubmit} className="mt-5 grid gap-4">
                  {authMode === "signup" ? (
                    <>
                      <div>
                        <label
                          htmlFor="checkout-full-name"
                          className="text-sm font-bold text-slate-800"
                        >
                          Navn
                        </label>
                        <input
                          id="checkout-full-name"
                          type="text"
                          autoComplete="name"
                          value={authFullName}
                          onChange={(event) =>
                            setAuthFullName(event.target.value)
                          }
                          placeholder="Ditt navn"
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-950 outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="checkout-role-type"
                          className="text-sm font-bold text-slate-800"
                        >
                          Rolle
                        </label>
                        <select
                          id="checkout-role-type"
                          value={authRoleType}
                          onChange={(event) =>
                            setAuthRoleType(event.target.value)
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-950 outline-none focus:border-orange-500"
                        >
                          {roleOptions.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : null}

                  <div>
                    <label
                      htmlFor="checkout-email"
                      className="text-sm font-bold text-slate-800"
                    >
                      E-post
                    </label>
                    <input
                      id="checkout-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={authEmail}
                      onChange={(event) => setAuthEmail(event.target.value)}
                      placeholder="din@epost.no"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-950 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-password"
                      className="text-sm font-bold text-slate-800"
                    >
                      Passord
                    </label>

                    <div className="relative mt-2">
                      <input
                        id="checkout-password"
                        type={authShowPassword ? "text" : "password"}
                        autoComplete={
                          authMode === "login"
                            ? "current-password"
                            : "new-password"
                        }
                        required
                        minLength={6}
                        value={authPassword}
                        onChange={(event) =>
                          setAuthPassword(event.target.value)
                        }
                        placeholder="Minimum 6 tegn"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 pr-16 text-slate-950 outline-none focus:border-orange-500"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setAuthShowPassword((value) => !value)
                        }
                        className="absolute inset-y-0 right-3 my-auto flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-stone-100 hover:text-slate-950"
                        aria-label={
                          authShowPassword ? "Skjul passord" : "Vis passord"
                        }
                        title={
                          authShowPassword ? "Skjul passord" : "Vis passord"
                        }
                      >
                        {authShowPassword ? "Skjul" : "Vis"}
                      </button>
                    </div>
                  </div>

                  {authErrorMessage ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
                      {authErrorMessage}
                    </div>
                  ) : null}

                  {authMessage ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800">
                      {authMessage}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={authIsLoading}
                    className="rounded-2xl bg-amber-500 px-6 py-4 font-black text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {authIsLoading
                      ? "Jobber..."
                      : authMode === "login"
                        ? "Logg inn og fortsett"
                        : "Opprett konto og fortsett"}
                  </button>
                </form>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-stone-50 p-4 text-sm leading-7 text-slate-600">
              Etter betaling får du pakken som ledig sak eller tilgang på Min
              Side. Der kan du opprette saken, legge til flere URL-er og bygge
              rapporten videre.
            </div>
          </section>

          <aside className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-5 text-slate-950 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-700">
              3. Betaling
            </p>

            <h2 className="mt-3 text-3xl font-black">Ordresammendrag</h2>

            <div className="mt-6 rounded-3xl border border-amber-200 bg-white p-5">
              <div className="flex justify-between gap-4 text-sm font-bold text-slate-700">
                <span>{selectedPlan.name}</span>
                <span>
                  {formatKrFromOre(amount)} kr{isMonthly ? "/mnd" : ""}
                </span>
              </div>

              <div className="mt-4 border-t border-amber-200 pt-4">
                <div className="flex justify-between gap-4 text-xl font-black">
                  <span>Å betale nå</span>
                  <span>
                    {formatKrFromOre(amount)} kr{isMonthly ? "/mnd" : ""}
                  </span>
                </div>
              </div>
            </div>

            {!userEmail ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-100 p-4 text-sm font-semibold leading-7 text-slate-700">
                Opprett konto eller logg inn i midtfeltet før betaling.
              </div>
            ) : isMonthly ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-100 p-4 text-sm leading-7 text-slate-700">
                Abonnement kobles i neste steg med Stripe subscription-flyt.
                For abonnement bruker vi kort først.
              </div>
            ) : paymentErrorMessage ? (
              <div className="mt-5 rounded-2xl border border-red-300/30 bg-amber-500/10 p-4 text-sm font-semibold leading-7 text-orange-100">
                {paymentErrorMessage}
              </div>
            ) : isPreparingPayment ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-white p-4 text-sm font-semibold leading-7 text-slate-700">
                Klargjør sikkert betalingsfelt...
              </div>
            ) : clientSecret && stripePromise ? (
              <Elements
                key={clientSecret}
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                  },
                }}
              >
                <StripePaymentElementBox returnUrl={returnUrl} />
              </Elements>
            ) : (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-white p-4 text-sm font-semibold leading-7 text-slate-700">
                Betalingsfeltet vises når pakken er valgt og konto er bekreftet.
              </div>
            )}

            <p className="mt-4 text-xs leading-6 text-slate-500">
              PresseSjekk lagrer ikke kortinformasjon. Betalingsopplysninger
              håndteres av Stripe.
            </p>
          </aside>
        </div>
      </section>

      <LightPublicFooter />
    </main>
  );
}

export default function UtsjekkPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-50 text-slate-950">
          <LightPublicHeader />
          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-lg font-bold text-slate-700">
                Laster utsjekk...
              </p>
            </div>
          </section>
          <LightPublicFooter />
        </main>
      }
    >
      <UtsjekkContent />
    </Suspense>
  );
}

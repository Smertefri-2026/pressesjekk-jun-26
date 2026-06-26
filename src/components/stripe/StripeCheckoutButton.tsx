"use client";

import { useState } from "react";
import type { PackagePlanId } from "@/data/packagePlans";
import { supabase } from "@/lib/supabase/client";

type StripeCheckoutButtonProps = {
  packageId: PackagePlanId;
  caseId?: string;
  children: string;
  className?: string;
};

export function StripeCheckoutButton({
  packageId,
  caseId,
  children,
  className,
}: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCheckout() {
    setIsLoading(true);
    setErrorMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      window.location.href = "/login";
      return;
    }

    const response = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        packageId,
        caseId: caseId || "",
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      setErrorMessage(data.error || "Kunne ikke starte betaling.");
      setIsLoading(false);
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isLoading}
        className={
          className ||
          "rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {isLoading ? "Sender til betaling..." : children}
      </button>

      {errorMessage ? (
        <p className="mt-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

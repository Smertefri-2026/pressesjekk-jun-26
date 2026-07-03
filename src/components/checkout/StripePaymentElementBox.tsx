"use client";

import { FormEvent, useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

type StripePaymentElementBoxProps = {
  returnUrl: string;
};

export function StripePaymentElementBox({
  returnUrl,
}: StripePaymentElementBoxProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [isPaying, setIsPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage("Betalingsfeltet er ikke klart ennå. Prøv igjen om litt.");
      return;
    }

    setIsPaying(true);
    setErrorMessage("");

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: "if_required",
    });

    if (result.error) {
      setErrorMessage(
        result.error.message ?? "Betalingen kunne ikke fullføres."
      );
      setIsPaying(false);
      return;
    }

    if (result.paymentIntent?.status === "succeeded") {
      window.location.href = returnUrl;
      return;
    }

    setIsPaying(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5">
      <div className="rounded-2xl bg-white p-4 text-slate-950">
        <PaymentElement />
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || !elements || isPaying}
        className="mt-5 w-full rounded-xl bg-red-500 px-5 py-4 text-center font-black text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPaying ? "Fullfører betaling ..." : "Betal nå"}
      </button>
    </form>
  );
}

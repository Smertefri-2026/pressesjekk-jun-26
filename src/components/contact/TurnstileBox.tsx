"use client";

import Script from "next/script";
import { useEffect, useId } from "react";

type TurnstileBoxProps = {
  onVerify?: (token: string) => void;
  onExpire?: () => void;
};

declare global {
  interface Window {
    [key: `turnstileCallback_${string}`]: ((token: string) => void) | undefined;
    [key: `turnstileExpireCallback_${string}`]: (() => void) | undefined;
  }
}

export function TurnstileBox({ onVerify, onExpire }: TurnstileBoxProps = {}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const rawId = useId();
  const callbackId = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const verifyCallbackName = `turnstileCallback_${callbackId}` as const;
  const expireCallbackName = `turnstileExpireCallback_${callbackId}` as const;

  useEffect(() => {
    window[verifyCallbackName] = (token: string) => onVerify?.(token);
    window[expireCallbackName] = () => onExpire?.();

    return () => {
      delete window[verifyCallbackName];
      delete window[expireCallbackName];
    };
  }, [verifyCallbackName, expireCallbackName, onVerify, onExpire]);

  if (!siteKey) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
        Turnstile site key mangler. Legg NEXT_PUBLIC_TURNSTILE_SITE_KEY i
        .env.local og start dev-serveren på nytt.
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
      <p className="mb-3 text-sm font-bold text-slate-700">
        Bekreft at du er et menneske
      </p>

      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />

      <div className="w-full max-w-full overflow-hidden">
        <div
          className="cf-turnstile"
          data-sitekey={siteKey}
          data-theme="light"
          data-size="compact"
          data-callback={verifyCallbackName}
          data-expired-callback={expireCallbackName}
        />
      </div>
    </div>
  );
}

"use client";

import Script from "next/script";

export function TurnstileBox() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
        Turnstile site key mangler. Legg NEXT_PUBLIC_TURNSTILE_SITE_KEY i
        .env.local og start dev-serveren på nytt.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 text-sm font-bold text-slate-700">
        Bekreft at du er et menneske
      </p>

      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />

      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-theme="light"
      />
    </div>
  );
}

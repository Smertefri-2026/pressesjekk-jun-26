"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const roleOptions = [
  { value: "reader", label: "Leser – rask sjekk" },
  { value: "mentioned", label: "Jeg er omtalt i saken" },
  { value: "family", label: "Jeg er pårørende" },
  { value: "company", label: "Bedrift / organisasjon" },
  { value: "pro", label: "Advokat / PR / redaksjon" },
];

type QuickCheck = {
  id: string;
  url: string;
  normalized_url: string;
  role: string;
  check_count: number | null;
  last_checked_at: string | null;
  created_at: string | null;
  ai_status: string | null;
  ai_summary: string | null;
  ai_ethics_points: string[] | null;
  ai_legal_points: string[] | null;
  ai_missing_context: string[] | null;
  ai_recommendation: string | null;
  ai_generated_at: string | null;
};

function getSearchParam(name: string) {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  return params.get(name) ?? "";
}

function normalizeUrl(value: string) {
  return value.trim();
}

function getDomain(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "Ukjent kilde";
  }
}

function toPointList(value: string[] | null | undefined) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter((item) => item.trim().length > 0);
}

export function QuickCheckBox() {
  const [url, setUrl] = useState("");
  const [role, setRole] = useState("reader");
  const [quickCheck, setQuickCheck] = useState<QuickCheck | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [quickError, setQuickError] = useState("");

  useEffect(() => {
    const incomingUrl = getSearchParam("url");
    const incomingRole = getSearchParam("role");
    const quick = getSearchParam("quick");

    if (incomingUrl) {
      setUrl(incomingUrl);
    }

    if (incomingRole) {
      setRole(incomingRole);
    }

    if (quick === "1" && incomingUrl) {
      const startRole =
        incomingRole === "reader" || !incomingRole ? "reader" : incomingRole;

      if (startRole === "reader") {
        registerQuickCheck(incomingUrl, "reader");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quickDomain = useMemo(
    () => getDomain(quickCheck?.url ?? ""),
    [quickCheck?.url]
  );
  const encodedQuickUrl = encodeURIComponent(quickCheck?.url ?? "");

  const ethicsPoints = toPointList(quickCheck?.ai_ethics_points);
  const legalPoints = toPointList(quickCheck?.ai_legal_points);
  const missingPoints = toPointList(quickCheck?.ai_missing_context);

  async function registerQuickCheck(targetUrl: string, targetRole: string) {
    setIsChecking(true);
    setQuickError("");

    try {
      const response = await fetch("/api/quick-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: targetUrl,
          role: targetRole,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setQuickError(
          payload?.error ??
            "Kunne ikke kjøre rask sjekk akkurat nå. Prøv igjen om litt."
        );
        return false;
      }

      if (!payload?.quickCheck) {
        setQuickError("Fikk uventet svar fra rask sjekk. Prøv igjen om litt.");
        return false;
      }

      setQuickCheck(payload.quickCheck as QuickCheck);
      return true;
    } catch (error) {
      setQuickError(
        error instanceof Error
          ? error.message
          : "Kunne ikke kjøre rask sjekk akkurat nå. Prøv igjen om litt."
      );
      return false;
    } finally {
      setIsChecking(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedUrl = normalizeUrl(url);

    if (!trimmedUrl) return;

    const encodedUrl = encodeURIComponent(trimmedUrl);

    if (role === "reader") {
      await registerQuickCheck(trimmedUrl, "reader");
      return;
    }

    if (role === "pro") {
      window.location.href = `/proff?url=${encodedUrl}`;
      return;
    }

    window.location.href = `/min-side/saker/ny?url=${encodedUrl}&role=${encodeURIComponent(
      role
    )}`;
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-2xl bg-white p-5 shadow-sm"
      >
        <label
          htmlFor="quick-check-url"
          className="text-sm font-semibold text-slate-600"
        >
          Artikkel-URL
        </label>

        <input
          id="quick-check-url"
          name="url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://avis.no/artikkel/..."
          className="mt-3 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-950 outline-none focus:border-blue-500"
        />

        <label
          htmlFor="quick-check-role"
          className="mt-4 block text-sm font-semibold text-slate-600"
        >
          Hvem sjekker saken?
        </label>

        <select
          id="quick-check-role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="mt-3 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-950 outline-none focus:border-blue-500"
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={isChecking}
          className="mt-4 block w-full rounded-xl bg-blue-500 px-5 py-4 text-center font-black text-slate-950 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isChecking
            ? "Sjekker..."
            : role === "reader"
              ? "Kjør rask sjekk"
              : "Gå videre til sak"}
        </button>

        {role === "reader" ? (
          <p className="mt-3 text-xs leading-6 text-slate-500">
            KI-raskrapporten kan ta opptil 2 minutter. Ikke oppdater siden mens
            den lages.
          </p>
        ) : null}
      </form>

      {quickError ? (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold leading-6 text-red-800"
        >
          {quickError}
        </div>
      ) : null}

      {isChecking ? (
        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm font-semibold leading-6 text-blue-900">
          Kjører rask sjekk... Dette kan ta opptil 2 minutter. Ikke oppdater
          siden mens raskrapporten lages.
        </div>
      ) : null}

      {!isChecking && quickCheck ? (
        <section className="mt-5 rounded-3xl border border-blue-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-800">
            Raskrapport
          </p>

          <h3 className="mt-3 text-2xl font-black text-slate-950">
            Foreløpig lesersjekk
          </h3>

          <p className="mt-3 text-sm leading-7 text-slate-700">
            Dette er en enkel offentlig forhåndsvisning uten innlogging. Den
            viser hva som bør sjekkes videre, men konkluderer ikke.
          </p>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Artikkel
            </p>
            <p className="mt-2 break-words text-sm font-bold text-slate-950">
              {quickCheck.url}
            </p>
            <p className="mt-2 text-sm font-semibold text-blue-800">
              Kilde: {quickDomain}
            </p>

            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-black text-slate-950">
                {quickCheck.check_count === null
                  ? "Søketeller lastes..."
                  : `Denne artikkelen er sjekket ${quickCheck.check_count} ${
                      quickCheck.check_count === 1 ? "gang" : "ganger"
                    }.`}
              </p>
              {quickCheck.last_checked_at ? (
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  Sist sjekket:{" "}
                  {new Intl.DateTimeFormat("nb-NO", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(String(quickCheck.last_checked_at)))}
                </p>
              ) : null}
            </div>
          </div>

          {quickCheck.ai_status === "failed" ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
              KI-raskrapporten kunne ikke genereres akkurat nå, men søket er
              registrert. Du kan prøve igjen senere eller opprette en lagret
              sak.
            </div>
          ) : null}

          {quickCheck.ai_summary ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Kort vurdering
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-800">
                {quickCheck.ai_summary}
              </p>
            </div>
          ) : null}

          {ethicsPoints.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-black text-slate-950">
                Mulige presseetiske sjekkpunkter
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                {ethicsPoints.map((item, index) => (
                  <li key={`ethics-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {legalPoints.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-black text-slate-950">
                Mulige rettslige rammer
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                {legalPoints.map((item, index) => (
                  <li key={`legal-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {missingPoints.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="font-black text-slate-950">
                Dette mangler før en reell vurdering
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                {missingPoints.map((item, index) => (
                  <li key={`missing-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {quickCheck.ai_recommendation ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-black text-slate-950">Anbefalt neste steg</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {quickCheck.ai_recommendation}
              </p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href={`/min-side/saker/ny?url=${encodedQuickUrl}&role=mentioned`}
              className="rounded-xl bg-slate-950 px-5 py-4 text-center font-black text-white hover:bg-slate-800"
            >
              Opprett lagret sak
            </Link>

            <Link
              href="/priser"
              className="rounded-xl border border-slate-300 bg-white px-5 py-4 text-center font-black text-slate-950 hover:bg-slate-100"
            >
              Se pakker
            </Link>
          </div>

          <p className="mt-5 text-xs leading-6 text-slate-500">
            Dette er en enkel offentlig raskrapport. Den konkluderer ikke og
            erstatter ikke advokat, PFU eller redaktøransvar.
          </p>
        </section>
      ) : null}
    </div>
  );
}

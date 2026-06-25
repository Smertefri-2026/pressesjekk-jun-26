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

const quickEthicsPoints = [
  "VVP 4.1 – saklighet og omtanke i innhold og presentasjon",
  "VVP 4.4 – tittel, ingress og henvisninger må ha dekning",
  "VVP 4.7 – varsomhet med identifisering",
  "VVP 4.13 – retting av feilaktige opplysninger",
  "VVP 4.14 – samtidig imøtegåelse ved sterke beskyldninger",
];

const quickLegalPoints = [
  "Grunnloven § 100 – ytringsfrihet og informasjonsfrihet",
  "Grunnloven § 102 – privatliv og personvern",
  "Skadeserstatningsloven § 3-6 a – mulig oppreisning ved ærekrenkelser",
  "Straffeloven kan være relevant i helt særskilte og alvorlige tilfeller",
];

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

export function QuickCheckBox() {
  const [url, setUrl] = useState("");
  const [role, setRole] = useState("reader");
  const [quickResultUrl, setQuickResultUrl] = useState("");
  const [quickRole, setQuickRole] = useState("");
  const [checkCount, setCheckCount] = useState<number | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
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
      setQuickRole(incomingRole);
    }

    if (quick === "1" && incomingUrl) {
      setQuickResultUrl(incomingUrl);

      if (incomingRole === "reader" || !incomingRole) {
        registerQuickCheck(incomingUrl, "reader");
      }
    }
  }, []);

  const quickDomain = useMemo(() => getDomain(quickResultUrl), [quickResultUrl]);
  const encodedQuickUrl = encodeURIComponent(quickResultUrl);

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
        setQuickError(payload?.error ?? "Kunne ikke kjøre rask sjekk.");
        return false;
      }

      setCheckCount(payload.quickCheck?.check_count ?? null);
      setLastCheckedAt(payload.quickCheck?.last_checked_at ?? null);
      return true;
    } catch (error) {
      setQuickError(
        error instanceof Error ? error.message : "Kunne ikke kjøre rask sjekk."
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
      const ok = await registerQuickCheck(trimmedUrl, role);

      if (!ok) return;

      setQuickResultUrl(trimmedUrl);
      setQuickRole("reader");

      window.location.href = `/pressesjekk/raskrapport?url=${encodedUrl}`;

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
          className="mt-3 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-950 outline-none focus:border-cyan-500"
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
          className="mt-3 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-950 outline-none focus:border-cyan-500"
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
          className="mt-4 block w-full rounded-xl bg-cyan-500 px-5 py-4 text-center font-black text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
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

      {false && quickResultUrl && quickRole === "reader" ? (
        <section className="mt-5 rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-800">
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
              {quickResultUrl}
            </p>
            <p className="mt-2 text-sm font-semibold text-cyan-800">
              Kilde: {quickDomain}
            </p>

            <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
              <p className="text-sm font-black text-slate-950">
                {checkCount === null
                  ? "Søketeller lastes..."
                  : `Denne artikkelen er sjekket ${checkCount} ${
                      checkCount === 1 ? "gang" : "ganger"
                    }.`}
              </p>
              {lastCheckedAt ? (
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  Sist sjekket:{" "}
                  {new Intl.DateTimeFormat("nb-NO", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(String(lastCheckedAt)))}
                </p>
              ) : null}
            </div>
          </div>

          {quickError ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              {quickError}
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-black text-slate-950">
              Anbefalt neste steg
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Er du selv omtalt, pårørende eller representerer en virksomhet,
              bør du opprette en lagret sak. Da kan dokumentasjon, tilsvar og
              videre vurderinger samles på Min Side.
            </p>
          </div>

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

          <div className="mt-5 grid gap-3">
            <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer font-black text-slate-950">
                Presseetiske sjekkpunkter
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                En rask lesersjekk kan særlig peke på om artikkelen bør ses
                nærmere på med tanke på tittel, ingress, identifisering, sterke
                beskyldninger, tilsvar og oppdateringsbehov.
              </p>

              <ul className="mt-3 space-y-2 text-xs font-semibold leading-5 text-slate-700">
                {quickEthicsPoints.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </details>

            <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer font-black text-slate-950">
                Mulige rettslige rammer
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                Ytringsfriheten står sterkt, men den må vurderes mot privatliv,
                dokumentasjon, identifisering og mulig skadevirkning.
              </p>

              <ul className="mt-3 space-y-2 text-xs font-semibold leading-5 text-slate-700">
                {quickLegalPoints.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </details>

            <details className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
              <summary className="cursor-pointer font-black text-slate-950">
                Hva hurtigsjekken ikke vet ennå
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                Den kjenner ikke din versjon, e-post fra journalist, svarfrist,
                hva du svarte, dokumentasjon, PFU-historikk eller senere
                utvikling. Derfor kan den ikke konkludere.
              </p>
            </details>
          </div>

          <p className="mt-5 text-xs leading-6 text-slate-500">
            Dette er en enkel offentlig raskrapport. Neste versjon kan kobles
            til en kort KI-basert vurdering uten innlogging.
          </p>
        </section>
      ) : null}
    </div>
  );
}

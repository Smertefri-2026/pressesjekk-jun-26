"use client";

import { useEffect, useState } from "react";

const roleOptions = [
  { value: "reader", label: "Leser – rask sjekk" },
  { value: "mentioned", label: "Jeg er omtalt i saken" },
  { value: "family", label: "Jeg er pårørende" },
  { value: "company", label: "Bedrift / organisasjon" },
  { value: "pro", label: "Advokat / PR / redaksjon" },
];

function getQuickUrlFromSearch() {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  return params.get("url") ?? "";
}

export function QuickCheckBox() {
  const [url, setUrl] = useState("");
  const [role, setRole] = useState("reader");
  const [quickResultUrl, setQuickResultUrl] = useState("");

  useEffect(() => {
    setQuickResultUrl(getQuickUrlFromSearch());
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedUrl = url.trim();

    if (!trimmedUrl) return;

    const encodedUrl = encodeURIComponent(trimmedUrl);

    if (role === "reader") {
      window.location.href = `/pressesjekk?quick=1&role=reader&url=${encodedUrl}`;
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
        className="mt-4 block w-full rounded-xl bg-cyan-500 px-5 py-4 text-center font-black text-slate-950 hover:bg-cyan-400"
      >
        {role === "reader" ? "Kjør rask sjekk" : "Gå videre til sak"}
      </button>

      {quickResultUrl ? (
        <div className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-800">
            Rask lesersjekk
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Denne artikkelen er klar for en enkel offentlig forhåndssjekk:
          </p>
          <p className="mt-2 break-words text-sm font-bold text-slate-950">
            {quickResultUrl}
          </p>
          <p className="mt-3 text-xs leading-6 text-slate-600">
            Neste steg blir å koble dette til en egen søketeller og enkel
            offentlig vurdering uten innlogging.
          </p>
        </div>
      ) : null}
    </form>
  );
}

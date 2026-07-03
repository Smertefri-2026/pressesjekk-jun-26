"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

const roleOptions = [
  { value: "private_person", label: "Privatperson" },
  { value: "advisor", label: "Rådgiver" },
  { value: "lawyer", label: "Advokat" },
  { value: "journalist", label: "Journalist/redaksjon" },
  { value: "organization", label: "Organisasjon/bedrift" },
];

export function AuthForm() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [roleType, setRoleType] = useState("private_person");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role_type: roleType,
            },
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}/login`
                : undefined,
          },
        });

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        setMessage(
          "Kontoen er opprettet. Sjekk e-posten din og bekreft kontoen før du logger inn."
        );
        setPassword("");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      router.push("/min-side");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
          Innlogging
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          {mode === "login" ? "Logg inn på Min Side" : "Opprett konto"}
        </h1>
        <p className="mt-4 leading-8 text-slate-700">
          {mode === "login"
            ? "Logg inn for å se lagrede saker, rapporter og dokumentasjon."
            : "Opprett konto for å kunne lagre PresseSjekk-saker, rapporter og PFU-klager."}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setMessage("");
            setErrorMessage("");
          }}
          className={`rounded-xl px-4 py-3 text-sm font-black ${
            mode === "login"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          Logg inn
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setMessage("");
            setErrorMessage("");
          }}
          className={`rounded-xl px-4 py-3 text-sm font-black ${
            mode === "signup"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          Opprett konto
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
        {mode === "signup" ? (
          <>
            <div>
              <label
                htmlFor="fullName"
                className="text-sm font-bold text-slate-800"
              >
                Navn
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Ditt navn"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="roleType"
                className="text-sm font-bold text-slate-800"
              >
                Rolle
              </label>
              <select
                id="roleType"
                value={roleType}
                onChange={(event) => setRoleType(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Rollen brukes senere for å tilpasse Min Side, rapporter og
                PFU-klage.
              </p>
            </div>
          </>
        ) : null}

        <div>
          <label htmlFor="email" className="text-sm font-bold text-slate-800">
            E-post
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="din@epost.no"
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="text-sm font-bold text-slate-800"
          >
            Passord
          </label>
          <div className="relative mt-2">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 6 tegn"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 pr-16 text-slate-950 outline-none focus:border-red-500 focus:bg-white"
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-3 my-auto flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-950"
              aria-label={showPassword ? "Skjul passord" : "Vis passord"}
              title={showPassword ? "Skjul passord" : "Vis passord"}
            >
              {showPassword ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6A2 2 0 0012 14a2 2 0 001.4-3.4" />
                  <path d="M9.9 4.2A10.8 10.8 0 0112 4c5 0 8.5 4 10 8a14.5 14.5 0 01-3.1 4.8" />
                  <path d="M6.6 6.6A14.3 14.3 0 002 12c1.5 4 5 8 10 8a10.7 10.7 0 004.6-1" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">
            {errorMessage}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading
            ? "Jobber..."
            : mode === "login"
              ? "Logg inn"
              : "Opprett konto"}
        </button>
      </form>
    </div>
  );
}

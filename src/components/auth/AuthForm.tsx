"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

export function AuthForm() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
              full_name: fullName,
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
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
          Innlogging
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          {mode === "login" ? "Logg inn på Min Side" : "Opprett konto"}
        </h1>
        <p className="mt-4 leading-8 text-slate-700">
          {mode === "login"
            ? "Logg inn for å se lagrede saker, rapporter og dokumentasjon."
            : "Opprett konto for å kunne lagre PresseSjekk-saker og komme tilbake senere."}
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
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
            />
          </div>
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
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="text-sm font-bold text-slate-800"
          >
            Passord
          </label>
          <input
            id="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 6 tegn"
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
          />
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

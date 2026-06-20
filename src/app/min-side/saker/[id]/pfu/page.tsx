"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";

type CaseRow = {
  id: string;
  title: string;
  status: "draft" | "in_progress" | "report_ready" | "closed";
  media_name: string | null;
  article_title: string | null;
  article_url: string | null;
  published_date: string | null;
  short_description: string | null;
};

type CaseInputRow = {
  id: string;
  article_text: string | null;
  what_happened: string | null;
  your_role: string | null;
  reply_sent: boolean | null;
  reply_text: string | null;
  editor_response: string | null;
  legal_status: string | null;
  legal_status_details: string | null;
  documentation_summary: string | null;
  desired_outcome: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role_type: string | null;
};

type CaseReportRow = {
  id: string;
  version: number;
  report_type: "free_check" | "full_report" | "pfu_draft";
  pfu_draft: string | null;
  status: "draft" | "ready" | "archived";
  created_at: string;
};

function formatDate(date: string | null) {
  if (!date) return "Ikke satt";

  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function legalStatusLabel(status: string | null) {
  if (!status) return "Ikke satt";
  if (status === "not_relevant") return "Ikke relevant";
  if (status === "unknown") return "Uavklart";
  if (status === "reported") return "Anmeldt";
  if (status === "dismissed") return "Henlagt";
  if (status === "court_case") return "Rettssak";
  if (status === "judgment") return "Dom/avgjørelse";
  if (status === "appeal") return "Klage/anke";
  return status;
}

function roleTypeLabel(roleType: string | null) {
  if (!roleType) return "Ikke satt";
  if (roleType === "private_person") return "Privatperson";
  if (roleType === "advisor") return "Rådgiver";
  if (roleType === "lawyer") return "Advokat";
  if (roleType === "journalist") return "Journalist/redaksjon";
  if (roleType === "organization") return "Organisasjon/bedrift";
  return roleType;
}

export default function PfuDraftPage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [caseItem, setCaseItem] = useState<CaseRow | null>(null);
  const [caseInput, setCaseInput] = useState<CaseInputRow | null>(null);
  const [pfuDrafts, setPfuDrafts] = useState<CaseReportRow[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id,full_name,email,role_type")
        .eq("id", user.id)
        .maybeSingle();

      setProfile((profileData as ProfileRow | null) ?? null);

      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select(
          "id,title,status,media_name,article_title,article_url,published_date,short_description"
        )
        .eq("id", params.id)
        .single();

      if (caseError) {
        setErrorMessage(caseError.message);
        setIsLoading(false);
        return;
      }

      setCaseItem(caseData as CaseRow);

      const { data: inputData, error: inputError } = await supabase
        .from("case_inputs")
        .select(
          "id,article_text,what_happened,your_role,reply_sent,reply_text,editor_response,legal_status,legal_status_details,documentation_summary,desired_outcome"
        )
        .eq("case_id", params.id)
        .maybeSingle();

      if (inputError) {
        setErrorMessage(inputError.message);
        setIsLoading(false);
        return;
      }

      setCaseInput((inputData as CaseInputRow | null) ?? null);

      const { data: reportData, error: reportError } = await supabase
        .from("case_reports")
        .select("id,version,report_type,pfu_draft,status,created_at")
        .eq("case_id", params.id)
        .eq("report_type", "pfu_draft")
        .order("version", { ascending: false });

      if (reportError) {
        setErrorMessage(reportError.message);
        setIsLoading(false);
        return;
      }

      setPfuDrafts((reportData ?? []) as CaseReportRow[]);
      setIsLoading(false);
    }

    if (params.id) {
      loadData();
    }
  }, [params.id]);

  const draftText = useMemo(() => {
    if (!caseItem) return "";

    return `PFU-KLAGEUTKAST

Dette er et foreløpig utkast basert på opplysninger registrert i PresseSjekk. Utkastet må kontrolleres og tilpasses før eventuell innsending.

1. Klager
Navn:
${profile?.full_name || "[Fyll inn navn]"}

E-post:
${profile?.email || user?.email || "[Fyll inn e-post]"}

Profilrolle:
${roleTypeLabel(profile?.role_type ?? null)}

Rolle i saken:
${caseInput?.your_role || "[Fyll inn rolle i denne konkrete saken]"}

2. Innklaget medium
Medium:
${caseItem.media_name || "[Fyll inn mediehus]"}

3. Artikkel / publisering
Artikkeloverskrift:
${caseItem.article_title || caseItem.title}

Publiseringsdato:
${formatDate(caseItem.published_date)}

Lenke:
${caseItem.article_url || "[Fyll inn lenke hvis tilgjengelig]"}

4. Kort beskrivelse av saken
${caseInput?.what_happened || caseItem.short_description || "[Forklar kort hva saken gjelder, hva som er feil, misvisende eller problematisk, og hvorfor saken bør vurderes presseetisk.]"}

5. Tilsvar, kontakt med redaksjonen og samtidig imøtegåelse
Er tilsvar eller henvendelse sendt:
${caseInput?.reply_sent ? "Ja" : "Ikke registrert / nei"}

Tilsvar eller henvendelse:
${caseInput?.reply_text || "[Lim inn eller oppsummer hva som ble sendt til redaksjonen.]"}

Svar fra redaksjonen:
${caseInput?.editor_response || "[Lim inn eller oppsummer redaksjonens svar, hvis det finnes.]"}

6. Rettsstatus
Registrert rettsstatus:
${legalStatusLabel(caseInput?.legal_status ?? null)}

Detaljer:
${caseInput?.legal_status_details || "[Forklar om saken er anmeldt, henlagt, avgjort, påklaget, uavklart eller ikke relevant.]"}

7. Dokumentasjon
${caseInput?.documentation_summary || "[List opp dokumentasjon: e-poster, SMS, vedlegg, skjermbilder, rettsdokumenter, tidligere korrespondanse eller annen relevant dokumentasjon.]"}

8. Hva ønskes oppnådd?
${caseInput?.desired_outcome || "[F.eks. retting, tilsvar, beklagelse, presisering, sletting/avindeksering, PFU-behandling eller annen oppfølging.]"}

9. Foreløpige presseetiske problemstillinger
Basert på de registrerte opplysningene kan følgende temaer være relevante å vurdere videre:

- Om artikkelen gir et korrekt og dekkende bilde av saken.
- Om faktiske opplysninger er tilstrekkelig dokumentert.
- Om den omtalte parten fikk reell mulighet til tilsvar eller samtidig imøtegåelse.
- Om eventuelle feil er rettet tydelig og raskt nok.
- Om omtalen skiller tydelig mellom fakta, påstander og vurderinger.
- Om belastningen for den omtalte står i rimelig forhold til sakens offentlige interesse.

10. Forbehold
Dette er ikke en ferdig PFU-klage, juridisk rådgivning eller endelig presseetisk vurdering. Utkastet bør kvalitetssikres før bruk.`;
  }, [caseItem, caseInput, profile, user]);

  async function handleSavePfuDraft() {
    if (!caseItem) return;

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const nextVersion =
      pfuDrafts.length > 0
        ? Math.max(...pfuDrafts.map((item) => item.version)) + 1
        : 1;

    const { error } = await supabase.from("case_reports").insert({
      case_id: caseItem.id,
      version: nextVersion,
      report_type: "pfu_draft",
      pfu_draft: draftText,
      status: "ready",
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    setSuccessMessage(`PFU-utkast v${nextVersion} er lagret.`);

    setPfuDrafts((current) => [
      {
        id: crypto.randomUUID(),
        version: nextVersion,
        report_type: "pfu_draft",
        pfu_draft: draftText,
        status: "ready",
        created_at: new Date().toISOString(),
      },
      ...current,
    ]);

    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              Laster PFU-utkast...
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href={`/min-side/saker/${params.id}`}
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          ← Tilbake til saken
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              PFU-utkast
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Første PFU-klageutkast.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Dette er en strukturert kladd basert på saken, tilsvar,
              rettsstatus og dokumentasjon. Utkastet bør kontrolleres før
              eventuell bruk.
            </p>

            {user?.email ? (
              <p className="mt-5 text-sm font-semibold text-slate-500">
                Innlogget som:{" "}
                <span className="text-slate-950">{user.email}</span>
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/min-side/saker/${params.id}`}
                className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
              >
                Til saken
              </Link>

              <button
                type="button"
                onClick={handleSavePfuDraft}
                disabled={isSaving}
                className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Lagrer..." : "Lagre PFU-utkast"}
              </button>
            </div>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Sak
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              {caseItem?.title}
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              {caseItem?.media_name ?? "Ukjent medie"} ·{" "}
              {formatDate(caseItem?.published_date ?? null)}
            </p>
          </aside>
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_390px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Kladd
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              PFU-klageutkast
            </h2>

            <pre className="mt-8 whitespace-pre-wrap rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-800 sm:p-7">
              {draftText}
            </pre>

            {errorMessage ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                {successMessage}
              </div>
            ) : null}
          </div>

          <aside className="grid gap-6">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
                Lagrede utkast
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                {pfuDrafts.length} lagret
              </h2>
              <div className="mt-5 grid gap-3">
                {pfuDrafts.length === 0 ? (
                  <p className="leading-8 text-slate-700">
                    Ingen PFU-utkast er lagret ennå.
                  </p>
                ) : (
                  pfuDrafts.map((draft) => (
                    <div
                      key={`${draft.id}-${draft.version}`}
                      className="rounded-2xl border border-amber-200 bg-white/70 p-4"
                    >
                      <p className="font-black text-slate-950">
                        PFU-utkast v{draft.version}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        {formatDate(draft.created_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Neste versjon
              </p>
              <h2 className="mt-3 text-3xl font-black">Bedre PFU-struktur</h2>
              <p className="mt-4 leading-8 text-slate-300">
                Senere kan vi dele kladden inn i egne felt, legge til
                Vær Varsom-punkter og lage eksport til PDF.
              </p>
            </div>
          </aside>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}

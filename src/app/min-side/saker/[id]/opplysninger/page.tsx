"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { CaseWorkflowCard } from "@/components/cases/CaseWorkflowCard";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";

type CaseRow = {
  id: string;
  title: string;
  status: "draft" | "in_progress" | "report_ready" | "closed";
  media_name: string | null;
  article_title: string | null;
};

type CaseReportRow = {
  id: string;
  report_type: "free_check" | "full_report" | "pfu_draft";
};

type PfuDecisionRow = {
  id: string;
  decision_received: boolean | null;
  uploaded_file_name: string | null;
};

type CaseInputRow = {
  id: string;
  case_id: string;
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

const caseRoleOptions = [
  "Omtalt person",
  "Pårørende",
  "Rådgiver",
  "Advokat",
  "Journalist/redaksjon",
  "Bedrift/organisasjon",
  "Leser/publikum",
  "Annet",
];
function statusLabel(status: CaseRow["status"]) {
  if (status === "draft") return "Utkast";
  if (status === "in_progress") return "Under arbeid";
  if (status === "report_ready") return "Rapport klar";
  if (status === "closed") return "Lukket";
  return status;
}

function legalStatusLabel(status: string) {
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


export default function CaseInputsPage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [caseItem, setCaseItem] = useState<CaseRow | null>(null);
  const [caseInputId, setCaseInputId] = useState<string | null>(null);
  const [reports, setReports] = useState<CaseReportRow[]>([]);
  const [pfuDecision, setPfuDecision] = useState<PfuDecisionRow | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingInputs, setIsEditingInputs] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [articleText, setArticleText] = useState("");
  const [whatHappened, setWhatHappened] = useState("");
  const [yourRole, setYourRole] = useState("");
  const [replySent, setReplySent] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editorResponse, setEditorResponse] = useState("");
  const [legalStatus, setLegalStatus] = useState("");
  const [legalStatusDetails, setLegalStatusDetails] = useState("");
  const [documentationSummary, setDocumentationSummary] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");

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

      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("id,title,status,media_name,article_title")
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
          "id,case_id,article_text,what_happened,your_role,reply_sent,reply_text,editor_response,legal_status,legal_status_details,documentation_summary,desired_outcome"
        )
        .eq("case_id", params.id)
        .maybeSingle();

      if (inputError) {
        setErrorMessage(inputError.message);
        setIsLoading(false);
        return;
      }

      if (inputData) {
        const input = inputData as CaseInputRow;

        setCaseInputId(input.id);
        setArticleText(input.article_text ?? "");
        setWhatHappened(input.what_happened ?? "");
        setYourRole(input.your_role ?? "");
        setReplySent(Boolean(input.reply_sent));
        setReplyText(input.reply_text ?? "");
        setEditorResponse(input.editor_response ?? "");
        setLegalStatus(input.legal_status ?? "");
        setLegalStatusDetails(input.legal_status_details ?? "");
        setDocumentationSummary(input.documentation_summary ?? "");
        setDesiredOutcome(input.desired_outcome ?? "");
        setIsEditingInputs(false);
      } else {
        setIsEditingInputs(true);
      }

      const { data: reportsData } = await supabase
        .from("case_reports")
        .select("id,report_type")
        .eq("case_id", params.id);

      setReports((reportsData ?? []) as CaseReportRow[]);

      const { data: pfuDecisionData } = await supabase
        .from("pfu_decisions")
        .select("id,decision_received,uploaded_file_name")
        .eq("case_id", params.id)
        .maybeSingle();

      setPfuDecision((pfuDecisionData as PfuDecisionRow | null) ?? null);

      setIsLoading(false);
    }

    if (params.id) {
      loadData();
    }
  }, [params.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setErrorMessage("Du må være innlogget for å lagre opplysninger.");
      return;
    }

    setIsSaving(true);
    setSaveMessage("");
    setErrorMessage("");

    const payload = {
      case_id: params.id,
      article_text: articleText.trim() || null,
      what_happened: whatHappened.trim() || null,
      your_role: yourRole.trim() || null,
      reply_sent: replySent,
      reply_text: replyText.trim() || null,
      editor_response: editorResponse.trim() || null,
      legal_status: legalStatus.trim() || null,
      legal_status_details: legalStatusDetails.trim() || null,
      documentation_summary: documentationSummary.trim() || null,
      desired_outcome: desiredOutcome.trim() || null,
    };

    if (caseInputId) {
      const { error } = await supabase
        .from("case_inputs")
        .update(payload)
        .eq("id", caseInputId);

      if (error) {
        setErrorMessage(error.message);
        setIsSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("case_inputs")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        setErrorMessage(error.message);
        setIsSaving(false);
        return;
      }

      setCaseInputId(data.id);
    }

    setSaveMessage("Saksopplysningene er lagret.");
    setIsEditingInputs(false);
    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              Laster opplysninger...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (errorMessage && !caseItem) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Link
            href="/min-side"
            className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
          >
            ← Tilbake til Min Side
          </Link>

          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
              Feil
            </p>
            <h1 className="mt-3 text-3xl font-black text-red-950">
              Kunne ikke åpne opplysninger
            </h1>
            <p className="mt-4 leading-8 text-red-800">{errorMessage}</p>
          </div>
        </section>

        <LightPublicFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/min-side"
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          ← Tilbake til Min Side
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Saksopplysninger
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Saksopplysninger
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Samle det viktigste om saken på ett sted. Opplysningene brukes
              som grunnlag for rapport, dokumentasjonsliste og eventuelt
              PFU-klageutkast.
            </p>

            {isEditingInputs ? (
            <form
              onSubmit={handleSubmit}
              className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
            >
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Opplysninger
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Hva bør vurderes?
            </h2>

            <div className="mt-8 grid gap-6">
              <div>
                <label
                  htmlFor="articleText"
                  className="text-sm font-bold text-slate-800"
                >
                  Artikkeltekst eller utdrag
                </label>
                <textarea
                  id="articleText"
                  rows={7}
                  value={articleText}
                  onChange={(event) => setArticleText(event.target.value)}
                  placeholder="Lim inn artikkeltekst eller relevante utdrag her..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="whatHappened"
                  className="text-sm font-bold text-slate-800"
                >
                  Hva skjedde?
                </label>
                <textarea
                  id="whatHappened"
                  rows={5}
                  value={whatHappened}
                  onChange={(event) => setWhatHappened(event.target.value)}
                  placeholder="Forklar kort hva saken handler om, og hva du mener bør undersøkes..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="yourRole"
                  className="text-sm font-bold text-slate-800"
                >
                  Din rolle i saken
                </label>
                <select
                  id="yourRole"
                  value={yourRole}
                  onChange={(event) => setYourRole(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                >
                  <option value="">Velg rolle i saken</option>
                  {yourRole && !caseRoleOptions.includes(yourRole) ? (
                    <option value={yourRole}>{yourRole}</option>
                  ) : null}
                  {caseRoleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Dette gjelder rollen din i denne konkrete saken. Profilrollen
                  din lagres separat på profilsiden.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={replySent}
                    onChange={(event) => setReplySent(event.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />
                  <span>
                    <span className="block font-black text-slate-950">
                      Tilsvar eller svar er sendt til redaksjonen
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">
                      Huk av hvis du har bedt om retting, tilsvar, samtidig
                      imøtegåelse eller sendt annen henvendelse.
                    </span>
                  </span>
                </label>
              </div>

              <div>
                <label
                  htmlFor="replyText"
                  className="text-sm font-bold text-slate-800"
                >
                  Tilsvar eller henvendelse til redaksjonen
                </label>
                <textarea
                  id="replyText"
                  rows={6}
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder="Lim inn eller oppsummer hva du sendte til redaksjonen..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="editorResponse"
                  className="text-sm font-bold text-slate-800"
                >
                  Svar fra redaksjonen
                </label>
                <textarea
                  id="editorResponse"
                  rows={5}
                  value={editorResponse}
                  onChange={(event) => setEditorResponse(event.target.value)}
                  placeholder="Skriv kort hva redaksjonen svarte, eller lim inn relevant svar..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="legalStatus"
                  className="text-sm font-bold text-slate-800"
                >
                  Rettsstatus
                </label>
                <select
                  id="legalStatus"
                  value={legalStatus}
                  onChange={(event) => setLegalStatus(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                >
                  <option value="">Velg rettsstatus</option>
                  <option value="not_relevant">Ikke relevant</option>
                  <option value="unknown">Uavklart</option>
                  <option value="reported">Anmeldt</option>
                  <option value="dismissed">Henlagt</option>
                  <option value="court_case">Rettssak</option>
                  <option value="judgment">Dom/avgjørelse</option>
                  <option value="appeal">Klage/anke</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="legalStatusDetails"
                  className="text-sm font-bold text-slate-800"
                >
                  Detaljer om rettsstatus
                </label>
                <textarea
                  id="legalStatusDetails"
                  rows={5}
                  value={legalStatusDetails}
                  onChange={(event) =>
                    setLegalStatusDetails(event.target.value)
                  }
                  placeholder="Forklar kort om saken er anmeldt, henlagt, avgjort, påklaget eller annet..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="documentationSummary"
                  className="text-sm font-bold text-slate-800"
                >
                  Dokumentasjonsoppsummering
                </label>
                <textarea
                  id="documentationSummary"
                  rows={6}
                  value={documentationSummary}
                  onChange={(event) =>
                    setDocumentationSummary(event.target.value)
                  }
                  placeholder="List opp dokumenter, e-poster, SMS, vedlegg, skjermbilder eller andre bevis som finnes..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="desiredOutcome"
                  className="text-sm font-bold text-slate-800"
                >
                  Hva ønsker du å oppnå?
                </label>
                <textarea
                  id="desiredOutcome"
                  rows={4}
                  value={desiredOutcome}
                  onChange={(event) => setDesiredOutcome(event.target.value)}
                  placeholder="F.eks. retting, tilsvar, beklagelse, avindeksering, PFU-klage eller bedre dokumentasjon..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              {saveMessage ? (
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold leading-6 text-cyan-900">
                  {saveMessage}
                </div>
              ) : null}

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Lagrer..." : "Lagre opplysninger"}
                </button>

                <Link
                  href={`/min-side/saker/${params.id}`}
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-4 font-black text-slate-950 hover:bg-slate-100"
                >
                  Til saken
                </Link>
              </div>
            </div>
          </form>
            ) : (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Opplysninger
              </p>

              <div className="flex flex-wrap items-start justify-between gap-4">
                <h2 className="mt-3 text-4xl font-black text-slate-950">
                  Fakta, tilsvar og dokumentasjon
                </h2>

                <button
                  type="button"
                  onClick={() => {
                    setSaveMessage("");
                    setIsEditingInputs(true);
                  }}
                  className="mt-3 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800"
                >
                  Rediger saksopplysninger
                </button>
              </div>

              <p className="mt-4 max-w-3xl leading-8 text-slate-700">
                Dette er opplysningene som brukes videre som grunnlag for
                rapport, PFU-klage og dokumentasjon.
              </p>

              {saveMessage ? (
                <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold leading-6 text-cyan-900">
                  {saveMessage}
                </div>
              ) : null}

              <div className="mt-8 grid gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    Artikkeltekst eller utdrag
                  </p>
                  <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">
                    {articleText || "Ikke lagt inn ennå."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    Hva skjedde?
                  </p>
                  <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">
                    {whatHappened || "Ikke lagt inn ennå."}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                      Din rolle
                    </p>
                    <p className="mt-3 text-lg font-black text-slate-950">
                      {yourRole || "Ikke satt"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                      Tilsvar sendt
                    </p>
                    <p className="mt-3 text-lg font-black text-slate-950">
                      {replySent ? "Ja" : "Nei / ikke registrert"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    Tilsvar eller henvendelse
                  </p>
                  <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">
                    {replyText || "Ikke lagt inn ennå."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    Svar fra redaksjonen
                  </p>
                  <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">
                    {editorResponse || "Ikke lagt inn ennå."}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                      Rettsstatus
                    </p>
                    <p className="mt-3 text-lg font-black text-slate-950">
                      {legalStatusLabel(legalStatus)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                      Ønsket resultat
                    </p>
                    <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">
                      {desiredOutcome || "Ikke lagt inn ennå."}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    Detaljer om rettsstatus
                  </p>
                  <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">
                    {legalStatusDetails || "Ikke lagt inn ennå."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    Dokumentasjonsoppsummering
                  </p>
                  <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">
                    {documentationSummary || "Ikke lagt inn ennå."}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/min-side/saker/${params.id}/rapport`}
                  className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800"
                >
                  Gå til rapport
                </Link>

                <Link
                  href={`/min-side/saker/${params.id}`}
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-4 font-black text-slate-950 hover:bg-slate-100"
                >
                  Til saken
                </Link>
              </div>
            </div>
            )}
          </section>

          <aside className="grid content-start gap-6">
          <CaseWorkflowCard
            caseId={params.id}
            statusLabel={caseItem ? statusLabel(caseItem.status) : "Utkast"}
            activeStep="opplysninger"
            stepsDone={{
              caseRegistered: true,
              caseInputs: Boolean(caseInputId),
              report: reports.some((report) => report.report_type !== "pfu_draft"),
              pfuDraft: reports.some((report) => report.report_type === "pfu_draft"),
              pfuDecision: Boolean(
                pfuDecision?.decision_received || pfuDecision?.uploaded_file_name
              ),
              policeReport: false,
            }}
          />

            <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
                Dokumentasjon
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Oppsummer det du har
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                Bruk dokumentasjonsfeltet til å liste opp e-poster, SMS,
                skjermbilder, vedlegg, lenker eller andre bevis. Selve
                filopplasting kan legges til senere.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Neste steg
              </p>
              <h2 className="mt-3 text-3xl font-black">
                Første rapportutkast
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                Når opplysninger er lagret, kan du gå tilbake til saken og
                jobbe videre med rapportutkast, PFU-spor eller redigering.
              </p>
            </div>
          </aside>
        </div>

      </section>

      <LightPublicFooter />
    </main>
  );
}

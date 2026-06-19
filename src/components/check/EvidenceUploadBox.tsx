export function EvidenceUploadBox() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm font-semibold text-cyan-300">Steg 5</p>
      <h2 className="mt-2 text-2xl font-bold">Dokumentasjon</h2>
      <p className="mt-3 text-slate-300">
        Her skal brukeren senere kunne laste opp e-post, SMS, skjermbilder, PDF,
        dom, kjennelse, henleggelse, svar fra redaktør og andre vedlegg.
      </p>

      <div className="mt-5 rounded-2xl border border-dashed border-white/20 bg-slate-900 p-6 text-center text-sm text-slate-400">
        Opplasting av vedlegg kommer i databasefasen.
      </div>
    </div>
  );
}

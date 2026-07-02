export function LegalStatusForm() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm font-semibold text-blue-300">Steg 4</p>
      <h2 className="mt-2 text-2xl font-bold">
        Straffesak, dom og rettsstatus
      </h2>
      <p className="mt-3 text-slate-300">
        Dette er viktig hvis artikkelen omtaler mistanke, siktelse, tiltale,
        dom, henleggelse eller frifinnelse. Opplysningene kan brukes i
        vurderingen av identifisering, uskyldspresumsjon, oppdateringsbehov og
        mulig skadevirkning.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-slate-300">
            Er du / den omtalte knyttet til en straffesak?
          </label>
          <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-blue-300">
            <option>Nei</option>
            <option>Ja, som mistenkt</option>
            <option>Ja, som siktet</option>
            <option>Ja, som tiltalt</option>
            <option>Ja, som fornærmet</option>
            <option>Ja, som vitne</option>
            <option>Usikker</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-300">
            Finnes det rettskraftig dom?
          </label>
          <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-blue-300">
            <option>Ikke relevant</option>
            <option>Nei, saken er ikke avgjort</option>
            <option>Ja, dommen er rettskraftig</option>
            <option>Ja, men dommen er anket</option>
            <option>Saken ble henlagt</option>
            <option>Jeg / den omtalte ble frifunnet</option>
            <option>Usikker</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-300">
            Blir du / den omtalte navngitt eller identifisert?
          </label>
          <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-blue-300">
            <option>Ja, fullt navn</option>
            <option>Ja, bilde</option>
            <option>Ja, indirekte identifisering</option>
            <option>Nei</option>
            <option>Usikker</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-300">
            Er artikkelen oppdatert etter ny utvikling?
          </label>
          <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-blue-300">
            <option>Ikke relevant</option>
            <option>Ja</option>
            <option>Nei</option>
            <option>Delvis</option>
            <option>Usikker</option>
          </select>
        </div>
      </div>

      <textarea
        placeholder="Skriv kort om status i saken, dom, henleggelse, frifinnelse eller annen utvikling..."
        rows={5}
        className="mt-5 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none placeholder:text-slate-500 focus:border-blue-300"
      />
    </div>
  );
}

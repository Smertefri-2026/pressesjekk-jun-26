const contactOptions = [
  "Ja, e-post",
  "Ja, SMS",
  "Ja, telefon",
  "Ja, annet",
  "Nei, jeg ble ikke kontaktet",
  "Usikker",
];

export function ReplyCheckForm() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm font-semibold text-blue-300">Steg 3</p>
      <h2 className="mt-2 text-2xl font-bold">
        Tilsvar og kontakt før publisering
      </h2>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-slate-300">
            Ble du kontaktet før publisering?
          </label>
          <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-blue-300">
            {contactOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-300">
            Fikk du konkrete beskyldninger?
          </label>
          <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-blue-300">
            <option>Ja</option>
            <option>Delvis</option>
            <option>Nei</option>
            <option>Usikker</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-300">
            Hvor lang svarfrist fikk du?
          </label>
          <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-blue-300">
            <option>Ingen tydelig frist</option>
            <option>Under 1 time</option>
            <option>1–3 timer</option>
            <option>Samme dag</option>
            <option>1 dag</option>
            <option>Flere dager</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-300">
            Ble svaret ditt tatt med?
          </label>
          <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-blue-300">
            <option>Ja, korrekt</option>
            <option>Ja, men bare delvis</option>
            <option>Nei</option>
            <option>Svaret ble gjengitt feil</option>
            <option>Ikke relevant</option>
          </select>
        </div>
      </div>

      <textarea
        placeholder="Skriv kort hva som skjedde før publisering..."
        rows={5}
        className="mt-5 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none placeholder:text-slate-500 focus:border-blue-300"
      />
    </div>
  );
}

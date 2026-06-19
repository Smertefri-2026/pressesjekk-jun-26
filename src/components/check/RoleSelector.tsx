const roles = [
  "Jeg er omtalt i saken",
  "Jeg er pårørende",
  "Jeg representerer bedrift/organisasjon",
  "Jeg er journalist",
  "Jeg er advokat/PR-rådgiver",
  "Jeg sjekker som leser",
];

export function RoleSelector() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm font-semibold text-cyan-300">Steg 1</p>
      <h2 className="mt-2 text-2xl font-bold">Hvem bruker PresseSjekk?</h2>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {roles.map((role) => (
          <label
            key={role}
            className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 p-4 text-sm hover:border-cyan-300/60"
          >
            <input type="radio" name="role" />
            <span>{role}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

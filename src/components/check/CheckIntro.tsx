import Link from "next/link";

export function CheckIntro() {
  return (
    <div className="py-14">
      <Link href="/" className="text-sm text-blue-300 hover:text-blue-200">
        ← Tilbake til forsiden
      </Link>

      <div className="mt-8 max-w-4xl">
        <p className="text-sm uppercase tracking-[0.3em] text-blue-300">
          Start PresseSjekk
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
          Sjekk en artikkel mot presseetiske og rettslige problemstillinger
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
          PresseSjekk vurderer ikke bare teksten i artikkelen, men også om du
          fikk reell mulighet til tilsvar, om saken gjelder en straffesak, og om
          artikkelen bør vurderes opp mot presseetikk, uskyldspresumsjon og
          rettsstatus.
        </p>
      </div>
    </div>
  );
}

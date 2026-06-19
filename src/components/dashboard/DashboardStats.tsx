type DashboardStatsProps = {
  activeCases: number;
};

export function DashboardStats({ activeCases }: DashboardStatsProps) {
  const stats = [
    { label: "Credits igjen", value: "3", highlight: true },
    { label: "Aktive saker", value: String(activeCases) },
    { label: "Rapporter", value: "2" },
    { label: "PFU-utkast", value: "1" },
  ];

  return (
    <div className="mt-10 grid gap-6 md:grid-cols-4">
      {stats.map((item) => (
        <div
          key={item.label}
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
        >
          <p className="text-sm text-slate-400">{item.label}</p>
          <p
            className={`mt-3 text-4xl font-bold ${
              item.highlight ? "text-cyan-300" : ""
            }`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

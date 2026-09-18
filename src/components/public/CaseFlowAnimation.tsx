const STAGES = [
  {
    label: "Artikkel",
    detail: "URL eller tekst",
    icon: (
      <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 5h6M9 11h6M9 14h3" />
    ),
  },
  {
    label: "Vurderingspunkter",
    detail: "Tilsvar, kilder, identifisering",
    icon: (
      <path d="m5 12 3 3 3-6M5 6h.01M5 18h.01M11 6h8M11 18h8" />
    ),
  },
  {
    label: "Rapport",
    detail: "Struktur og neste steg",
    icon: (
      <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 6 2 2 4-4" />
    ),
  },
];

export function CaseFlowAnimation() {
  return (
    <div className="cfa-root relative flex h-full min-h-[260px] w-full flex-col items-center justify-center gap-6 p-6 sm:flex-row sm:gap-0">
      {STAGES.map((stage, i) => (
        <div key={stage.label} className="flex flex-1 items-center gap-0 sm:flex-col">
          <div className="flex flex-col items-center gap-2 sm:flex-1">
            <div
              className="cfa-node flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] text-red-300"
              style={{ animationDelay: `${i * 1.4}s` }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden="true"
              >
                {stage.icon}
              </svg>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-white">{stage.label}</div>
              <div className="text-[11px] text-slate-400">{stage.detail}</div>
            </div>
          </div>

          {i < STAGES.length - 1 && (
            <div
              className="cfa-line relative mx-2 h-px w-8 flex-none bg-white/15 sm:mx-0 sm:mt-7 sm:h-8 sm:w-px sm:flex-1"
              aria-hidden="true"
            >
              <span
                className="cfa-dot absolute h-1.5 w-1.5 rounded-full bg-red-300"
                style={{ animationDelay: `${i * 1.4}s` }}
              />
            </div>
          )}
        </div>
      ))}

      <style>{`
        @keyframes cfa-pulse {
          0%, 12% { box-shadow: 0 0 0 0 rgba(252, 165, 165, 0.35); }
          20% { box-shadow: 0 0 0 6px rgba(252, 165, 165, 0); }
          100% { box-shadow: 0 0 0 0 rgba(252, 165, 165, 0); }
        }
        @keyframes cfa-travel-x {
          0%, 8% { left: 0; opacity: 1; }
          28%, 100% { left: 100%; opacity: 1; }
        }
        @keyframes cfa-travel-y {
          0%, 8% { top: 0; opacity: 1; }
          28%, 100% { top: 100%; opacity: 1; }
        }
        .cfa-node { animation: cfa-pulse 4.2s ease-out infinite; }
        .cfa-dot {
          top: 50%;
          transform: translate(-50%, -50%);
          animation: cfa-travel-x 4.2s ease-in-out infinite;
        }
        @media (min-width: 640px) {
          .cfa-dot {
            left: 50%;
            transform: translate(-50%, -50%);
            animation-name: cfa-travel-y;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .cfa-node, .cfa-dot { animation: none !important; }
          .cfa-dot { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

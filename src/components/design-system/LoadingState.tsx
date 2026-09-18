export type LoadingStateProps = {
  message?: string;
  className?: string;
};

/**
 * Remøy AI Design System — LoadingState.
 * PresseSjekk hadde 26 forekomster av ren "Laster..."-tekst uten noe visuelt
 * signal (ingen animate-spin fantes noe sted i kodebasen). Denne legger til
 * et enkelt, rolig spinner-ikon uten å endre tonen i teksten.
 */
export function LoadingState({ message = "Laster...", className = "" }: LoadingStateProps) {
  return (
    <div
      role="status"
      className={`flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-6 text-slate-700 ${className}`}
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-red-500"
      />
      <span className="text-sm font-semibold">{message}</span>
    </div>
  );
}

export type ErrorBannerProps = {
  message: string;
  className?: string;
};

/**
 * Remøy AI Design System — ErrorBanner.
 * Det eksakte "rounded-3xl border border-red-200 bg-red-50 ... text-red-800"
 * mønsteret som var duplisert 6+ steder i PresseSjekk.
 */
export function ErrorBanner({ message, className = "" }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className={`rounded-3xl border border-red-200 bg-red-50 p-6 font-semibold text-red-800 ${className}`}
    >
      {message}
    </div>
  );
}

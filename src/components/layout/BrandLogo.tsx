import Link from "next/link";

type BrandLogoProps = {
  size?: "header" | "footer";
  tone?: "light" | "dark";
};

export function BrandLogo({ size = "header", tone = "light" }: BrandLogoProps) {
  const titleSize = size === "footer" ? "text-2xl" : "text-xl sm:text-2xl";
  const taglineSize = size === "footer" ? "text-xs" : "text-[11px] sm:text-xs";
  const titleColor = tone === "dark" ? "text-white" : "text-slate-950";
  const taglineColor = tone === "dark" ? "text-orange-400" : "text-red-700";

  return (
    <Link href="/" className="block min-w-0">
      <p className={`${titleSize} font-black tracking-tight ${titleColor}`}>
        PresseSjekk
      </p>
      <p
        className={`mt-1 ${taglineSize} font-bold uppercase tracking-[0.04em] ${taglineColor}`}
      >
        Din kontroll av media
      </p>
    </Link>
  );
}

import Link from "next/link";

type BrandLogoProps = {
  size?: "header" | "footer";
};

export function BrandLogo({ size = "header" }: BrandLogoProps) {
  const titleSize = size === "footer" ? "text-2xl" : "text-xl sm:text-2xl";
  const taglineSize = size === "footer" ? "text-xs" : "text-[11px] sm:text-xs";

  return (
    <Link href="/" className="block min-w-0">
      <p className={`${titleSize} font-black tracking-tight text-slate-950`}>
        PresseSjekk
      </p>
      <p
        className={`mt-1 ${taglineSize} font-bold uppercase tracking-[0.04em] text-red-700`}
      >
        Din kontroll av media
      </p>
    </Link>
  );
}

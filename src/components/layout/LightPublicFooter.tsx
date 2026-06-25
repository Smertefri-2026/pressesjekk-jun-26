import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";

const pageLinks = [
  { href: "/pressesjekk", label: "Start sjekk" },
  { href: "/hvordan-det-fungerer", label: "Slik fungerer det" },
  { href: "/eksempelrapport", label: "Eksempelrapport" },
  { href: "/priser", label: "Priser" },
  { href: "/proff", label: "Proff" },
  { href: "/om", label: "Om PresseSjekk" },
  { href: "/login", label: "Logg inn" },
  { href: "/kontakt", label: "Kontakt" },
];

const trustLinks = [
  { href: "/personvern", label: "Personvern" },
  { href: "/vilkar", label: "Vilkår" },
];

const socialLinks = [
  { href: "#", label: "Facebook" },
  { href: "#", label: "YouTube" },
  { href: "#", label: "TikTok" },
];

export function LightPublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <section>
            <BrandLogo size="footer" />

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-600">
              PresseSjekk gir veiledende analyser og dokumenthjelp. Tjenesten
              erstatter ikke advokat, PFU, redaktøransvar eller domstolene.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-slate-950">
              Sider
            </h2>
            <nav className="mt-5 grid gap-3 text-sm font-semibold text-slate-600">
              {pageLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-slate-950"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-slate-950">
              Trygghet
            </h2>
            <nav className="mt-5 grid gap-3 text-sm font-semibold text-slate-600">
              {trustLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-slate-950"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

  
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-slate-950">
              Følg oss
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-600">
            </p>

            <nav className="mt-5 grid gap-3 text-sm font-semibold text-slate-600">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="hover:text-slate-950"
                  aria-label={`${item.label} kommer senere`}
                >
                  {item.label}
                  <span className="ml-2 text-xs font-bold text-slate-400">
                    kommer
                  </span>
                </a>
              ))}
            </nav>
          </section>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-sm leading-7 text-slate-500">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} PresseSjekk. Alle rettigheter forbeholdt.</p>
            <p>Veiledende analyser og dokumenthjelp for mediesaker.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

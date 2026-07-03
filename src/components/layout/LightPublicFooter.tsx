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
  {
    href: "https://www.facebook.com/pressesjekk",
    label: "Facebook",
    icon: "facebook",
  },
  {
    href: "https://www.youtube.com/@PresseSjekk",
    label: "YouTube",
    icon: "youtube",
  },
  {
    href: "https://www.tiktok.com/@pressesjekk",
    label: "TikTok",
    icon: "tiktok",
  },
] as const;

function SocialIcon({ icon }: { icon: (typeof socialLinks)[number]["icon"] }) {
  if (icon === "facebook") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4 shrink-0"
        fill="currentColor"
      >
        <path d="M13.5 21v-7.4h2.5l.4-2.9h-2.9V8.8c0-.8.2-1.4 1.4-1.4h1.5V4.8c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8v2.9h2.5V21h3z" />
      </svg>
    );
  }

  if (icon === "youtube") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4 shrink-0"
        fill="currentColor"
      >
        <path d="M21.6 7.2s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C15.8 4 12 4 12 4s-3.8 0-6.7.2c-.4.1-1.3.1-2.1.9-.6.6-.8 2.1-.8 2.1S2.2 9 2.2 10.8v1.7c0 1.8.2 3.6.2 3.6s.2 1.5.8 2.1c.8.8 1.8.8 2.3.9 1.7.2 6.5.2 6.5.2s3.8 0 6.7-.2c.4-.1 1.3-.1 2.1-.9.6-.6.8-2.1.8-2.1s.2-1.8.2-3.6v-1.7c0-1.8-.2-3.6-.2-3.6zM10.2 14.6V8.5l5.8 3.1-5.8 3z" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="currentColor"
    >
      <path d="M16.6 3c.4 2.8 2 4.4 4.4 4.6v3c-1.4 0-2.7-.4-4-1.2v5.9c0 3.1-2 5.7-5.5 5.7-3.2 0-5.5-2.2-5.5-5.2 0-3.2 2.5-5.4 5.8-5.2v3.1c-1.5-.2-2.5.7-2.5 2 0 1.2.9 2 2.1 2 1.4 0 2.1-.8 2.1-2.5V3h3.1z" />
    </svg>
  );
}

export function LightPublicFooter() {
  return (
    <footer className="border-t border-slate-700 bg-slate-900 text-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <section>
            <BrandLogo size="footer" tone="dark" />

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
              PresseSjekk gir veiledende analyser og dokumenthjelp. Tjenesten
              erstatter ikke advokat, PFU, redaktøransvar eller domstolene.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-white">
              Sider
            </h2>
            <nav className="mt-5 grid gap-3 text-sm font-semibold text-slate-300">
              {pageLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-white">
              Trygghet
            </h2>
            <nav className="mt-5 grid gap-3 text-sm font-semibold text-slate-300">
              {trustLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

  
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-white">
              Følg oss
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-300">
            </p>

            <nav className="mt-5 grid gap-3 text-sm font-semibold text-slate-300">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="inline-flex items-center gap-2 hover:text-white"
                  aria-label={`Åpne PresseSjekk på ${item.label}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <SocialIcon icon={item.icon} />
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
          </section>
        </div>

        <div className="mt-10 border-t border-slate-700 pt-6 text-sm leading-7 text-slate-400">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} PresseSjekk. Alle rettigheter forbeholdt.</p>
            <p>Veiledende analyser og dokumenthjelp for mediesaker.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

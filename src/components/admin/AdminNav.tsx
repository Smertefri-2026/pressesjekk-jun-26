import Link from "next/link";

const adminLinks = [
  { href: "/admin", label: "Oversikt" },
  { href: "/admin/brukere", label: "Brukere" },
  { href: "/admin/saker", label: "Saker" },
  { href: "/admin/pakker", label: "Pakker" },
  { href: "/admin/rapporter", label: "Rapporter" },
  { href: "/admin/raske-sjekker", label: "Raske sjekker" },
  { href: "/admin/refusjoner", label: "Refusjoner" },
  { href: "/admin/stripe", label: "Stripe" },
];

export function AdminNav() {
  return (
    <nav className="mt-8 rounded-3xl border border-violet-200 bg-white p-3 shadow-sm ring-1 ring-violet-100">
      <div className="flex flex-wrap gap-2">
        {adminLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm font-black text-violet-900 hover:bg-violet-100"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

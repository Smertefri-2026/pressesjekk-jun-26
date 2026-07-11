import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { SignOutButton } from "@/components/auth/SignOutButton";

type AdminAccountBoxProps = {
  adminName?: string | null;
  user: User | null;
  className?: string;
};

export function AdminAccountBox({
  adminName,
  user,
  className = "",
}: AdminAccountBoxProps) {
  return (
    <aside
      className={`rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-sm sm:p-7 ${className}`}
    >
      <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-800">
        Konto
      </p>

      <h2 className="mt-4 text-3xl font-black text-slate-950">
        {adminName?.trim() || "Admin"}
      </h2>

      {user?.email ? (
        <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
          Innlogget som: <span className="text-slate-950">{user.email}</span>
        </p>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Link
          href="/min-side"
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
        >
          Min Side
        </Link>

        <Link
          href="/min-side/profil"
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
        >
          Profil
        </Link>

        <SignOutButton />
      </div>
    </aside>
  );
}

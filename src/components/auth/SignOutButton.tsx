"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"
    >
      Logg ut
    </button>
  );
}

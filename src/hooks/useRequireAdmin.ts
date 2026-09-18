"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export type AdminProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role_type: string | null;
  is_admin: boolean | null;
};

export type UseRequireAdminResult = {
  user: User | null;
  adminProfile: AdminProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  errorMessage: string;
};

/**
 * Samler admin-vakten som var kopiert identisk på alle 8 admin-sider.
 *
 * Viktig: dette er fortsatt bare en UX-gate (skjuler admin-UI for
 * ikke-admins raskt). Den faktiske sikkerhetsgrensen er Postgres RLS
 * (current_user_is_admin()-policyer) og, for sensitive skriveoperasjoner,
 * requireAdmin() server-side i API-rutene. Klienten skal aldri være eneste
 * sikkerhetsmekanisme.
 */
export function useRequireAdmin(): UseRequireAdminResult {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id,full_name,email,role_type,is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (profileError) {
        setErrorMessage(profileError.message);
        setIsLoading(false);
        return;
      }

      if (!profile?.is_admin) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setAdminProfile(profile as AdminProfile);
      setIsAdmin(true);
      setIsLoading(false);
    }

    init().catch((error) => {
      if (cancelled) return;
      setErrorMessage(
        error instanceof Error ? error.message : "Kunne ikke bekrefte admin-tilgang."
      );
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, adminProfile, isAdmin, isLoading, errorMessage };
}

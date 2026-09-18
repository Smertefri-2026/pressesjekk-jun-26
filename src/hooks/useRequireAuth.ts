"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export type UseRequireAuthResult = {
  user: User | null;
  isLoading: boolean;
  errorMessage: string;
};

/**
 * Samler mønsteret som var kopiert på ~19 sider: hent innlogget bruker,
 * send til /login hvis ingen. Redirect-URL kan settes slik at brukeren
 * kommer tilbake dit de var på vei.
 */
export function useRequireAuth(options?: { redirectTo?: string }): UseRequireAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (error || !user) {
        const loginUrl = options?.redirectTo
          ? `/login?redirectTo=${encodeURIComponent(options.redirectTo)}`
          : "/login";
        window.location.href = loginUrl;
        return;
      }

      setUser(user);
      setIsLoading(false);
    }

    init().catch((error) => {
      if (cancelled) return;
      setErrorMessage(
        error instanceof Error ? error.message : "Kunne ikke bekrefte innlogging."
      );
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, isLoading, errorMessage };
}

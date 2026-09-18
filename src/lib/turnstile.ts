const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileVerifyResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Verifiserer en Cloudflare Turnstile-token server-side. Tokenet er
 * engangsbruk og må komme fra klienten for hvert enkelt kall - det skal
 * aldri caches eller gjenbrukes.
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string | null
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return { success: false, error: "TURNSTILE_SECRET_KEY mangler i .env.local." };
  }

  if (!token) {
    return {
      success: false,
      error: "Bekreftelse mangler. Prøv igjen (last siden på nytt om problemet vedvarer).",
    };
  }

  const body = new URLSearchParams({ secret, response: token });

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const result = (await response.json()) as { success?: boolean };

    if (!result.success) {
      return {
        success: false,
        error: "Kunne ikke bekrefte at du er et menneske. Last siden på nytt og prøv igjen.",
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Kunne ikke kontakte verifiseringstjenesten. Prøv igjen om litt.",
    };
  }
}

import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk<T extends Record<string, unknown>>(body: T, status = 200) {
  return NextResponse.json(body, { status });
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
}

// Beste innsats for klient-IP bak Vercel/omvendt proxy. Kan forfalskes av
// klienten selv (X-Forwarded-For er ikke autentisert), så brukes kun som
// nøkkel for rate limiting, ikke som sikkerhetsbevis.
export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

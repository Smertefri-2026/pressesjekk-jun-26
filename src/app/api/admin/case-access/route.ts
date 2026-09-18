import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireAdmin } from "@/lib/access/requireAdmin";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { packageAccessSteps, type PackagePlanId } from "@/data/packagePlans";

type Body = {
  caseId?: string;
  userId?: string;
  packageId?: string;
  source?: "manual" | "compensation";
};

function isKnownPackage(value: string): value is PackagePlanId {
  return Object.prototype.hasOwnProperty.call(packageAccessSteps, value);
}

/**
 * Manuell pakketildeling (admin/pakker "Manuell tilgang"/"Kompensasjon").
 * case_access har ingen skrivetilgang for authenticated (se
 * case-access-v1.sql) - dette er med vilje, siden tabellen styrer betalt
 * tilgang. Denne ruten er derfor eneste vei inn for admin, med en ekte
 * server-side is_admin-sjekk (ikke React-state) og service-role klienten.
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);

  if (!admin.ok) {
    return jsonError(admin.error, admin.status);
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const caseId = body.caseId ? String(body.caseId) : "";
  const userId = body.userId ? String(body.userId) : "";
  const packageId = body.packageId ? String(body.packageId) : "";
  const source = body.source === "compensation" ? "compensation" : "manual";

  if (!caseId || !userId || !packageId) {
    return jsonError("Mangler caseId, userId eller packageId.", 400);
  }

  if (!isKnownPackage(packageId)) {
    return jsonError(`Ukjent pakke: ${packageId}`, 400);
  }

  const service = getSupabaseServiceClient();

  const { data, error } = await service
    .from("case_access")
    .upsert(
      {
        case_id: caseId,
        user_id: userId,
        package_id: packageId,
        status: "active",
        source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "case_id" }
    )
    .select("id,user_id,case_id,package_id,status,source,created_at,updated_at")
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  console.log("Admin ga manuell case_access", {
    adminUserId: admin.user.id,
    caseId,
    userId,
    packageId,
    source,
  });

  return jsonOk({ access: data });
}

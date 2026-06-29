import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import type { PackagePlanId } from "@/data/packagePlans";

type CreateCaseBody = {
  folderId?: string | null;
  title?: string;
  mediaName?: string;
  articleTitle?: string;
  articleUrl?: string;
  publishedDate?: string;
  shortDescription?: string;
};

type UserCaseEntitlement = {
  id: string;
  package_id: PackagePlanId;
  included_cases: number;
  used_cases: number;
  expires_at: string | null;
};

function accessPackageForEntitlement(packageId: PackagePlanId): PackagePlanId {
  if (
    packageId === "case_bundle_3" ||
    packageId === "case_bundle_5" ||
    packageId === "case_bundle_10" ||
    packageId === "monthly_start" ||
    packageId === "monthly_pro" ||
    packageId === "monthly_agency" ||
    packageId === "monthly_enterprise"
  ) {
    return "report_pack";
  }

  return packageId;
}

function isAvailableEntitlement(entitlement: UserCaseEntitlement) {
  if (entitlement.used_cases >= entitlement.included_cases) return false;

  if (entitlement.expires_at) {
    return new Date(entitlement.expires_at).getTime() > Date.now();
  }

  return true;
}

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json(
      { error: "Du må være innlogget for å opprette sak." },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase miljøvariabler mangler." },
      { status: 500 }
    );
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Fant ikke innlogget bruker." },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as CreateCaseBody;
  const supabase = getSupabaseServiceClient();

  const { data: entitlements, error: entitlementError } = await supabase
    .from("user_case_entitlements")
    .select("id, package_id, included_cases, used_cases, expires_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (entitlementError) {
    return NextResponse.json(
      { error: entitlementError.message },
      { status: 500 }
    );
  }

  const entitlement = (entitlements as UserCaseEntitlement[] | null)?.find(
    isAvailableEntitlement
  );

  if (!entitlement) {
    return NextResponse.json(
      { error: "Du må kjøpe en pakke før du kan opprette ny sak." },
      { status: 402 }
    );
  }

  const mediaName = cleanText(body.mediaName);
  const articleTitle = cleanText(body.articleTitle);

  const caseTitle =
    cleanText(body.title) ||
    articleTitle ||
    `PresseSjekk-sak${mediaName ? ` – ${mediaName}` : ""}`;

  const { data: createdCase, error: caseError } = await supabase
    .from("cases")
    .insert({
      user_id: user.id,
      title: caseTitle,
      status: "draft",
      folder_id: cleanText(body.folderId),
      media_name: mediaName,
      article_title: articleTitle,
      article_url: cleanText(body.articleUrl),
      published_date: cleanText(body.publishedDate),
      short_description: cleanText(body.shortDescription),
    })
    .select("id")
    .single();

  if (caseError || !createdCase?.id) {
    return NextResponse.json(
      { error: caseError?.message ?? "Kunne ikke opprette saken." },
      { status: 500 }
    );
  }

  const accessPackageId = accessPackageForEntitlement(entitlement.package_id);

  const { error: accessError } = await supabase.from("case_access").insert({
    case_id: createdCase.id,
    user_id: user.id,
    package_id: accessPackageId,
    status: "active",
    source: "user_case_entitlement",
  });

  if (accessError) {
    await supabase.from("cases").delete().eq("id", createdCase.id);

    return NextResponse.json(
      { error: accessError.message },
      { status: 500 }
    );
  }

  const { data: updatedEntitlement, error: updateError } = await supabase
    .from("user_case_entitlements")
    .update({
      used_cases: entitlement.used_cases + 1,
    })
    .eq("id", entitlement.id)
    .eq("used_cases", entitlement.used_cases)
    .select("id")
    .maybeSingle();

  if (updateError || !updatedEntitlement) {
    await supabase.from("case_access").delete().eq("case_id", createdCase.id);
    await supabase.from("cases").delete().eq("id", createdCase.id);

    return NextResponse.json(
      {
        error:
          updateError?.message ??
          "Ledig sak ble brukt av en annen prosess. Prøv igjen.",
      },
      { status: 409 }
    );
  }

  return NextResponse.json({
    caseId: createdCase.id,
    packageId: accessPackageId,
  });
}

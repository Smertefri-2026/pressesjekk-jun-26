import { redirect } from "next/navigation";

type OldBuyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OldBuyPackageRedirectPage({
  searchParams,
}: OldBuyPageProps) {
  const params = searchParams ? await searchParams : {};
  const rawPlan = params.plan;
  const rawUrl = params.url;

  const plan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan;
  const url = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;

  const query = new URLSearchParams();

  if (plan) {
    query.set("plan", plan);
  }

  if (url) {
    query.set("url", url);
  }

  redirect(`/utsjekk${query.toString() ? `?${query.toString()}` : ""}`);
}

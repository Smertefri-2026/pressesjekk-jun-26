import { redirect } from "next/navigation";

export default function OldBuyPackageRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  void searchParams;
  redirect("/checkout");
}

import { DocumentOverviewPage } from "@/components/dashboard/DocumentOverviewPage";

export default function PfuKlagerPage() {
  return (
    <DocumentOverviewPage
      eyebrow="PFU-klager"
      title="PFU-klager"
      description="Samlet oversikt over PFU-klageutkast som er laget i dine saker."
      reportTypes={["pfu_draft"]}
      emptyTitle="Ingen PFU-klager ennå"
      emptyText="Når du genererer et PFU-klageutkast i en sak, vises det her."
      primaryHref="/min-side"
      primaryLabel="Se saker"
    />
  );
}

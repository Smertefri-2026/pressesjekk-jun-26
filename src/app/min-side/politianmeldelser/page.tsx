import { DocumentOverviewPage } from "@/components/dashboard/DocumentOverviewPage";

export default function PolitianmeldelserPage() {
  return (
    <DocumentOverviewPage
      eyebrow="Politianmeldelser"
      title="Politianmeldelser"
      description="Oversikt over politianmeldelsesutkast som er laget i dine saker."
      reportTypes={["police_draft"]}
      emptyTitle="Ingen politianmeldelser ennå"
      emptyText="Når du genererer et politianmeldelsesutkast i en sak, vises det her."
      primaryHref="/min-side"
      primaryLabel="Se saker"
    />
  );
}

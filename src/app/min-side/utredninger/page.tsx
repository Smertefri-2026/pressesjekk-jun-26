import { DocumentOverviewPage } from "@/components/dashboard/DocumentOverviewPage";

export default function UtredningerPage() {
  return (
    <DocumentOverviewPage
      eyebrow="Utredninger"
      title="Utredninger"
      description="Oversikt over utredningsutkast og større saksgrunnlag som er laget i dine saker."
      reportTypes={["investigation_draft"]}
      emptyTitle="Ingen utredninger ennå"
      emptyText="Når du genererer et utredningsutkast i en sak, vises det her."
      primaryHref="/min-side"
      primaryLabel="Se saker"
    />
  );
}

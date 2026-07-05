import { DocumentOverviewPage } from "@/components/dashboard/DocumentOverviewPage";

export default function RapporterPage() {
  return (
    <DocumentOverviewPage
      eyebrow="Rapporter"
      title="Rapporter"
      description="Oversikt over regelbaserte rapporter og KI-rapporter som er opprettet i dine PresseSjekk-saker."
      reportTypes={["free_check", "full_report"]}
      emptyTitle="Ingen rapporter ennå"
      emptyText="Når du oppretter en rapport i en sak, vises den her."
      primaryHref="/min-side/saker/ny"
      primaryLabel="Ny sak"
    />
  );
}

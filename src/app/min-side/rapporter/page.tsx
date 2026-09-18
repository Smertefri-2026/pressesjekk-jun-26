import { Suspense } from "react";
import { DocumentOverviewPage } from "@/components/dashboard/DocumentOverviewPage";

export default function RapporterPage() {
  return (
    <Suspense fallback={null}>
      <DocumentOverviewPage />
    </Suspense>
  );
}

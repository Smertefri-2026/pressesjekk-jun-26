import { Badge, type BadgeTone } from "@/components/design-system";
import { statusLabel } from "@/lib/evidence/statusLogic";
import type { DocumentationStatus } from "@/lib/evidence/types";

const STATUS_TONE: Record<DocumentationStatus, BadgeTone> = {
  well_documented: "success",
  partially_documented: "warning",
  conflicting: "danger",
  undocumented: "neutral",
  not_assessed: "info",
};

export function EvidenceStatusBadge({ status }: { status: DocumentationStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{statusLabel(status)}</Badge>;
}

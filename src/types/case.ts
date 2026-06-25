export type RiskLevel = "Lav" | "Middels" | "Middels/høy" | "Høy";

export type CaseStatus =
  | "Rask sjekk"
  | "Rapportpakke kjøpt"
  | "PFU-klageutkast klart"
  | "Venter på analyse"
  | "Avsluttet";

export type CaseSummary = {
  id: string;
  title: string;
  media: string;
  date: string;
  status: CaseStatus;
  nextStep: string;
  risk: RiskLevel;
  href: string;
};

export type TimelineItem = {
  date: string;
  title: string;
  text: string;
};

export type DemoCase = {
  id: string;
  title: string;
  media: string;
  publishedAt: string;
  articleType: string;
  checkedCount: number;
  url: string;
  status: CaseStatus;
  risk: RiskLevel;
  nextStep: string;
  timeline: TimelineItem[];
  findings: string[];
};

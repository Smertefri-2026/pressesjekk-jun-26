import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { ArticleInputForm } from "@/components/check/ArticleInputForm";
import { CheckIntro } from "@/components/check/CheckIntro";
import { EvidenceUploadBox } from "@/components/check/EvidenceUploadBox";
import { FreeResultCard } from "@/components/check/FreeResultCard";
import { LegalStatusForm } from "@/components/check/LegalStatusForm";
import { ReplyCheckForm } from "@/components/check/ReplyCheckForm";
import { RoleSelector } from "@/components/check/RoleSelector";

export default function PressesjekkPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <PublicHeader />
        <CheckIntro />

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <section className="space-y-6">
            <RoleSelector />
            <ArticleInputForm />
            <ReplyCheckForm />
            <LegalStatusForm />
            <EvidenceUploadBox />
          </section>

          <FreeResultCard />
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

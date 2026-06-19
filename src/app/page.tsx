import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { HeroSection } from "@/components/sections/HeroSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { PricingPreviewSection } from "@/components/sections/PricingPreviewSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-8">
        <PublicHeader />
        <HeroSection />
      </section>

      <HowItWorksSection />
      <PricingPreviewSection />
      <PublicFooter />
    </main>
  );
}

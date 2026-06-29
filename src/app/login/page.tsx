import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-[460px]">
          <Link
            href="/"
            className="mb-5 inline-flex text-sm font-semibold text-cyan-700 hover:text-cyan-900"
          >
            ← Tilbake til forsiden
          </Link>

          <AuthForm />
        </div>
      </section>

      <LightPublicFooter />
    </main>
  );
}

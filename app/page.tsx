import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ModuleGrid from "@/components/ModuleGrid";
import Workflow from "@/components/Workflow";
import Security from "@/components/Security";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;

  // Supabase can occasionally return the email verification code to the
  // configured Site URL. If that URL is a Vercel preview deployment, route
  // the code through our callback, which exchanges the session and then
  // redirects to the canonical production site.
  if (params.code) {
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}&next=/dashboard`);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <Hero />
      <ModuleGrid />
      <Workflow />
      <Security />
      <CTA />
      <Footer />
    </main>
  );
}

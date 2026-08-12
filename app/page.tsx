import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ModuleGrid from "@/components/ModuleGrid";
import Workflow from "@/components/Workflow";
import Security from "@/components/Security";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
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
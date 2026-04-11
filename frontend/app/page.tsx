import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Mission } from "@/components/Mission";
import { Problem } from "@/components/Problem";
import { Solution } from "@/components/Solution";
import { Features } from "@/components/Features";
import { LiveIdeaPreview } from "@/components/LiveIdeaPreview";
import { Pricing } from "@/components/Pricing";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <Mission />
      <Problem />
      <Solution />
      <Features />
      <LiveIdeaPreview />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}

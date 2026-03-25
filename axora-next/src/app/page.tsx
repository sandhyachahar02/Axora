import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";
import { ScrollRevealProvider } from "@/components/ui/ScrollRevealProvider";

export default function HomePage() {
  return (
    <>
      {/* Ambient background layers */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute w-[900px] h-[900px] left-1/2 -top-[200px] -translate-x-1/2 rounded-full ambient-purple" />
        <div className="absolute w-[600px] h-[600px] -right-[100px] bottom-[100px] rounded-full ambient-blue" />
      </div>
      <div className="fixed inset-0 pointer-events-none z-0 grid-texture" />

      <LandingNav />

      <main className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CtaSection />
      </main>

      <Footer />
      <ScrollRevealProvider />
    </>
  );
}

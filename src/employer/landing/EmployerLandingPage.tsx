import { EmployerFinalCta } from "./EmployerFinalCta";
import { EmployerHero } from "./EmployerHero";
import { EmployerLogoStrip } from "./EmployerLogoStrip";
import { EmployerMarketplace } from "./EmployerMarketplace";
import { EmployerPricing } from "./EmployerPricing";
import { EmployerStats } from "./EmployerStats";
import { EmployerWhySection } from "./EmployerWhySection";

export default function EmployerLandingPage() {
  return (
    <main className="min-h-screen bg-[oklch(0.99_0.01_180)] text-[oklch(0.18_0.04_240)] antialiased">
      <EmployerHero />
      <EmployerLogoStrip />
      <EmployerMarketplace />
      <EmployerWhySection />
      <EmployerStats />
      <EmployerPricing />
      <EmployerFinalCta />
    </main>
  );
}

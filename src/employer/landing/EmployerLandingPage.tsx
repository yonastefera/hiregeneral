import { EmployerFinalCta } from "./EmployerFinalCta";
import { EmployerHero } from "./EmployerHero";
import { EmployerLogoStrip } from "./EmployerLogoStrip";
import { EmployerMarketplace } from "./EmployerMarketplace";
import { EmployerPricing } from "./EmployerPricing";
import { EmployerStats } from "./EmployerStats";
import { EmployerWhySection } from "./EmployerWhySection";
import { getHiringCompaniesThisWeek } from "./hiring-this-week";

export default async function EmployerLandingPage() {
  const hiringCompanies = await getHiringCompaniesThisWeek().catch((error) => {
    console.error(
      "[EmployerLandingPage] Could not load hiring companies",
      error,
    );
    return [];
  });

  return (
    <main className="isolate min-h-screen overflow-x-hidden bg-[oklch(0.99_0.01_180)] text-[oklch(0.18_0.04_240)] antialiased">
      <EmployerHero companies={hiringCompanies} />
      <EmployerLogoStrip />
      <EmployerMarketplace companies={hiringCompanies} />
      <EmployerWhySection />
      <EmployerStats />
      <EmployerPricing />
      <EmployerFinalCta />
    </main>
  );
}

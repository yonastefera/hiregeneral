import type { JobCardJob } from "@/lib/jobs/card-shape";
import HomeEditorsPicks from "./HomeEditorsPicks";
import HomeFeaturedRoles from "./HomeFeaturedRoles";
import HomeMarketCategories from "./HomeMarketCategories";
import HomeSalaryIntelligence from "./HomeSalaryIntelligence";
import HomeHeroSearchClient from "./HomeHeroSearchClient";
import type { HomeMarketCategory, HomeSalaryBand } from "./home-insights";

interface IndexProps {
  initialHighlightedJobs: JobCardJob[];
  initialSalaryBands: HomeSalaryBand[];
  initialMarketCategories: HomeMarketCategory[];
}

const Index = ({
  initialHighlightedJobs,
  initialMarketCategories,
  initialSalaryBands,
}: IndexProps) => {
  return (
    <main
      className="min-h-screen overflow-x-clip bg-background"
      id="main-content"
    >
      <section
        aria-labelledby="home-hero-heading"
        className="relative -mt-16 overflow-visible bg-hero-gradient pb-16 pt-24 md:pb-20 md:pt-28 lg:min-h-175"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 12% 25%, oklch(0.95 0.08 190) 0%, transparent 60%), radial-gradient(50% 40% at 88% 15%, oklch(0.94 0.08 30) 0%, transparent 60%), radial-gradient(40% 40% at 50% 90%, oklch(0.96 0.05 150) 0%, transparent 60%)",
          }}
        />

        <div className="mx-auto grid w-full max-w-7xl min-w-0 items-center gap-12 px-4 pb-20 pt-20 sm:px-6 md:pt-28 lg:grid-cols-12 lg:pt-32">
          <div className="min-w-0 lg:col-span-7">
            <h1
              id="home-hero-heading"
              className="text-[clamp(2.75rem,6vw,5rem)] font-semibold leading-[1.02] tracking-tight"
            >
              Search <span className="italic text-teal-600">smarter.</span>
              <br />
              Hire <span className="italic text-teal-600">faster.</span> Move
              <br />
              with HireGeneral.
            </h1>

            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-neutral-600">
              Find better-fit roles, save opportunities, and connect with
              recruiters through focused job search and rich profiles.
            </p>

            <HomeHeroSearchClient />
          </div>

          <HomeFeaturedRoles jobs={initialHighlightedJobs} />
        </div>
      </section>

      <HomeEditorsPicks jobs={initialHighlightedJobs} />
      <HomeSalaryIntelligence salaryBands={initialSalaryBands} />
      <HomeMarketCategories categories={initialMarketCategories} />
    </main>
  );
};

export default Index;

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { JobCardJob } from "@/lib/jobs/card-shape";
import HomeEditorsPicks from "./HomeEditorsPicks";
import HomeFeaturedRoles from "./HomeFeaturedRoles";
import HomeMarketCategories from "./HomeMarketCategories";
import HomeSalaryIntelligence from "./HomeSalaryIntelligence";
import HomeSearchForm, {
  type SelectedKeyword,
  type SelectedLocation,
} from "./HomeSearchForm";
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
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [selectedKeyword, setSelectedKeyword] =
    useState<SelectedKeyword | null>(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const useMyLocation = () => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationQuery("Current location");
        setSelectedLocation(null);
      },
      () => {
        setLocationError("Could not access your location.");
      },
    );
  };

  const searchJobs = () => {
    const params = new URLSearchParams();
    const trimmedQuery = query.trim();
    const trimmedLocation = locationQuery.trim();

    if (selectedKeyword) {
      params.set("q", selectedKeyword.term);
    } else if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }

    if (selectedLocation) {
      params.set("city", selectedLocation.city);
      params.set("state", selectedLocation.state);

      if (selectedLocation.zip_code) {
        params.set("zip", selectedLocation.zip_code);
      }

      params.set(
        "location",
        `${selectedLocation.city}, ${selectedLocation.state}`,
      );
    } else if (trimmedLocation) {
      params.set("location", trimmedLocation);
    }

    const queryString = params.toString();
    router.push(queryString ? `/jobs?${queryString}` : "/jobs");
  };

  return (
    <main className="min-h-screen bg-background" id="main-content">
      <section
        aria-labelledby="home-hero-heading"
        className="relative -mt-16 overflow-visible bg-hero-gradient px-4 pb-16 pt-24 md:pb-20 md:pt-28 lg:min-h-175"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 12% 25%, oklch(0.95 0.08 190) 0%, transparent 60%), radial-gradient(50% 40% at 88% 15%, oklch(0.94 0.08 30) 0%, transparent 60%), radial-gradient(40% 40% at 50% 90%, oklch(0.96 0.05 150) 0%, transparent 60%)",
          }}
        />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-24 md:pt-28 lg:grid-cols-12 lg:pt-20">
          <div className="lg:col-span-7">
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
              A minimal job board for candidates and recruiters with public job
              search, secure saved listings, recruiter posting, and rich
              profiles.
            </p>

            <HomeSearchForm
              query={query}
              locationQuery={locationQuery}
              locationError={locationError}
              onQueryChange={setQuery}
              onKeywordSelect={setSelectedKeyword}
              onLocationQueryChange={(value) => {
                setLocationQuery(value);
                setLocationError(null);
              }}
              onLocationSelect={(location) => {
                setSelectedLocation(location);
                setLocationError(null);
              }}
              onUseMyLocation={useMyLocation}
              onSubmit={searchJobs}
            />
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

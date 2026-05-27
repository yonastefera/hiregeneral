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
import { buildJobsSearchParams } from "./home-search-params";

interface IndexProps {
  initialHighlightedJobs: JobCardJob[];
  initialSalaryBands: HomeSalaryBand[];
  initialMarketCategories: HomeMarketCategory[];
}

type ReverseLocationResponse = {
  location?: SelectedLocation;
  error?: string;
};

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
  const [isLocating, setIsLocating] = useState(false);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedKeyword(null);
  };

  const handleKeywordSelect = (keyword: SelectedKeyword | null) => {
    setSelectedKeyword(keyword);

    if (keyword) {
      setQuery(keyword.term);
    }
  };

  const handleLocationQueryChange = (value: string) => {
    setLocationQuery(value);
    setLocationError(null);
    setSelectedLocation(null);
  };

  const handleLocationSelect = (location: SelectedLocation | null) => {
    setSelectedLocation(location);
    setLocationError(null);

    if (location) {
      setLocationQuery(`${location.city}, ${location.state}`);
    }
  };

  const reverseGeocodeCurrentPosition = async (
    position: GeolocationPosition,
  ) => {
    const params = new URLSearchParams({
      lat: String(position.coords.latitude),
      lng: String(position.coords.longitude),
    });

    const response = await fetch(`/api/locations/reverse?${params.toString()}`);
    const body = (await response.json()) as ReverseLocationResponse;

    if (!response.ok || !body.location) {
      throw new Error(body.error ?? "Could not resolve your location.");
    }

    return body.location;
  };

  /*
    IMPORTANT:
    This function is only called by the crosshair icon button inside
    HomeSearchForm.tsx. There is no useEffect, no mount-time call, and no
    automatic page-load permission request.
  */
  const useMyLocation = () => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const location = await reverseGeocodeCurrentPosition(position);

          setSelectedLocation(location);
          setLocationQuery(`${location.city}, ${location.state}`);
          setLocationError(null);
        } catch (error) {
          console.error("[useMyLocation:reverseGeocode]", error);

          setSelectedLocation(null);
          setLocationQuery("");
          setLocationError(
            "We found your coordinates but could not convert them into a city and state.",
          );
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setSelectedLocation(null);
        setLocationError("Could not access your location.");
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    );
  };

  const searchJobs = () => {
    const params = buildJobsSearchParams({
      query,
      selectedKeyword,
      locationQuery,
      selectedLocation,
    });

    const queryString = params.toString();

    router.push(queryString ? `/jobs?${queryString}` : "/jobs");
  };

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

        <div className="mx-auto grid w-full max-w-7xl min-w-0 items-center gap-12 px-4 pb-20 pt-24 sm:px-6 md:pt-28 lg:grid-cols-12 lg:pt-20">
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

            <HomeSearchForm
              query={query}
              locationQuery={locationQuery}
              locationError={locationError}
              isLocating={isLocating}
              onQueryChange={handleQueryChange}
              onKeywordSelect={handleKeywordSelect}
              onLocationQueryChange={handleLocationQueryChange}
              onLocationSelect={handleLocationSelect}
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

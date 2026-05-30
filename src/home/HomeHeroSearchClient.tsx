"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import HomeSearchForm, {
  type SelectedKeyword,
  type SelectedLocation,
} from "./HomeSearchForm";
import { buildJobsSearchParams } from "./home-search-params";

type ReverseLocationResponse = {
  location?: SelectedLocation;
  error?: string;
};

export default function HomeHeroSearchClient() {
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
  );
}

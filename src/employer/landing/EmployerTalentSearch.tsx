"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";

import LocationAutocomplete from "@/components/location/LocationAutocomplete";
import type { LocationSuggestion } from "@/components/location/location-types";
import KeywordAutocomplete from "@/components/search/KeywordAutocomplete";
import type { KeywordSuggestion } from "@/components/search/keyword-types";

function locationLabel(location: LocationSuggestion) {
  return (
    location.label || [location.city, location.state].filter(Boolean).join(", ")
  ).trim();
}

export function EmployerTalentSearch() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [selectedKeyword, setSelectedKeyword] =
    useState<KeywordSuggestion | null>(null);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSuggestion | null>(null);

  const submitSearch = () => {
    const params = new URLSearchParams();
    const nextKeyword = selectedKeyword?.term || keyword.trim();
    const nextLocation = selectedLocation
      ? locationLabel(selectedLocation)
      : location.trim();

    if (nextKeyword) {
      params.set("q", nextKeyword);
    }

    if (nextLocation) {
      params.set("location", nextLocation);
    }

    router.push(`/jobs${params.size > 0 ? `?${params.toString()}` : ""}`);
  };

  return (
    <form
      role="search"
      aria-label="Search hiring market"
      className="relative z-50 mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-black/5 bg-white/80 p-2 shadow-sm backdrop-blur sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch();
      }}
    >
      <div className="relative min-w-0 flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-neutral-400"
        />

        <label htmlFor="employer-talent-keyword" className="sr-only">
          Role, skill, or department
        </label>

        <KeywordAutocomplete
          id="employer-talent-keyword"
          value={keyword}
          placeholder="Role, skill, or department"
          showClearButton={false}
          containerClassName="z-50"
          className="h-12 border-0 bg-transparent pl-11 pr-3 shadow-none focus-visible:ring-0"
          onValueChange={(value) => {
            setKeyword(value);

            if (!value.trim()) {
              setSelectedKeyword(null);
            }
          }}
          onKeywordSelect={(suggestion) => {
            setSelectedKeyword(suggestion);
            setKeyword(suggestion.term);
          }}
          onClear={() => setSelectedKeyword(null)}
        />
      </div>

      <div className="hidden w-px bg-black/5 sm:block" />

      <div className="relative min-w-0 flex-1">
        <MapPin
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-neutral-400"
        />

        <label htmlFor="employer-talent-location" className="sr-only">
          Location or remote
        </label>

        <LocationAutocomplete
          id="employer-talent-location"
          value={location}
          placeholder="Location or remote"
          showClearButton={false}
          containerClassName="z-50"
          className="h-12 border-0 bg-transparent pl-11 pr-3 shadow-none focus-visible:ring-0"
          onValueChange={(value) => {
            setLocation(value);

            if (!value.trim()) {
              setSelectedLocation(null);
            }
          }}
          onLocationSelect={(suggestion) => {
            const nextLabel = locationLabel(suggestion);

            setSelectedLocation({ ...suggestion, label: nextLabel });
            setLocation(nextLabel);
          }}
          onClear={() => setSelectedLocation(null)}
        />
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-500 px-6 py-3 font-medium text-white transition hover:bg-teal-600"
      >
        Search talent
      </button>
    </form>
  );
}

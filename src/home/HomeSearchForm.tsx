"use client";

import dynamic from "next/dynamic";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";

import type { LocationSuggestion } from "@/components/location/location-types";
import type { KeywordSuggestion } from "@/components/search/keyword-types";

const KeywordAutocomplete = dynamic(
  () => import("@/components/search/KeywordAutocomplete"),
  {
    ssr: false,
    loading: () => (
      <input
        disabled
        placeholder="Title, company, skill, keyword"
        className="h-12 w-full border-0 bg-transparent py-3 pl-10 pr-4 text-sm text-neutral-400 shadow-none outline-none placeholder:text-neutral-400"
      />
    ),
  },
);

const LocationAutocomplete = dynamic(
  () => import("@/components/location/LocationAutocomplete"),
  {
    ssr: false,
    loading: () => (
      <input
        disabled
        placeholder="Location"
        className="h-12 w-full border-0 bg-transparent py-3 pl-10 pr-12 text-sm text-neutral-400 shadow-none outline-none placeholder:text-neutral-400"
      />
    ),
  },
);

export type SelectedKeyword = {
  term: string;
  label: string;
  category: string | null;
};

export type SelectedLocation = {
  city: string;
  state: string;
  zip_code: string | null;
  label: string;
};

type HomeSearchFormProps = {
  query: string;
  locationQuery: string;
  locationError: string | null;
  isLocating?: boolean;
  onQueryChange: (value: string) => void;
  onKeywordSelect: (keyword: SelectedKeyword | null) => void;
  onLocationQueryChange: (value: string) => void;
  onLocationSelect: (location: SelectedLocation | null) => void;
  onUseMyLocation: () => void;
  onSubmit: () => void;
};

export function toSelectedKeyword(
  suggestion: KeywordSuggestion,
): SelectedKeyword {
  return {
    term: suggestion.term,
    label: suggestion.label,
    category: suggestion.category,
  };
}

export function toSelectedLocation(
  location: LocationSuggestion,
): SelectedLocation {
  return {
    city: location.city,
    state: location.state,
    zip_code: location.zip_code,
    label: location.label,
  };
}

export default function HomeSearchForm({
  query,
  locationQuery,
  locationError,
  isLocating = false,
  onKeywordSelect,
  onLocationQueryChange,
  onLocationSelect,
  onQueryChange,
  onSubmit,
  onUseMyLocation,
}: HomeSearchFormProps) {
  return (
    <form
      role="search"
      aria-label="Job search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="relative z-30 mt-8 w-full max-w-2xl min-w-0 overflow-visible"
    >
      <div className="relative z-30 grid w-full max-w-2xl min-w-0 grid-cols-1 gap-2 overflow-visible rounded-2xl border border-black/5 bg-white/80 p-2 shadow-sm backdrop-blur sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div className="relative z-30 min-w-0 overflow-visible rounded-xl transition focus-within:bg-white/70">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          />

          <label htmlFor="homeKeywordSearch" className="sr-only">
            Search by job title, company, skill, or keyword
          </label>

          <KeywordAutocomplete
            id="homeKeywordSearch"
            value={query}
            placeholder="Title, company, skill, keyword"
            showClearButton={false}
            containerClassName="relative w-full"
            className="h-12 w-full border-0 bg-transparent py-3 pl-10 pr-4 text-sm shadow-none outline-none placeholder:text-neutral-400 focus-visible:ring-0"
            onValueChange={(value) => {
              onQueryChange(value);

              if (!value.trim()) {
                onKeywordSelect(null);
              }
            }}
            onKeywordSelect={(suggestion) => {
              onKeywordSelect(toSelectedKeyword(suggestion));
            }}
            onClear={() => {
              onKeywordSelect(null);
            }}
          />
        </div>

        <div className="relative z-30 min-w-0 overflow-visible rounded-xl transition focus-within:bg-white/70">
          <MapPin
            className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          />

          <label htmlFor="homeLocationSearch" className="sr-only">
            Search by city, state, remote, or ZIP code
          </label>

          <LocationAutocomplete
            id="homeLocationSearch"
            value={locationQuery}
            placeholder="Location"
            showClearButton={false}
            containerClassName="relative w-full"
            className="h-12 w-full border-0 bg-transparent py-3 pl-10 pr-12 text-sm shadow-none outline-none placeholder:text-neutral-400 focus-visible:ring-0"
            onValueChange={(value) => {
              onLocationQueryChange(value);

              if (!value.trim()) {
                onLocationSelect(null);
              }
            }}
            onLocationSelect={(location) => {
              onLocationSelect(toSelectedLocation(location));
            }}
            onClear={() => {
              onLocationSelect(null);
            }}
          />

          <button
            type="button"
            aria-label={
              isLocating
                ? "Finding your current location"
                : "Use my current location"
            }
            aria-busy={isLocating}
            onClick={onUseMyLocation}
            disabled={isLocating}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-teal-600 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Crosshair className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          Search
        </button>
      </div>

      {locationError ? (
        <p
          className="mt-3 px-3 text-sm text-neutral-500"
          role="status"
          aria-live="polite"
        >
          {locationError}
        </p>
      ) : null}
    </form>
  );
}

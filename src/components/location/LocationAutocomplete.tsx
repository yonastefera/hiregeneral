"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import type {
  LocationSearchResponse,
  LocationSuggestion,
} from "./location-types";

type LocationAutocompleteProps = {
  id?: string;
  value: string;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
  minQueryLength?: number;
  debounceMs?: number;
  showClearButton?: boolean;
  onValueChange: (value: string) => void;
  onLocationSelect: (location: LocationSuggestion) => void;
  onClear?: () => void;
};

const DEFAULT_MIN_QUERY_LENGTH = 2;
const DEFAULT_DEBOUNCE_MS = 80;

function getLocationLabel(location: LocationSuggestion) {
  return (
    location.label || [location.city, location.state].filter(Boolean).join(", ")
  ).trim();
}

export default function LocationAutocomplete({
  id = "location",
  value,
  placeholder = "City, State, or ZIP",
  className,
  containerClassName,
  disabled = false,
  minQueryLength = DEFAULT_MIN_QUERY_LENGTH,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  showClearButton = true,
  onValueChange,
  onLocationSelect,
  onClear,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const cacheRef = useRef<Record<string, LocationSuggestion[]>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const latestQueryRef = useRef("");

  useEffect(() => {
    const query = value.trim();
    const cacheKey = query.toLowerCase();

    latestQueryRef.current = cacheKey;

    if (query.length < minQueryLength) {
      setSuggestions([]);
      return;
    }

    const cachedSuggestions = cacheRef.current[cacheKey];

    if (cachedSuggestions) {
      setSuggestions(cachedSuggestions);
      return;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/locations?query=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Could not fetch location suggestions.");
        }

        const payload = (await response.json()) as LocationSearchResponse;

        const nextSuggestions = (payload.locations ?? []).filter(
          (location) => getLocationLabel(location).length > 0,
        );

        cacheRef.current[cacheKey] = nextSuggestions;

        if (latestQueryRef.current === cacheKey) {
          setSuggestions(nextSuggestions);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("[location-autocomplete] request failed:", error);
      }
    }, debounceMs);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [value, minQueryLength, debounceMs]);

  const hasEnoughQuery = value.trim().length >= minQueryLength;

  const shouldShowDropdown =
    showSuggestions && hasEnoughQuery && suggestions.length > 0;

  const clear = () => {
    onValueChange("");
    setSuggestions([]);
    setShowSuggestions(false);
    latestQueryRef.current = "";
    onClear?.();
    inputRef.current?.focus();
  };

  const selectLocation = (location: LocationSuggestion) => {
    const label = getLocationLabel(location);

    onValueChange(label);
    onLocationSelect({
      ...location,
      label,
    });
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div
      className={["relative w-full", containerClassName]
        .filter(Boolean)
        .join(" ")}
    >
      <Input
        ref={inputRef}
        id={id}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => {
          window.setTimeout(() => {
            setShowSuggestions(false);
          }, 160);
        }}
        onChange={(event) => {
          onValueChange(event.target.value);
          setShowSuggestions(true);
        }}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={shouldShowDropdown}
        aria-controls={`${id}-suggestions`}
        className={["h-12 w-full pr-10", className].filter(Boolean).join(" ")}
      />

      {showClearButton && value && !disabled && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear location"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}

      {shouldShowDropdown && (
        <div className="absolute left-0 top-full z-9999 mt-2 w-full min-w-full overflow-hidden rounded-xl border border-[#f2f2f2] bg-white text-sm font-normal leading-5 tracking-normal text-foreground shadow-lg">
          <ul
            id={`${id}-suggestions`}
            className="max-h-64 w-full overflow-y-auto p-1"
            role="listbox"
          >
            {suggestions.map((location) => {
              const displayLabel = getLocationLabel(location);

              return (
                <li key={location.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectLocation(location)}
                    className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium leading-5 tracking-normal text-foreground hover:bg-neutral-200 focus:bg-neutral-200 focus:outline-none"
                  >
                    <span className="block min-w-0 flex-1 truncate whitespace-nowrap">
                      {displayLabel}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

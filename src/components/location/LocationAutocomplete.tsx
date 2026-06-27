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
  const [activeIndex, setActiveIndex] = useState(-1);

  const cacheRef = useRef<Record<string, LocationSuggestion[]>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const latestQueryRef = useRef("");

  useEffect(() => {
    const query = value.trim();
    const cacheKey = query.toLowerCase();

    latestQueryRef.current = cacheKey;
    setActiveIndex(-1);

    if (query.length < minQueryLength) {
      setSuggestions((current) => (current.length > 0 ? [] : current));
      return;
    }

    const cachedSuggestions = cacheRef.current[cacheKey];

    if (cachedSuggestions) {
      setSuggestions((current) =>
        current === cachedSuggestions ? current : cachedSuggestions,
      );
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
          setSuggestions((current) => {
            const sameLength = current.length === nextSuggestions.length;
            const sameItems =
              sameLength &&
              current.every(
                (item, index) => item.id === nextSuggestions[index]?.id,
              );

            return sameItems ? current : nextSuggestions;
          });
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

  const activeOptionId =
    activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined;

  const clear = () => {
    onValueChange("");
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
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
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
      return;
    }

    if (suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setShowSuggestions(true);
      setActiveIndex((current) =>
        current < suggestions.length - 1 ? current + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setShowSuggestions(true);
      setActiveIndex((current) =>
        current > 0 ? current - 1 : suggestions.length - 1,
      );
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();

      const selectedLocation = suggestions[activeIndex];

      if (selectedLocation) {
        selectLocation(selectedLocation);
      }
    }
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
        onFocus={() => {
          setShowSuggestions(true);
        }}
        onBlur={() => {
          window.setTimeout(() => {
            setShowSuggestions(false);
            setActiveIndex(-1);
          }, 160);
        }}
        onChange={(event) => {
          onValueChange(event.target.value);
          setShowSuggestions(true);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={shouldShowDropdown}
        aria-controls={shouldShowDropdown ? `${id}-suggestions` : undefined}
        aria-activedescendant={activeOptionId}
        className={["h-12 w-full pr-10", className].filter(Boolean).join(" ")}
      />

      {showClearButton && value && !disabled ? (
        <button
          type="button"
          onClick={clear}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          aria-label="Clear location"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}

      {shouldShowDropdown ? (
        <div className="absolute left-0 top-full z-[9999] mt-2 w-full min-w-full overflow-hidden rounded-xl border border-[#f2f2f2] bg-white text-sm font-normal leading-5 tracking-normal text-foreground shadow-lg">
          <ul
            id={`${id}-suggestions`}
            className="max-h-64 w-full overflow-y-auto p-1"
            role="listbox"
            aria-label="Location suggestions"
          >
            {suggestions.map((location, index) => {
              const displayLabel = getLocationLabel(location);
              const isActive = activeIndex === index;

              return (
                <li
                  id={`${id}-option-${index}`}
                  key={location.id}
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onMouseEnter={() => {
                    setActiveIndex(index);
                  }}
                  onClick={() => {
                    selectLocation(location);
                  }}
                  className={[
                    "cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm font-medium leading-5 tracking-normal text-foreground outline-none",
                    isActive ? "bg-neutral-200" : "hover:bg-neutral-200",
                  ].join(" ")}
                >
                  <span className="block min-w-0 flex-1 truncate whitespace-nowrap">
                    {displayLabel}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { KeywordSearchResponse, KeywordSuggestion } from "./keyword-types";

type KeywordAutocompleteProps = {
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
  onKeywordSelect: (suggestion: KeywordSuggestion) => void;
  onClear?: () => void;
};

const DEFAULT_MIN_QUERY_LENGTH = 2;
const DEFAULT_DEBOUNCE_MS = 80;

const HOT_KEYWORDS: KeywordSuggestion[] = [
  "Software Developer",
  "Software Engineer",
  "Registered Nurse",
  "Nurse Practitioner",
  "Medical Assistant",
  "Physician Assistant",
  "Financial Analyst",
  "Accountant",
  "Electrical Engineer",
  "Electrician",
  "Teacher",
  "Data Analyst",
  "Data Engineer",
  "Project Manager",
  "Product Manager",
  "Java Developer",
  "Python Developer",
  "React Developer",
  "Warehouse Associate",
  "Customer Service Representative",
].map((term, index) => ({
  id: `hot-${index}`,
  term,
  label: term,
  category: "popular",
}));

function getLocalKeywordMatches(query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length < DEFAULT_MIN_QUERY_LENGTH) {
    return [];
  }

  return HOT_KEYWORDS.filter((suggestion) =>
    suggestion.term.toLowerCase().includes(normalizedQuery),
  ).slice(0, 5);
}

export default function KeywordAutocomplete({
  id = "keyword",
  value,
  placeholder = "Title, company, skill, keyword",
  className,
  containerClassName,
  disabled = false,
  minQueryLength = DEFAULT_MIN_QUERY_LENGTH,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  showClearButton = true,
  onValueChange,
  onKeywordSelect,
  onClear,
}: KeywordAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const cacheRef = useRef<Record<string, KeywordSuggestion[]>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const query = value.trim();
    const cacheKey = query.toLowerCase();

    setActiveIndex(-1);

    if (query.length < minQueryLength) {
      setSuggestions((current) => (current.length > 0 ? [] : current));
      setLoadingSuggestions((current) => (current ? false : current));
      return;
    }

    const cachedSuggestions = cacheRef.current[cacheKey];

    if (cachedSuggestions) {
      setSuggestions((current) =>
        current === cachedSuggestions ? current : cachedSuggestions,
      );
      setLoadingSuggestions((current) => (current ? false : current));
      return;
    }

    const localMatches = getLocalKeywordMatches(query);

    if (localMatches.length > 0) {
      setSuggestions((current) => {
        const sameLength = current.length === localMatches.length;
        const sameItems =
          sameLength &&
          current.every((item, index) => item.id === localMatches[index]?.id);

        return sameItems ? current : localMatches;
      });
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      setLoadingSuggestions(true);

      try {
        const response = await fetch(
          `/api/keyword-suggestions?query=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Could not fetch keyword suggestions.");
        }

        const payload = (await response.json()) as KeywordSearchResponse;
        const nextSuggestions = payload.suggestions ?? [];

        cacheRef.current[cacheKey] = nextSuggestions;

        if (nextSuggestions.length > 0) {
          setSuggestions(nextSuggestions);
        } else if (localMatches.length > 0) {
          setSuggestions(localMatches);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("[keyword-autocomplete] request failed:", error);

        if (localMatches.length > 0) {
          setSuggestions(localMatches);
        } else {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSuggestions(false);
        }
      }
    }, debounceMs);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [value, minQueryLength, debounceMs]);

  const shouldShowDropdown =
    showSuggestions &&
    value.trim().length >= minQueryLength &&
    (suggestions.length > 0 || loadingSuggestions);

  const activeOptionId =
    activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined;

  const clear = () => {
    onValueChange("");
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    onClear?.();
    inputRef.current?.focus();
  };

  const selectKeyword = (suggestion: KeywordSuggestion) => {
    onValueChange(suggestion.term);
    onKeywordSelect(suggestion);
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

      const selectedSuggestion = suggestions[activeIndex];

      if (selectedSuggestion) {
        selectKeyword(selectedSuggestion);
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
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => {
          window.setTimeout(() => {
            setShowSuggestions(false);
            setActiveIndex(-1);
          }, 180);
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
          aria-label="Clear keyword"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}

      {shouldShowDropdown ? (
        <div className="absolute left-0 right-0 top-full z-[9999] mt-2 w-full overflow-hidden rounded-xl border border-[#f2f2f2] bg-white text-sm font-normal leading-5 tracking-normal text-foreground shadow-lg">
          {suggestions.length > 0 ? (
            <ul
              id={`${id}-suggestions`}
              className="max-h-64 w-full overflow-y-auto p-1"
              role="listbox"
              aria-label="Keyword suggestions"
            >
              {suggestions.map((suggestion, index) => {
                const isActive = activeIndex === index;

                return (
                  <li
                    id={`${id}-option-${index}`}
                    key={suggestion.id}
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onMouseEnter={() => {
                      setActiveIndex(index);
                    }}
                    onClick={() => {
                      selectKeyword(suggestion);
                    }}
                    className={[
                      "cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm font-medium leading-5 tracking-normal text-foreground outline-none",
                      isActive ? "bg-neutral-200" : "hover:bg-neutral-200",
                    ].join(" ")}
                  >
                    <span className="block truncate whitespace-nowrap">
                      {suggestion.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {loadingSuggestions && suggestions.length === 0 ? (
            <div
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              Searching suggestions...
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

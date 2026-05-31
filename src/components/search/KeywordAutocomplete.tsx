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

  const cacheRef = useRef<Record<string, KeywordSuggestion[]>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const query = value.trim();
    const cacheKey = query.toLowerCase();

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

  const clear = () => {
    onValueChange("");
    setSuggestions([]);
    setShowSuggestions(false);
    onClear?.();
    inputRef.current?.focus();
  };

  const selectKeyword = (suggestion: KeywordSuggestion) => {
    onValueChange(suggestion.term);
    onKeywordSelect(suggestion);
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
          }, 180);
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
          aria-label="Clear keyword"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}

      {shouldShowDropdown && (
        <div className="absolute left-0 right-0 top-full z-[9999] mt-2 w-full overflow-hidden rounded-xl border border-[#f2f2f2] bg-white text-sm font-normal leading-5 tracking-normal text-foreground shadow-lg">
          <ul
            id={`${id}-suggestions`}
            className="max-h-64 w-full overflow-y-auto p-1"
            role="listbox"
          >
            {suggestions.map((suggestion) => (
              <li key={suggestion.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectKeyword(suggestion)}
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium leading-5 tracking-normal text-foreground hover:bg-neutral-200 focus:bg-neutral-200 focus:outline-none"
                >
                  <span className="block truncate whitespace-nowrap">
                    {suggestion.label}
                  </span>
                </button>
              </li>
            ))}

            {loadingSuggestions && suggestions.length === 0 && (
              <li className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
                <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                Searching suggestions...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  Database,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
  TrendingUp,
} from "lucide-react";

import type { LocationSuggestion } from "@/components/location/location-types";
import type { KeywordSuggestion } from "@/components/search/keyword-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SalarySample = {
  id: string;
  companyName: string;
  title: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  midpoint: number;
  url: string | null;
  formattedSalaryMin: string | null;
  formattedSalaryMax: string | null;
};

type BlsSalary = {
  occupationCode: string;
  occupationName: string;
  areaName: string;
  releasePeriod: string;
  employment: number | null;
  annualMean: number | null;
  annualP25: number | null;
  annualP75: number | null;
  hourlyMedian: number | null;
  sourceName: string;
  sourceUrl: string;
} | null;

type SalaryResponse = {
  career: string;
  location: string;
  source: "bls_oews" | "hiregeneral" | "benchmark";
  dataSource: string;
  sampleCount: number;
  confidence: "high" | "medium" | "benchmark";
  range: {
    low: number | null;
    median: number | null;
    high: number | null;
    formattedLow: string | null;
    formattedMedian: string | null;
    formattedHigh: string | null;
  };
  bls: BlsSalary;
  samples: SalarySample[];
  error?: string;
};

const HOURS_PER_YEAR = 2080;

const popularSearches = [
  { career: "Software Engineer", location: "Atlanta, GA" },
  { career: "Registered Nurse", location: "Atlanta, GA" },
  { career: "Civil Engineer", location: "Charlotte, NC" },
  { career: "Financial Analyst", location: "Chicago, IL" },
];

const KeywordAutocomplete = dynamic(
  () => import("@/components/search/KeywordAutocomplete"),
  {
    ssr: false,
    loading: () => (
      <input
        disabled
        placeholder="Software Engineer"
        className="h-13 w-full border-0 bg-transparent pl-11 pr-3 text-base text-muted-foreground shadow-none outline-none placeholder:text-muted-foreground"
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
        placeholder="Atlanta, GA"
        className="h-13 w-full border-0 bg-transparent pl-11 pr-3 text-base text-muted-foreground shadow-none outline-none placeholder:text-muted-foreground"
      />
    ),
  },
);

function formatMoney(value: number | null, mode: "year" | "hour") {
  if (value === null) return null;

  const nextValue = mode === "hour" ? value / HOURS_PER_YEAR : value;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: mode === "hour" ? 2 : 0,
  }).format(nextValue);
}

function confidenceLabel(
  confidence: SalaryResponse["confidence"],
  source: SalaryResponse["source"],
) {
  if (source === "bls_oews") return "BLS benchmark";
  if (confidence === "high") return "High confidence";
  if (confidence === "medium") return "Medium confidence";

  return "Estimate";
}

function formatInteger(value: number | null) {
  if (value === null) return "Not reported";

  return new Intl.NumberFormat("en-US").format(value);
}

function toSalaryLocationLabel(location: LocationSuggestion) {
  return (
    location.label || [location.city, location.state].filter(Boolean).join(", ")
  ).trim();
}

export default function SalariesPage() {
  const [career, setCareer] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<SalaryResponse | null>(null);
  const [payMode, setPayMode] = useState<"year" | "hour">("year");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const range = result?.range;

  const medianPercent = useMemo(() => {
    if (
      !range?.low ||
      !range.high ||
      !range.median ||
      range.high === range.low
    ) {
      return 50;
    }

    return Math.min(
      100,
      Math.max(
        0,
        ((range.median - range.low) / (range.high - range.low)) * 100,
      ),
    );
  }, [range?.high, range?.low, range?.median]);

  async function calculate(nextCareer = career, nextLocation = location) {
    const trimmedCareer = nextCareer.trim();
    const trimmedLocation = nextLocation.trim();

    if (!trimmedCareer) {
      setError("Enter a career name to calculate salary.");
      return;
    }

    setCareer(nextCareer);
    setLocation(nextLocation);
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ career: trimmedCareer });

      if (trimmedLocation) {
        params.set("location", trimmedLocation);
      }

      const response = await fetch(`/api/salaries?${params.toString()}`, {
        cache: "no-store",
      });

      const body = (await response.json()) as SalaryResponse;

      if (!response.ok) {
        throw new Error(body.error ?? "Could not calculate salary.");
      }

      setResult(body);
      setPayMode("year");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not calculate salary.",
      );
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setCareer("");
    setLocation("");
    setResult(null);
    setPayMode("year");
    setError(null);
  }

  const low = formatMoney(result?.range.low ?? null, payMode);
  const median = formatMoney(result?.range.median ?? null, payMode);
  const high = formatMoney(result?.range.high ?? null, payMode);
  const payPeriodLabel = payMode === "year" ? "year" : "hour";
  const rangeLabel =
    payMode === "year" ? "Annual salary range" : "Hourly wage range";

  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-visible bg-hero-gradient px-4 py-16 md:py-24">
        <div className="pointer-events-none absolute -left-24 top-20 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-12 size-80 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-10 md:px-6 lg:grid-cols-[1fr_440px] lg:items-center">
          <div>
            <h1 className="mt-16 max-w-3xl text-balance text-5xl font-semibold tracking-[-0.04em] text-foreground md:text-7xl lg:text-[4.25rem] lg:leading-[0.95]">
              Know your{" "}
              <span className="text-gradient-primary">market rate</span> before
              you apply.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
              Search a career and US location to compare BLS wage benchmarks
              with salary ranges we see in active job postings.
            </p>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                {
                  icon: Database,
                  label: "BLS OEWS cache",
                  value: "Official wage data",
                },
                {
                  icon: BarChart3,
                  label: "Percentile range",
                  value: "Low, median, high",
                },
                {
                  icon: BriefcaseBusiness,
                  label: "Market context",
                  value: "Active job samples",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-soft backdrop-blur"
                >
                  <item.icon className="size-5 text-primary" />
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <form
            className="relative z-40 overflow-visible rounded-3xl border border-border/70 bg-card p-6 shadow-lift"
            onSubmit={(event) => {
              event.preventDefault();
              calculate();
            }}
          >
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-primary-gradient text-primary-foreground shadow-pop">
                <Calculator className="size-5" />
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  Calculate salary
                </h2>
                <p className="text-sm text-muted-foreground">
                  Career name and US location
                </p>
              </div>
            </div>

            <div className="relative z-50 mt-6 space-y-3 overflow-visible">
              <div>
                <Label
                  htmlFor="salary-career"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  Career
                </Label>

                <div className="relative z-50 min-h-13 overflow-visible rounded-xl border border-input bg-background transition-colors focus-within:border-primary/50">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground"
                  />

                  <KeywordAutocomplete
                    id="salary-career"
                    value={career}
                    placeholder="Software Engineer"
                    showClearButton={false}
                    containerClassName="relative w-full"
                    className="h-13 w-full border-0 bg-transparent pl-11 pr-3 text-base shadow-none focus-visible:ring-0"
                    onValueChange={setCareer}
                    onKeywordSelect={(suggestion: KeywordSuggestion) => {
                      setCareer(suggestion.term);
                    }}
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="salary-location"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  Location
                </Label>

                <div className="relative z-40 min-h-13 overflow-visible rounded-xl border border-input bg-background transition-colors focus-within:border-primary/50">
                  <MapPin
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground"
                  />

                  <LocationAutocomplete
                    id="salary-location"
                    value={location}
                    placeholder="Atlanta, GA"
                    showClearButton={false}
                    containerClassName="relative w-full"
                    className="h-13 w-full border-0 bg-transparent pl-11 pr-3 text-base shadow-none focus-visible:ring-0"
                    onValueChange={setLocation}
                    onLocationSelect={(locationSuggestion) => {
                      setLocation(toSalaryLocationLabel(locationSuggestion));
                    }}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="xl"
              className="mt-5 h-13 w-full bg-primary-gradient"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Finding salary
                </>
              ) : (
                <>
                  Find salary
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>

            {(career || location || result) && (
              <Button
                type="button"
                variant="ghost"
                className="mt-3 h-10 w-full rounded-full bg-muted/40 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={clearSearch}
              >
                Clear search
              </Button>
            )}

            {error && (
              <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {popularSearches.map((item) => (
                <button
                  key={`${item.career}-${item.location}`}
                  type="button"
                  onClick={() => calculate(item.career, item.location)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {item.career} · {item.location}
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>

      <section className="mb-20 px-4 py-12 md:py-16">
        <div className="mx-auto max-w-7xl md:px-6">
          {!result ? (
            <div className="grid gap-5 lg:grid-cols-3">
              {[
                "Use official occupational wage benchmarks from BLS OEWS.",
                "Compare yearly and hourly pay without leaving the page.",
                "Layer in active job-posting salary ranges when companies disclose pay.",
              ].map((text, index) => (
                <article
                  key={text}
                  className="rounded-3xl border border-border bg-card p-6 shadow-soft"
                >
                  <div className="grid size-10 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                    <span className="text-sm font-bold">{index + 1}</span>
                  </div>
                  <p className="mt-5 text-lg font-semibold leading-7">{text}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Badge
                      variant={
                        result.source === "bls_oews" ? "success" : "soft"
                      }
                    >
                      {confidenceLabel(result.confidence, result.source)}
                    </Badge>

                    <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
                      Salary of a{" "}
                      <span className="text-gradient-primary">
                        {result.career}
                      </span>{" "}
                      in{" "}
                      <span className="text-gradient-primary">
                        {result.location}
                      </span>
                    </h2>

                    <p className="mt-3 text-sm text-muted-foreground">
                      {result.dataSource}
                    </p>
                  </div>

                  <div className="inline-flex rounded-full border border-border bg-muted/40 p-1 shadow-inner">
                    <button
                      type="button"
                      aria-pressed={payMode === "year"}
                      onClick={() => setPayMode("year")}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                        payMode === "year"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Yearly
                    </button>

                    <button
                      type="button"
                      aria-pressed={payMode === "hour"}
                      onClick={() => setPayMode("hour")}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                        payMode === "hour"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Hourly
                    </button>
                  </div>
                </div>

                <div className="mt-8 rounded-3xl border border-border bg-background/70 p-5 shadow-sm md:p-6">
                  <div className="grid gap-6 md:grid-cols-[0.85fr_1.15fr] md:items-end">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        Estimated salary
                      </p>

                      <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
                        <p className="text-5xl font-black tracking-tight text-foreground md:text-6xl">
                          {median ?? "Not enough data"}
                        </p>

                        {median && (
                          <span className="pb-2 text-lg font-semibold text-muted-foreground">
                            /{payPeriodLabel}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Based on the closest BLS occupation and location
                        benchmark.
                      </p>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                        <span>{rangeLabel}</span>
                        <span>Median</span>
                      </div>

                      <div className="relative h-5 overflow-hidden rounded-full bg-muted">
                        <div className="absolute left-[12%] top-1/2 h-3 w-[76%] -translate-y-1/2 rounded-full bg-primary/25" />
                        <div className="absolute left-[25%] top-1/2 h-3 w-[50%] -translate-y-1/2 rounded-full bg-primary/70" />

                        <div
                          className="absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] border-background bg-primary shadow-pop"
                          style={{ left: `${medianPercent}%` }}
                          aria-hidden="true"
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                            Low
                          </p>
                          <p className="mt-1 font-bold text-foreground">
                            {low ?? "—"}
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                            Median
                          </p>
                          <p className="mt-1 font-bold text-foreground">
                            {median ?? "—"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                            High
                          </p>
                          <p className="mt-1 font-bold text-foreground">
                            {high ?? "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      label: payMode === "year" ? "Low annual" : "Low hourly",
                      value: low,
                    },
                    {
                      label: "Median",
                      value: median,
                    },
                    {
                      label: payMode === "year" ? "High annual" : "High hourly",
                      value: high,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-2 text-2xl font-bold tracking-tight">
                        {item.value ?? "Not available"}
                      </p>
                    </div>
                  ))}
                </div>

                {result.samples.length > 0 && (
                  <div className="mt-8 border-t border-border pt-6">
                    <h3 className="text-lg font-bold tracking-tight">
                      Active job salary examples
                    </h3>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {result.samples.slice(0, 4).map((sample) => (
                        <Link
                          key={sample.id}
                          href={sample.url ?? "/jobs"}
                          className="rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
                        >
                          <p className="line-clamp-1 text-sm font-semibold text-foreground">
                            {sample.title}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {sample.companyName} · {sample.location}
                          </p>
                          <p className="mt-3 text-sm font-semibold text-success">
                            {sample.formattedSalaryMin} -{" "}
                            {sample.formattedSalaryMax}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <aside className="space-y-5">
                <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                      <Database className="size-5" />
                    </div>

                    <div>
                      <h3 className="font-bold tracking-tight">Data source</h3>
                      <p className="text-sm text-muted-foreground">
                        {result.source === "bls_oews"
                          ? "Official benchmark"
                          : "Fallback estimate"}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-5 space-y-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Occupation</dt>
                      <dd className="mt-1 font-medium">
                        {result.bls?.occupationName ?? result.career}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-muted-foreground">Location match</dt>
                      <dd className="mt-1 font-medium">
                        {result.bls?.areaName ?? result.location}
                      </dd>
                    </div>

                    {result.bls?.employment && result.bls.employment >= 100 && (
                      <div>
                        <dt className="text-muted-foreground">
                          Employment estimate
                        </dt>
                        <dd className="mt-1 font-medium">
                          {formatInteger(result.bls.employment)}
                        </dd>
                      </div>
                    )}

                    <div>
                      <dt className="text-muted-foreground">Posting samples</dt>
                      <dd className="mt-1 font-medium">{result.sampleCount}</dd>
                    </div>
                  </dl>

                  {result.bls?.sourceUrl && (
                    <Link
                      href={result.bls.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                    >
                      View BLS source
                      <ExternalLink className="size-3.5" />
                    </Link>
                  )}
                </section>

                <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                  <TrendingUp className="size-5 text-primary" />
                  <h3 className="mt-4 font-bold tracking-tight">
                    About this estimate
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    This salary range uses BLS OEWS wage benchmarks for the
                    closest occupation and location match. The low and high
                    values represent percentile wage estimates, not guaranteed
                    offers.
                  </p>
                </section>
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Database,
  Loader2,
  MapPin,
  Search,
  TrendingUp,
} from "lucide-react";

import type { LocationSuggestion } from "@/components/location/location-types";
import type { KeywordSuggestion } from "@/components/search/keyword-types";
import { Button } from "@/components/ui/button";
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

const PRESETS: { title: string; location: string }[] = [
  { title: "Software Engineer", location: "Atlanta, GA" },
  { title: "Registered Nurse", location: "Atlanta, GA" },
  { title: "Civil Engineer", location: "Charlotte, NC" },
  { title: "Financial Analyst", location: "Chicago, IL" },
  { title: "Product Designer", location: "New York, NY" },
  { title: "Data Scientist", location: "Seattle, WA" },
];

const previewResult: SalaryResponse = {
  career: "Software Engineer",
  location: "Atlanta, GA",
  source: "bls_oews",
  dataSource: "BLS OEWS Q2'26",
  sampleCount: 17,
  confidence: "high",
  range: {
    low: 122000,
    median: 149650,
    high: 177290,
    formattedLow: "$122,000",
    formattedMedian: "$149,650",
    formattedHigh: "$177,290",
  },
  bls: {
    occupationCode: "15-1252",
    occupationName: "Software Engineer",
    areaName: "Atlanta, GA metro area",
    releasePeriod: "Q2'26",
    employment: 830,
    annualMean: 149650,
    annualP25: 122000,
    annualP75: 177290,
    hourlyMedian: 71.95,
    sourceName: "BLS OEWS",
    sourceUrl: "https://www.bls.gov/oes/",
  },
  samples: [
    {
      id: "preview-1",
      companyName: "The Home Depot",
      title: "Software Engineer Manager — Data Eng",
      location: "Remote — Atlanta, GA",
      salaryMin: 127000,
      salaryMax: 175290,
      midpoint: 151145,
      url: "/jobs",
      formattedSalaryMin: "$127,000",
      formattedSalaryMax: "$175,290",
    },
    {
      id: "preview-2",
      companyName: "The Home Depot",
      title: "Senior Software Engineer — SAP S4",
      location: "Remote — Atlanta, GA",
      salaryMin: 132000,
      salaryMax: 173290,
      midpoint: 152645,
      url: "/jobs",
      formattedSalaryMin: "$132,000",
      formattedSalaryMax: "$173,290",
    },
    {
      id: "preview-3",
      companyName: "The Home Depot",
      title: "Software Engineer Manager — Data Eng",
      location: "Remote — Atlanta, GA",
      salaryMin: 137000,
      salaryMax: 171290,
      midpoint: 154145,
      url: "/jobs",
      formattedSalaryMin: "$137,000",
      formattedSalaryMax: "$171,290",
    },
    {
      id: "preview-4",
      companyName: "The Home Depot",
      title: "Senior Software Engineer — SAP S4",
      location: "Remote — Atlanta, GA",
      salaryMin: 142000,
      salaryMax: 169290,
      midpoint: 155645,
      url: "/jobs",
      formattedSalaryMin: "$142,000",
      formattedSalaryMax: "$169,290",
    },
  ],
};

const KeywordAutocomplete = dynamic(
  () => import("@/components/search/KeywordAutocomplete"),
  {
    ssr: false,
    loading: () => (
      <input
        disabled
        placeholder="Software Engineer"
        className="h-14 w-full border-0 bg-transparent pl-11 text-[15px] text-muted-foreground shadow-none outline-none"
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
        className="h-14 w-full border-0 bg-transparent pl-11 text-[15px] text-muted-foreground shadow-none outline-none"
      />
    ),
  },
);

const fmt = (n: number) => `$${n.toLocaleString()}`;

function formatMoney(value: number | null, unit: "yearly" | "hourly") {
  if (value === null) return "—";

  if (unit === "hourly") {
    return `$${(value / HOURS_PER_YEAR).toFixed(2)}`;
  }

  return fmt(value);
}

function formatSampleRange(sample: SalarySample) {
  const low = sample.formattedSalaryMin ?? fmt(sample.salaryMin);
  const high = sample.formattedSalaryMax ?? fmt(sample.salaryMax);

  return `${low} – ${high}`;
}

function toSalaryLocationLabel(location: LocationSuggestion) {
  return (
    location.label || [location.city, location.state].filter(Boolean).join(", ")
  ).trim();
}

export default function SalariesPage() {
  const [title, setTitle] = useState("Software Engineer");
  const [location, setLocation] = useState("Atlanta, GA");
  const [unit, setUnit] = useState<"yearly" | "hourly">("yearly");
  const [result, setResult] = useState<SalaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeResult = result ?? previewResult;
  const samples = activeResult.samples.length
    ? activeResult.samples
    : previewResult.samples;
  const sampleCount = activeResult.sampleCount || samples.length;

  const markerPct = useMemo(() => {
    const { low, median, high } = activeResult.range;

    if (low === null || median === null || high === null || high === low) {
      return 50;
    }

    return Math.max(
      8,
      Math.min(92, ((median - low) / Math.max(1, high - low)) * 100),
    );
  }, [activeResult.range]);

  async function calculate(nextTitle = title, nextLocation = location) {
    const trimmedTitle = nextTitle.trim() || "Software Engineer";
    const trimmedLocation = nextLocation.trim() || "Atlanta, GA";

    setTitle(trimmedTitle);
    setLocation(trimmedLocation);
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        career: trimmedTitle,
        location: trimmedLocation,
      });

      const response = await fetch(`/api/salaries?${params.toString()}`);
      const body = (await response.json()) as SalaryResponse;

      if (!response.ok) {
        throw new Error(body.error ?? "Could not calculate salary.");
      }

      setResult(body);
      setUnit("yearly");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not calculate salary.",
      );
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    calculate();
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background">
      <section className="relative overflow-hidden bg-ink text-background">
        <div className="pointer-events-none absolute inset-0 bg-salary-hero-gradient opacity-90" />
        <div className="pointer-events-none absolute -left-32 top-10 size-[520px] rounded-full bg-primary/40 blur-[160px]" />
        <div className="pointer-events-none absolute -right-24 top-24 size-[480px] rounded-full bg-accent/40 blur-[160px]" />
        <div className="pointer-events-none absolute inset-0 noise-dark opacity-50" />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-24 md:px-6 md:pb-32 md:pt-32">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-electric/40 bg-electric/10 px-3 py-1 font-mono-tag text-[10px] font-semibold text-electric">
              <span className="size-1.5 rounded-full bg-electric" />
              BLS-anchored · Updated quarterly
            </div>
            <div className="hidden items-center gap-2 font-mono-tag text-[10px] text-background/60 md:inline-flex">
              <span>Salary engine</span>
              <span className="h-px w-8 bg-background/30" />
              <span className="text-electric">v.04</span>
            </div>
          </div>

          <h1 className="font-display mt-10 max-w-[1100px] text-balance text-[56px] leading-[0.88] tracking-[-0.045em] md:text-[140px]">
            Know your
            <br />
            <span className="text-gradient-electric italic">number</span>{" "}
            <span className="text-outline text-background">before</span>
            <br />
            <span className="text-gradient-warm">you apply.</span>
          </h1>

          <div className="mt-10 grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <p className="max-w-xl text-base leading-7 text-background/70 md:text-lg">
              Compare official BLS wage benchmarks with the salary ranges in
              active job postings — by occupation and U.S. metro.
            </p>
            <div className="hidden gap-8 md:flex">
              <div className="flex flex-col">
                <span className="font-display text-5xl leading-none tracking-tight text-electric">
                  830+
                </span>
                <span className="mt-2 font-mono-tag text-[10px] text-background/60">
                  Occupations
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-5xl leading-none tracking-tight text-accent">
                  395
                </span>
                <span className="mt-2 font-mono-tag text-[10px] text-background/60">
                  U.S. metros
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-5xl leading-none tracking-tight text-violet-pop">
                  Q2&apos;26
                </span>
                <span className="mt-2 font-mono-tag text-[10px] text-background/60">
                  Latest data
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 pt-[60px] md:px-6 md:pb-20">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_1fr]">
          <form
            onSubmit={onSubmit}
            className="relative overflow-visible rounded-3xl border border-border bg-card p-8 shadow-soft md:p-10"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
            <p className="font-mono-tag text-[10px] font-semibold text-primary">
              01 / Calculate
            </p>
            <h2 className="font-display mt-2 text-3xl md:text-4xl">
              Get a salary read
            </h2>

            <div className="relative mt-8 space-y-5">
              <Field label="Career">
                <FieldIcon>
                  <Search className="size-4 text-primary" />
                </FieldIcon>
                <KeywordAutocomplete
                  id="salary-career"
                  value={title}
                  placeholder="Software Engineer"
                  showClearButton={false}
                  containerClassName="relative w-full"
                  className="h-14 border-0 bg-transparent pl-11 text-[15px] shadow-none focus-visible:ring-0"
                  onValueChange={setTitle}
                  onKeywordSelect={(suggestion: KeywordSuggestion) => {
                    setTitle(suggestion.term);
                  }}
                />
              </Field>
              <Field label="Location">
                <FieldIcon>
                  <MapPin className="size-4 text-accent" />
                </FieldIcon>
                <LocationAutocomplete
                  id="salary-location"
                  value={location}
                  placeholder="Atlanta, GA"
                  showClearButton={false}
                  containerClassName="relative w-full"
                  className="h-14 border-0 bg-transparent pl-11 text-[15px] shadow-none focus-visible:ring-0"
                  onValueChange={setLocation}
                  onLocationSelect={(locationSuggestion) => {
                    setLocation(toSalaryLocationLabel(locationSuggestion));
                  }}
                />
              </Field>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="xl"
              className="mt-8 w-full justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Reading salary
                </>
              ) : (
                <>
                  Show salary <ArrowRight className="size-4" />
                </>
              )}
            </Button>

            {error && (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <div className="mt-8 border-t border-border pt-6">
              <p className="font-mono-tag text-[10px] font-semibold text-muted-foreground">
                Try a preset
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={`${preset.title}-${preset.location}`}
                    onClick={() => {
                      calculate(preset.title, preset.location);
                    }}
                    className="rounded-full border border-primary/20 bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-all hover:border-primary hover:bg-primary-gradient hover:text-primary-foreground hover:shadow-pop"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>
          </form>

          <div className="relative overflow-hidden rounded-3xl bg-foreground p-8 text-background shadow-lift md:p-10">
            <div className="pointer-events-none absolute -right-24 -top-24 size-[360px] rounded-full bg-primary/40 blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-32 -left-20 size-[360px] rounded-full bg-accent/30 blur-[120px]" />
            <div className="pointer-events-none absolute inset-0 grain opacity-[0.25]" />

            <div className="relative">
              <p className="font-mono-tag text-[10px] font-semibold text-primary-glow">
                02 / Median
              </p>
              <h3 className="font-display mt-2 text-xl text-background/80">
                {activeResult.career} · {activeResult.location}
              </h3>

              <p className="mt-10 flex flex-wrap items-baseline gap-3">
                <span className="font-display text-7xl leading-none tracking-tight md:text-[112px]">
                  <span className="text-gradient-warm">
                    {formatMoney(activeResult.range.median, unit)}
                  </span>
                </span>
                <span className="text-sm text-background/60">
                  /{unit === "yearly" ? "yr" : "hr"}
                </span>
              </p>

              <div className="mt-8 inline-flex rounded-full border border-background/15 bg-background/5 p-1 text-xs backdrop-blur">
                {(["yearly", "hourly"] as const).map((nextUnit) => (
                  <button
                    key={nextUnit}
                    type="button"
                    onClick={() => setUnit(nextUnit)}
                    className={cn(
                      "rounded-full px-4 py-1.5 font-medium capitalize transition-all",
                      unit === nextUnit
                        ? "bg-primary-gradient text-primary-foreground shadow-pop"
                        : "text-background/60 hover:text-background",
                    )}
                  >
                    {nextUnit}
                  </button>
                ))}
              </div>

              <div className="mt-10">
                <div className="relative h-1.5 rounded-full bg-background/15">
                  <div className="absolute inset-y-0 left-[6%] right-[6%] rounded-full bg-primary-gradient" />
                  <div
                    className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-background bg-accent shadow-warm"
                    style={{ left: `${markerPct}%` }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 text-[10px] font-medium uppercase tracking-[0.12em] text-background/50">
                  <span>Low</span>
                  <span className="text-center">Median</span>
                  <span className="text-right">High</span>
                </div>
                <div className="mt-1 grid grid-cols-3 text-sm font-semibold">
                  <span>{formatMoney(activeResult.range.low, unit)}</span>
                  <span className="text-center text-primary-glow">
                    {formatMoney(activeResult.range.median, unit)}
                  </span>
                  <span className="text-right">
                    {formatMoney(activeResult.range.high, unit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-5 grid max-w-7xl gap-5 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-soft md:p-10">
            <div className="flex items-end justify-between gap-3 border-b border-border pb-6">
              <div>
                <p className="font-mono-tag text-[10px] font-semibold text-primary">
                  03 / Live postings
                </p>
                <h3 className="font-display mt-2 text-2xl md:text-3xl">
                  Disclosed ranges from real jobs
                </h3>
              </div>
              <span className="hidden rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground sm:inline-flex">
                {sampleCount} samples
              </span>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {samples.slice(0, 4).map((sample) => (
                <Link
                  key={sample.id}
                  href={sample.url ?? "/jobs"}
                  className="group rounded-2xl border border-border bg-background p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
                >
                  <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                    {sample.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sample.companyName} · {sample.location}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                      {formatSampleRange(sample)}
                    </span>
                    <ArrowUpRight className="size-4 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid auto-rows-min gap-5">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-primary-gradient text-primary-foreground shadow-pop">
                  <Database className="size-4" />
                </div>
                <p className="font-mono-tag text-[10px] font-semibold text-primary">
                  Source
                </p>
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <DlRow
                  term="Occupation"
                  desc={activeResult.bls?.occupationName ?? activeResult.career}
                />
                <DlRow
                  term="Match"
                  desc={activeResult.bls?.areaName ?? activeResult.location}
                />
                <DlRow term="Samples" desc={String(sampleCount)} />
              </dl>
              <Link
                href={activeResult.bls?.sourceUrl ?? "https://www.bls.gov/oes/"}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                View BLS source <ArrowUpRight className="size-3.5" />
              </Link>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-accent/25 bg-gradient-to-br from-accent/10 to-background p-6">
              <div className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-accent/20 blur-2xl" />
              <div className="relative">
                <div className="grid size-10 place-items-center rounded-xl bg-warm-gradient text-accent-foreground shadow-warm">
                  <TrendingUp className="size-4" />
                </div>
                <p className="mt-4 text-sm leading-6 text-foreground/80">
                  Low and high values are percentile wage estimates — not
                  guaranteed offers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 px-4 py-24 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-end gap-6 md:grid-cols-[1fr_auto]">
            <h2 className="font-display max-w-2xl text-balance text-4xl leading-[1.05] md:text-6xl">
              Three steps from{" "}
              <span className="text-gradient-primary">search to signal.</span>
            </h2>
            <Button asChild variant="hero" size="lg">
              <Link href="/jobs">
                Browse roles <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                n: "01",
                icon: <Database className="size-4" />,
                t: "Official BLS benchmarks",
                d: "Every estimate anchors to U.S. Bureau of Labor Statistics wage data.",
                tone: "primary" as const,
              },
              {
                n: "02",
                icon: <BarChart3 className="size-4" />,
                t: "Yearly or hourly, instantly",
                d: "Flip between the two without leaving the page.",
                tone: "accent" as const,
              },
              {
                n: "03",
                icon: <Briefcase className="size-4" />,
                t: "Real posting ranges",
                d: "We surface disclosed pay from active job postings when companies share.",
                tone: "dark" as const,
              },
            ].map((step) => {
              const wrap =
                step.tone === "dark"
                  ? "border-transparent bg-foreground text-background"
                  : step.tone === "accent"
                    ? "border-accent/20 bg-gradient-to-br from-accent/10 to-background"
                    : "border-primary/20 bg-gradient-to-br from-primary/10 to-background";
              const iconBox =
                step.tone === "dark"
                  ? "bg-background/15 text-primary-glow"
                  : step.tone === "accent"
                    ? "bg-warm-gradient text-accent-foreground shadow-warm"
                    : "bg-primary-gradient text-primary-foreground shadow-pop";
              const desc =
                step.tone === "dark"
                  ? "text-background/70"
                  : "text-muted-foreground";

              return (
                <article
                  key={step.n}
                  className={cn(
                    "group rounded-3xl border p-7 shadow-xs transition-all hover:-translate-y-1 hover:shadow-lift",
                    wrap,
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "grid size-11 place-items-center rounded-2xl",
                        iconBox,
                      )}
                    >
                      {step.icon}
                    </div>
                    <span
                      className={cn(
                        "font-mono-tag text-[10px] font-semibold",
                        step.tone === "dark"
                          ? "text-background/50"
                          : "text-muted-foreground",
                      )}
                    >
                      {step.n}
                    </span>
                  </div>
                  <h3 className="font-display mt-6 text-2xl leading-tight">
                    {step.t}
                  </h3>
                  <p className={cn("mt-3 text-sm leading-6", desc)}>{step.d}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-mono-tag text-[10px] font-semibold text-muted-foreground">
        {label}
      </span>
      <div className="relative mt-2 rounded-xl border border-border bg-background transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
        {children}
      </div>
    </label>
  );
}

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2">
      {children}
    </span>
  );
}

function DlRow({ term, desc }: { term: string; desc: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <dt className="font-mono-tag text-[10px] font-semibold text-muted-foreground">
        {term}
      </dt>
      <dd className="text-right text-sm font-medium text-foreground">{desc}</dd>
    </div>
  );
}

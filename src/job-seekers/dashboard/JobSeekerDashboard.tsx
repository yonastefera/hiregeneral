"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileText,
  MapPin,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";

import LocationAutocomplete from "@/components/location/LocationAutocomplete";
import type { LocationSuggestion } from "@/components/location/location-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  JobSeekerDashboardJob,
  JobSeekerDashboardStats,
} from "./job-seeker-dashboard-data";
import {
  FeaturedJobsPanel,
  JobSearchChecklistPanel,
  JobSeekerDashboardErrorBoundary,
  JobSeekerStatCard,
  JobSeekerWorkspaceCard,
} from "./JobSeekerDashboardComponents";
import type {
  JobSeekerChecklistData,
  JobSeekerStatCardData,
  JobSeekerWorkspaceCardData,
} from "./JobSeekerDashboardComponents";

interface JobSeekerDashboardProps {
  initialStats: JobSeekerDashboardStats;
  initialJobs: JobSeekerDashboardJob[];
  initialStatsError?: string | null;
  initialJobsError?: string | null;
  initialLocation?: string;
}

type SelectedLocation = {
  city: string;
  state: string;
  zip_code: string | null;
  label: string;
};

function buildStatCards(
  stats: JobSeekerDashboardStats,
): JobSeekerStatCardData[] {
  return [
    {
      label: "Active listings",
      value: stats.totalJobs,
      icon: BriefcaseBusiness,
      ariaLabel: `Active job listings: ${stats.totalJobs}`,
    },
    {
      label: "Registered users",
      value: stats.totalUsers,
      icon: UsersRound,
      ariaLabel: `Registered users: ${stats.totalUsers}`,
    },
    {
      label: "Applications",
      value: stats.totalApplications,
      icon: BarChart3,
      ariaLabel: `Applications: ${stats.totalApplications}`,
    },
    {
      label: "Companies",
      value: stats.totalCompanies,
      icon: Building2,
      ariaLabel: `Companies: ${stats.totalCompanies}`,
    },
  ];
}

function buildWorkspaceCards(): JobSeekerWorkspaceCardData[] {
  return [
    {
      title: "Browse jobs",
      description:
        "Search open roles by keyword, location, work mode, and employment type.",
      icon: Search,
      href: "/jobs",
    },
    {
      title: "Track applications",
      description:
        "Review submitted applications and keep track of your job search progress.",
      icon: FileText,
      href: "/dashboard/applications",
    },
    {
      title: "Update your profile",
      description:
        "Keep your resume, skills, location, and job preferences up to date.",
      icon: UserRound,
      href: "/dashboard/profile",
    },
  ];
}

function buildChecklistPanel(): JobSeekerChecklistData {
  return {
    title: "Job search checklist",
    icon: CheckCircle2,
    ariaLabel: "Job seeker checklist",
    items: [
      "Upload or update your resume",
      "Add your preferred roles and locations",
      "Browse and save relevant jobs",
      "Track applications and follow-up tasks",
    ],
  };
}

function toSelectedLocation(location: LocationSuggestion): SelectedLocation {
  return {
    city: location.city,
    state: location.state,
    zip_code: location.zip_code,
    label: location.label,
  };
}

function JobSeekerDashboardContent({
  initialStats,
  initialJobs,
  initialStatsError = null,
  initialJobsError = null,
  initialLocation = "",
}: JobSeekerDashboardProps) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState(initialLocation);
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);

  const statCards = useMemo(() => buildStatCards(initialStats), [initialStats]);
  const workspaceCards = useMemo(() => buildWorkspaceCards(), []);
  const checklistPanel = useMemo(() => buildChecklistPanel(), []);

  const searchJobs = () => {
    const params = new URLSearchParams();

    const trimmedQuery = query.trim();
    const trimmedLocation = locationQuery.trim();

    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }

    if (selectedLocation) {
      params.set("city", selectedLocation.city);
      params.set("state", selectedLocation.state);

      if (selectedLocation.zip_code) {
        params.set("zip", selectedLocation.zip_code);
      }

      params.set(
        "location",
        `${selectedLocation.city}, ${selectedLocation.state}`,
      );
    } else if (trimmedLocation) {
      params.set("location", trimmedLocation);
    }

    const queryString = params.toString();

    router.push(queryString ? `/jobs?${queryString}` : "/jobs");
  };

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:p-4 focus:text-background"
      >
        Skip to main content
      </a>

      <main
        id="main-content"
        className="min-h-screen bg-background"
        role="main"
        tabIndex={-1}
      >
        <div className="mx-auto max-w-7xl px-4 py-8">
          <header aria-labelledby="dashboard-heading">
            <Badge variant="soft">Job seeker dashboard</Badge>

            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1
                  id="dashboard-heading"
                  className="text-balance text-4xl font-bold tracking-tight"
                >
                  Track your job search and discover featured roles.
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Browse active listings, review featured opportunities, and
                  keep your job search moving.
                </p>
              </div>

              <Button className="min-h-11" asChild>
                <Link href="/jobs" prefetch>
                  <Search className="size-4" aria-hidden="true" />
                  Browse jobs
                </Link>
              </Button>
            </div>

            <form
              role="search"
              aria-label="Search jobs"
              onSubmit={(event) => {
                event.preventDefault();
                searchJobs();
              }}
              className="mt-8 rounded-3xl border border-border bg-surface p-3 shadow-soft"
            >
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <div className="flex items-center gap-2 rounded-2xl bg-background px-4 transition-colors focus-within:ring-2 focus-within:ring-primary/20">
                  <Search
                    className="size-5 text-muted-foreground"
                    aria-hidden="true"
                  />

                  <Input
                    aria-label="Search by title, company, or skill"
                    placeholder="Title, company, skill, keyword"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-background px-4 transition-colors focus-within:ring-2 focus-within:ring-primary/20">
                  <MapPin
                    className="size-5 text-muted-foreground"
                    aria-hidden="true"
                  />

                  <LocationAutocomplete
                    id="dashboardLocationSearch"
                    value={locationQuery}
                    placeholder="City, State, or ZIP"
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    onValueChange={(value) => {
                      setLocationQuery(value);

                      if (!value.trim()) {
                        setSelectedLocation(null);
                      }
                    }}
                    onLocationSelect={(location) => {
                      setSelectedLocation(toSelectedLocation(location));
                    }}
                    onClear={() => {
                      setSelectedLocation(null);
                    }}
                  />
                </div>

                <Button variant="hero" size="xl" type="submit">
                  Search
                </Button>
              </div>

              {initialLocation ? (
                <p className="mt-3 px-3 text-xs text-muted-foreground">
                  Location was prefilled using an approximate IP-based location.
                  You can edit or clear it.
                </p>
              ) : null}
            </form>
          </header>

          <section aria-labelledby="dashboard-stats-heading" className="mt-8">
            <h2 id="dashboard-stats-heading" className="sr-only">
              Job seeker dashboard statistics
            </h2>

            {initialStatsError ? (
              <div
                role="alert"
                aria-live="polite"
                className="mb-4 rounded-lg border border-dashed border-destructive/40 bg-background p-4 text-sm text-muted-foreground"
              >
                {initialStatsError}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-4">
              {statCards.map((stat) => (
                <JobSeekerStatCard key={stat.label} data={stat} />
              ))}
            </div>
          </section>

          <section
            aria-labelledby="job-seeker-actions-heading"
            className="mt-8"
          >
            <h2 id="job-seeker-actions-heading" className="sr-only">
              Job seeker actions
            </h2>

            <div className="grid gap-5 lg:grid-cols-3">
              {workspaceCards.map((card) => (
                <JobSeekerWorkspaceCard key={card.title} card={card} />
              ))}
            </div>
          </section>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
            <FeaturedJobsPanel jobs={initialJobs} error={initialJobsError} />
            <JobSearchChecklistPanel panel={checklistPanel} />
          </div>
        </div>
      </main>
    </>
  );
}

export default function JobSeekerDashboard(props: JobSeekerDashboardProps) {
  return (
    <JobSeekerDashboardErrorBoundary>
      <JobSeekerDashboardContent {...props} />
    </JobSeekerDashboardErrorBoundary>
  );
}

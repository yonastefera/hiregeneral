"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import type { Job } from "@/lib/db/types";
import {
  daysAgoLabel,
  formatSalary,
  getDisplayLocation,
  getDisplayTitle,
  similarSummary,
  supportedLogoUrl,
} from "./job-details-utils";

type SimilarRolesProps = {
  jobs: Job[];
};

function SimilarRoleCard({ job }: { job: Job }) {
  const { isSaved, toggleSaved, pendingId } = useSavedJobs();

  const href = `/job/${job.slug ?? job.id}`;
  const logoInitials = job.company_name.slice(0, 2).toUpperCase();
  const displayTitle = getDisplayTitle(job);
  const postedDays = daysAgoLabel(job.posted_at);
  const isExternal = Boolean(job.apply_url);
  const salary = formatSalary(
    job.salary_min,
    job.salary_max,
    job.salary_currency,
  );
  const logoUrl = supportedLogoUrl(job.company_logo_url);
  const displayLocation = getDisplayLocation(job);
  const saved = isSaved(job.id);
  const saving = pendingId === job.id;

  const onSaveClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (saving) return;

    await toggleSaved(job.id);
  };

  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-soft transition-colors hover:border-primary/40 hover:shadow-lift">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${job.company_name} logo`}
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-lg object-contain"
            />
          ) : (
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-bold text-secondary-foreground">
              {logoInitials}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-primary">
              {job.company_name}
            </p>

            <Link
              href={href}
              className="mt-1 line-clamp-2 block text-base font-bold leading-snug tracking-tight text-foreground transition-colors hover:text-primary"
            >
              {displayTitle}
            </Link>
          </div>
        </div>

        <button
          type="button"
          aria-label={saved ? "Remove saved job" : "Save job"}
          aria-pressed={saved}
          disabled={saving}
          onClick={onSaveClick}
          className="grid size-10 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:cursor-wait disabled:opacity-70 aria-pressed:border-primary/40 aria-pressed:bg-primary/10 aria-pressed:text-primary"
        >
          {saving ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Bookmark
              aria-hidden="true"
              className={saved ? "size-5 fill-current" : "size-5"}
            />
          )}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="line-clamp-1" title={job.location}>
            {displayLocation}
          </span>
        </span>

        <span className="inline-flex items-center gap-1.5">
          <Clock3 aria-hidden="true" className="size-3.5" />
          {postedDays === 0 ? "Today" : `${postedDays}d ago`}
        </span>
      </div>

      <div className="mt-5 border-t border-dashed border-border" />

      <p className="mt-5 line-clamp-3 text-sm leading-6 text-muted-foreground">
        {similarSummary(job)}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{job.employment_type}</Badge>
        <Badge variant="soft">{job.work_mode}</Badge>
        {salary && <Badge variant="secondary">{salary}</Badge>}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-primary"
        >
          Details <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>

        <Button size="sm" asChild={!isExternal}>
          {isExternal && job.apply_url ? (
            <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
              Apply
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
          ) : (
            <Link href={`${href}/apply`}>
              Apply
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          )}
        </Button>
      </div>
    </article>
  );
}

export default function SimilarRoles({ jobs }: SimilarRolesProps) {
  if (jobs.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Similar roles
      </h2>

      <div className="space-y-4">
        {jobs.map((job) => (
          <SimilarRoleCard key={job.id} job={job} />
        ))}
      </div>
    </section>
  );
}

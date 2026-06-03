"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Briefcase,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import type { Job } from "@/lib/db/types";
import { cn } from "@/lib/utils";
import {
  daysAgoLabel,
  getDisplayLocation,
  getDisplayTitle,
  similarSummary,
  supportedLogoUrl,
} from "./job-details-utils";

type SimilarRolesProps = {
  jobs: Job[];
};

const accentClasses = [
  "from-teal-400 to-emerald-500",
  "from-emerald-600 to-teal-800",
  "from-orange-500 to-rose-500",
  "from-sky-500 to-cyan-500",
  "from-violet-500 to-fuchsia-500",
];

function accentFor(value: string) {
  const index =
    value.split("").reduce((total, char) => total + char.charCodeAt(0), 0) %
    accentClasses.length;

  return accentClasses[index];
}

function SimilarRoleCard({ job }: { job: Job }) {
  const { isSaved, toggleSaved, pendingId } = useSavedJobs();

  const href = `/job/${job.slug ?? job.id}`;
  const logoInitials = job.company_name.slice(0, 2).toUpperCase();
  const displayTitle = getDisplayTitle(job);
  const postedDays = daysAgoLabel(job.posted_at);
  const isExternal = Boolean(job.apply_url);
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
    <article className="group rounded-[1.35rem] border border-black/5 bg-white p-5 shadow-[0_14px_40px_-30px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-34px_rgba(15,23,42,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${job.company_name} logo`}
              width={40}
              height={40}
              className="size-11 shrink-0 rounded-xl object-contain ring-1 ring-black/5"
            />
          ) : (
            <div
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-[11px] font-bold text-white shadow-sm",
                accentFor(job.company_name),
              )}
            >
              {logoInitials}
            </div>
          )}

          <p className="truncate text-[13px] font-semibold text-teal-700">
            {job.company_name}
          </p>
        </div>

        <button
          type="button"
          aria-label={saved ? "Remove saved job" : "Save job"}
          aria-pressed={saved}
          disabled={saving}
          onClick={onSaveClick}
          className="grid size-9 shrink-0 place-items-center rounded-2xl border border-black/5 text-neutral-500 transition hover:bg-teal-50 hover:text-teal-700 disabled:cursor-wait disabled:opacity-70 aria-pressed:border-teal-200 aria-pressed:bg-teal-50 aria-pressed:text-teal-700"
        >
          {saving ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Bookmark
              aria-hidden="true"
              className={cn("size-5", saved && "fill-current")}
            />
          )}
        </button>
      </div>

      <Link
        href={href}
        className="mt-3 line-clamp-2 block text-[16px] font-semibold leading-snug tracking-tight text-neutral-950 transition-colors hover:text-teal-700"
      >
        {displayTitle}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-neutral-500">
        <span className="inline-flex min-w-0 items-center gap-1">
          <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="line-clamp-1" title={job.location}>
            {displayLocation}
          </span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock3 aria-hidden="true" className="size-3.5" />
          {postedDays === 0 ? "Today" : `${postedDays}d ago`}
        </span>
        <span className="inline-flex items-center gap-1">
          <Briefcase aria-hidden="true" className="size-3.5" />
          {job.employment_type}
        </span>
        <span>{job.work_mode}</span>
      </div>

      <p className="mt-4 line-clamp-2 text-[14px] leading-6 text-neutral-600">
        {similarSummary(job)}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/5 pt-4">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-neutral-700 transition hover:text-teal-700"
        >
          Details <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>

        <Button
          size="sm"
          className="min-w-[88px] gap-1.5 bg-neutral-950 px-3 text-white hover:bg-neutral-800 [&_svg]:size-3.5"
          asChild
        >
          {isExternal && job.apply_url ? (
            <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
              Apply
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
          ) : (
            <Link href={`${href}/apply`}>
              Apply
              <ArrowUpRight aria-hidden="true" className="size-3.5" />
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
    <section className="space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
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

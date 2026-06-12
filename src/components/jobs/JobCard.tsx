import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  ExternalLink,
  MapPin,
} from "lucide-react";

import CompanyLogo from "@/components/jobs/CompanyLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveJobButton } from "@/components/jobs/SaveJobButton";
import { listingLocation, listingTitle } from "@/lib/jobs/display";
import type { JobListing } from "@/data/jobPlatform";

type JobCardProps = {
  job: JobListing;
  saved: boolean;
  saving?: boolean;
  onSave: (jobId: string) => void;
};

export function JobCard({ job, saved, saving = false, onSave }: JobCardProps) {
  const isExternal = Boolean(job.applyUrl);
  const displayTitle = listingTitle(job.title);
  const displayLocation = listingLocation(job.location);

  const detailsHref = `/jobs/${job.slug}`;
  const applyHref =
    isExternal && job.applyUrl ? job.applyUrl : `/jobs/${job.slug}/apply`;

  return (
    <article className="group relative max-w-full overflow-hidden rounded-[1.35rem] border border-border/60 bg-card p-5 shadow-xs transition-shadow duration-200 hover:shadow-soft sm:rounded-2xl">
      <div className="sm:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <CompanyLogo
              src={job.logo}
              companyName={job.company}
              size="md"
              className="shadow-xs"
            />

            <p className="truncate text-sm font-semibold text-teal-700 sm:text-[11px] sm:font-medium sm:uppercase sm:tracking-[0.08em] sm:text-muted-foreground">
              {job.company}
            </p>
          </div>

          <SaveJobButton
            jobId={job.id}
            saved={saved}
            saving={saving}
            onSave={onSave}
          />
        </div>

        <h3 className="mt-4 line-clamp-2 text-xl font-semibold leading-snug tracking-tight text-foreground sm:mt-2 sm:text-base md:text-lg">
          <Link
            href={detailsHref}
            className="text-left transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none"
          >
            {displayTitle}
          </Link>
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground sm:mt-2.5 sm:gap-x-4 sm:text-xs">
          <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
            <MapPin className="size-4 shrink-0 sm:size-3.5" />
            <span className="line-clamp-1 min-w-0">{displayLocation}</span>
          </span>

          <span className="inline-flex shrink-0 items-center gap-1.5">
            <Clock3 className="size-4 shrink-0 sm:size-3.5" />
            {job.postedDaysAgo === 0 ? "Today" : `${job.postedDaysAgo}d ago`}
          </span>

          <span className="inline-flex shrink-0 items-center gap-1.5">
            <BriefcaseBusiness className="size-4 shrink-0 sm:size-3.5" />
            {job.employmentType}
          </span>

          <span>{job.workMode}</span>
        </div>

        <p className="mt-4 line-clamp-2 text-base leading-7 text-muted-foreground sm:mt-3 sm:text-sm sm:leading-6">
          {job.summary}
        </p>

        <div className="mt-4 hidden flex-wrap items-center gap-1.5 sm:flex">
          {job.salary && <Badge variant="success">{job.salary}</Badge>}

          <Badge variant="soft">{job.workMode}</Badge>

          {job.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}

          {job.skills.length > 3 && (
            <Badge variant="soft">+{job.skills.length - 3}</Badge>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-4 sm:mt-4 sm:pt-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {job.applicants} applicants
          </span>

          <Button
            variant="ghost"
            size="sm"
            className="px-0 text-sm font-semibold text-foreground hover:bg-transparent hover:text-primary sm:px-3"
            asChild
          >
            <Link href={detailsHref}>
              Details <ArrowRight className="size-4 sm:size-3.5" />
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="min-w-[88px] rounded-full bg-neutral-950 px-4 text-white hover:bg-neutral-800"
              asChild
            >
              <Link
                href={applyHref}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
              >
                {isExternal ? (
                  <>
                    Apply <ExternalLink className="size-3.5" />
                  </>
                ) : (
                  <>
                    Apply now <ArrowRight className="size-3.5" />
                  </>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden sm:flex sm:items-start sm:gap-4">
        <CompanyLogo
          src={job.logo}
          companyName={job.company}
          size="md"
          className="shadow-xs"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {job.company}
              </p>

              <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground md:text-lg">
                <Link
                  href={detailsHref}
                  className="text-left transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none"
                >
                  {displayTitle}
                </Link>
              </h3>
            </div>

            <SaveJobButton
              jobId={job.id}
              saved={saved}
              saving={saving}
              onSave={onSave}
            />
          </div>

          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" />
              <span className="line-clamp-1 min-w-0">{displayLocation}</span>
            </span>

            <span className="inline-flex shrink-0 items-center gap-1.5">
              <Clock3 className="size-3.5 shrink-0" />
              {job.postedDaysAgo === 0 ? "Today" : `${job.postedDaysAgo}d ago`}
            </span>

            <span className="inline-flex shrink-0 items-center gap-1.5">
              <BriefcaseBusiness className="size-3.5 shrink-0" />
              {job.employmentType}
            </span>
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {job.summary}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {job.salary && <Badge variant="success">{job.salary}</Badge>}

            <Badge variant="soft">{job.workMode}</Badge>

            {job.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}

            {job.skills.length > 3 && (
              <Badge variant="soft">+{job.skills.length - 3}</Badge>
            )}
          </div>

          <div className="mt-4 flex flex-row items-center justify-between gap-3 border-t border-border/60 pt-3">
            <span className="text-xs text-muted-foreground">
              {job.applicants} applicants
            </span>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={detailsHref}>
                  Details <ArrowRight className="size-3.5" />
                </Link>
              </Button>

              <Button size="sm" asChild>
                <Link
                  href={applyHref}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                >
                  {isExternal ? (
                    <>
                      Apply <ExternalLink className="size-3.5" />
                    </>
                  ) : (
                    <>
                      Apply now <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Clock3,
  ExternalLink,
  MapPin,
} from "lucide-react";

import CompanyLogo from "@/components/jobs/CompanyLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listingLocation, listingTitle } from "@/lib/jobs/display";
import { cn } from "@/lib/utils";
import type { JobListing } from "@/data/jobPlatform";

type PublicJobCardProps = {
  job: JobListing;
  saveHref: string;
};

export function PublicJobCard({ job, saveHref }: PublicJobCardProps) {
  const isExternal = Boolean(job.applyUrl);
  const displayTitle = listingTitle(job.title);
  const displayLocation = listingLocation(job.location);

  const detailsHref = `/jobs/${job.slug}`;
  const applyHref =
    isExternal && job.applyUrl ? job.applyUrl : `/jobs/${job.slug}/apply`;

  return (
    <article className="group relative max-w-full overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition-shadow duration-200 hover:shadow-soft">
      <div className="flex items-start gap-4">
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

            <Link
              href={saveHref}
              prefetch={false}
              aria-label="Save job"
              className={cn(
                "relative z-10 grid size-10 shrink-0 place-items-center rounded-lg bg-transparent text-muted-foreground transition-colors",
                "hover:bg-transparent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
              )}
            >
              <Bookmark className="size-5" strokeWidth={2} />
            </Link>
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

          <div className="mt-4 flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">
              {job.applicants} applicants
            </span>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
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

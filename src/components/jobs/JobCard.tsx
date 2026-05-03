"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Clock3,
  ExternalLink,
  MapPin,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { JobListing } from "@/data/jobPlatform";

type JobCardProps = {
  job: JobListing;
  saved: boolean;
  onSave: (jobId: string) => void;
};

export function JobCard({ job, saved, onSave }: JobCardProps) {
  const router = useRouter();
  const isExternal = Boolean(job.applyUrl);

  const goToJob = () => {
    if (isExternal && job.applyUrl) {
      window.open(job.applyUrl, "_blank", "noopener,noreferrer");
    } else {
      router.push(`/jobs/${job.slug}`);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToJob();
    }
  };

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`${job.title} at ${job.company}. ${
        isExternal
          ? "Opens company careers page in a new tab."
          : "View job details."
      }`}
      onClick={goToJob}
      onKeyDown={handleKeyDown}
      className="group relative cursor-pointer rounded-lg border border-border bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-secondary text-sm font-semibold text-secondary-foreground">
          {job.logo}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {job.company}
              </p>

              <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary md:text-lg">
                {job.title}
              </h3>
            </div>

            <Button
              type="button"
              aria-label={saved ? "Remove saved job" : "Save job"}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onSave(job.id);
              }}
              className="relative z-10 grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Bookmark
                className={saved ? "size-4 fill-accent text-accent" : "size-4"}
              />
            </Button>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {job.location}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              {job.postedDaysAgo === 0 ? "Today" : `${job.postedDaysAgo}d ago`}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <BriefcaseBusiness className="size-3.5" />
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

          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
            <span className="text-muted-foreground">
              {job.applicants} applicants
            </span>

            <span className="inline-flex items-center gap-1 font-medium text-primary transition-transform group-hover:translate-x-0.5">
              {isExternal ? (
                <>
                  Apply on {job.company}
                  <ExternalLink className="size-3.5" />
                </>
              ) : (
                <>
                  View details
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

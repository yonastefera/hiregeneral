"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { JobListing } from "@/data/jobPlatform";

type JobCardProps = {
  job: JobListing;
  saved: boolean;
  saving?: boolean;
  onSave: (jobId: string) => void;
};

export function JobCard({ job, saved, saving = false, onSave }: JobCardProps) {
  const router = useRouter();
  const isExternal = Boolean(job.applyUrl);

  const goToDetails = () => {
    router.push(`/jobs/${job.slug}`);
  };

  const onApply = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (isExternal && job.applyUrl) {
      window.open(job.applyUrl, "_blank", "noopener,noreferrer");
    } else {
      router.push(`/jobs/${job.slug}`);
    }
  };

  const onSaveClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (saving) return;

    onSave(job.id);
  };

  return (
    <article className="group relative rounded-xl border border-border/80 bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-soft">
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-semibold text-secondary-foreground ring-1 ring-inset ring-border/50">
          {job.logo}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {job.company}
              </p>

              <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground md:text-lg">
                <button
                  type="button"
                  onClick={goToDetails}
                  className="text-left transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none"
                >
                  {job.title}
                </button>
              </h3>
            </div>

            <button
              type="button"
              aria-label={saved ? "Remove saved job" : "Save job"}
              aria-pressed={saved}
              disabled={saving}
              onClick={onSaveClick}
              className={cn(
                "relative z-10 grid size-9 place-items-center rounded-lg border border-transparent text-muted-foreground transition-all",
                "hover:border-border hover:bg-secondary/60 hover:text-foreground",
                saved && "text-accent",
                saving && "cursor-wait opacity-80",
              )}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : saved ? (
                <BookmarkCheck className="size-4 fill-accent/20 text-accent" />
              ) : (
                <Bookmark className="size-4" />
              )}
            </button>
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

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
            <span className="text-xs text-muted-foreground">
              {job.applicants} applicants
            </span>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={goToDetails}>
                Details <ArrowRight className="size-3.5" />
              </Button>

              <Button size="sm" onClick={onApply}>
                {isExternal ? (
                  <>
                    Apply <ExternalLink className="size-3.5" />
                  </>
                ) : (
                  <>
                    Apply now <ArrowRight className="size-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

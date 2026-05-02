import { useRouter } from "next/navigation";
import { ArrowUpRight, Bookmark, BriefcaseBusiness, Clock3, ExternalLink, MapPin, Sparkles } from "lucide-react";
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
      aria-label={`${job.title} at ${job.company}. ${isExternal ? "Opens company careers page in a new tab." : "View job details."}`}
      onClick={goToJob}
      onKeyDown={handleKeyDown}
      className="group relative cursor-pointer rounded-2xl border border-border bg-surface p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-gradient text-sm font-bold text-primary-foreground shadow-soft">
          {job.logo}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">{job.company}</p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary md:text-xl">
                {job.title}
              </h3>
            </div>
            <Button
              type="button"
              variant={saved ? "warm" : "glass"}
              size="icon"
              aria-label={saved ? "Remove saved job" : "Save job"}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onSave(job.id);
              }}
              className="relative z-10"
            >
              <Bookmark className={saved ? "fill-current" : ""} />
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{job.location}</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4" />{job.postedDaysAgo === 0 ? "Today" : `${job.postedDaysAgo}d ago`}</span>
            <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness className="size-4" />{job.employmentType}</span>
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{job.summary}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {job.salary && <Badge variant="success">{job.salary}</Badge>}
            <Badge variant="soft">{job.workMode}</Badge>
            <Badge variant="soft">{job.distance === 0 ? "Remote" : `${job.distance} mi`}</Badge>
            {job.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="gap-1">
                <Sparkles className="size-3" />{skill}
              </Badge>
            ))}
            {job.skills.length > 3 && (
              <Badge variant="secondary">+{job.skills.length - 3}</Badge>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>{job.applicants} applicants</span>
            <span className="inline-flex items-center gap-1 font-medium text-primary transition-transform group-hover:translate-x-0.5">
              {isExternal ? (
                <>Apply on {job.company} <ExternalLink className="size-4" /></>
              ) : (
                <>View details <ArrowUpRight className="size-4" /></>
              )}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

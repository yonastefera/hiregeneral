"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookmarkCheck,
  Calendar,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { featuredJobs } from "@/data/jobPlatform";
import {
  ApplicationRecord,
  SavedJobRecord,
  demoApplications,
  demoSavedJobs,
  formatPrettyDate,
} from "@/data/savedJobsDemo";

const PAGE_SIZE = 8;
const INACTIVE_DAYS = 60;

const isWithin = (iso: string, days: number) => {
  const diff = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
  return diff <= days;
};

function CompanyAvatar({ logo }: { logo: string }) {
  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-secondary text-sm font-semibold text-secondary-foreground">
      {logo}
    </div>
  );
}

function SavedCard({
  item,
  onOpen,
  onUnsave,
  unsaving,
}: {
  item: SavedJobRecord;
  onOpen: (slug: string) => void;
  onUnsave: (jobId: string) => void;
  unsaving: boolean;
}) {
  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => onOpen(item.slug)}
      onKeyDown={(event) =>
        (event.key === "Enter" || event.key === " ") &&
        (event.preventDefault(), onOpen(item.slug))
      }
      className="group flex cursor-pointer items-start gap-4 rounded-xl border border-border/80 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <CompanyAvatar logo={item.logo} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {item.company}
            </p>

            <h3 className="mt-1 truncate text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary md:text-lg">
              {item.title}
            </h3>
          </div>

          <button
            type="button"
            aria-label="Remove from saved"
            disabled={unsaving}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onUnsave(item.jobId);
            }}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-accent transition-colors hover:bg-secondary/60 disabled:cursor-wait disabled:opacity-80"
          >
            {unsaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <BookmarkCheck className="size-4 fill-accent/20" />
            )}
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            {item.location}
          </span>

          {item.salary && (
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="size-3.5" />
              {item.salary}
            </span>
          )}

          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            Saved {formatPrettyDate(item.savedAt)}
          </span>
        </div>

        <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-all group-hover:opacity-100">
          View details <ArrowRight className="size-3.5" />
        </div>
      </div>
    </article>
  );
}

const statusColor: Record<
  ApplicationRecord["status"],
  "secondary" | "warm" | "success" | "soft"
> = {
  submitted: "soft",
  reviewed: "secondary",
  interview: "warm",
  closed: "soft",
};

function ApplicationCard({
  item,
  onOpen,
}: {
  item: ApplicationRecord;
  onOpen: (slug: string) => void;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-soft">
      <div className="flex items-start gap-4">
        <CompanyAvatar logo={item.logo} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {item.company}
              </p>

              <button
                type="button"
                onClick={() => onOpen(item.slug)}
                className="mt-1 truncate text-left text-base font-semibold tracking-tight text-foreground hover:text-primary md:text-lg"
              >
                {item.title}
              </button>
            </div>

            <Badge variant={statusColor[item.status]} className="capitalize">
              {item.status}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {item.location}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              Applied {formatPrettyDate(item.appliedAt)}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              Received {formatPrettyDate(item.receivedAt)}
            </span>
          </div>

          <a
            href={item.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            onClick={(event) =>
              item.resumeUrl === "#" && event.preventDefault()
            }
          >
            <FileText className="size-3.5" />
            <span className="max-w-[18rem] truncate">{item.resumeName}</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    </article>
  );
}

export default function SavedJobsPage() {
  const router = useRouter();

  const [savedVisible, setSavedVisible] = useState(PAGE_SIZE);
  const [appsVisible, setAppsVisible] = useState(PAGE_SIZE);

  const { savedIds, toggleSaved, pendingId } = useSavedJobs();

  const liveSaved: SavedJobRecord[] = useMemo(() => {
    const fromUser: SavedJobRecord[] = savedIds
      .map((id) => featuredJobs.find((job) => job.id === id))
      .filter((job): job is NonNullable<typeof job> => Boolean(job))
      .map((job) => ({
        id: `live-${job.id}`,
        jobId: job.id,
        slug: job.slug,
        title: job.title,
        company: job.company,
        logo: job.logo,
        location: job.location,
        salary: job.salary,
        savedAt: new Date().toISOString(),
        active: true,
      }));

    if (fromUser.length > 0) return fromUser;

    return demoSavedJobs;
  }, [savedIds]);

  const savedFiltered = useMemo(
    () =>
      liveSaved.filter(
        (savedJob) =>
          savedJob.active && isWithin(savedJob.savedAt, INACTIVE_DAYS),
      ),
    [liveSaved],
  );

  const appsFiltered = useMemo(
    () =>
      demoApplications.filter((application) =>
        isWithin(application.appliedAt, INACTIVE_DAYS),
      ),
    [],
  );

  const openJob = (slug: string) => {
    router.push(`/jobs/${slug}`);
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6">
          <Badge variant="soft">Your activity</Badge>

          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Saved & applied
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Listings inactive for more than {INACTIVE_DAYS} days are hidden
            automatically.
          </p>
        </div>

        <Tabs defaultValue="saved" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:w-80">
            <TabsTrigger value="saved">
              Saved jobs ({savedFiltered.length})
            </TabsTrigger>

            <TabsTrigger value="applications">
              Applications ({appsFiltered.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="mt-6">
            {savedFiltered.length === 0 ? (
              <EmptyState
                title="No saved jobs yet"
                description="Tap the bookmark on any job to save it for later."
                action={
                  <Button asChild>
                    <Link href="/jobs">Browse jobs</Link>
                  </Button>
                }
              />
            ) : (
              <>
                <div className="grid gap-3">
                  {savedFiltered.slice(0, savedVisible).map((item) => (
                    <SavedCard
                      key={item.id}
                      item={item}
                      onOpen={openJob}
                      onUnsave={toggleSaved}
                      unsaving={pendingId === item.jobId}
                    />
                  ))}
                </div>

                {savedVisible < savedFiltered.length && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setSavedVisible((count) => count + PAGE_SIZE)
                      }
                    >
                      Load more ({savedFiltered.length - savedVisible}{" "}
                      remaining)
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="applications" className="mt-6">
            {appsFiltered.length === 0 ? (
              <EmptyState
                title="No applications sent"
                description="When you apply to a role, it will show up here with the resume you submitted."
                action={
                  <Button asChild>
                    <Link href="/jobs">Find roles</Link>
                  </Button>
                }
              />
            ) : (
              <>
                <div className="grid gap-3">
                  {appsFiltered.slice(0, appsVisible).map((item) => (
                    <ApplicationCard
                      key={item.id}
                      item={item}
                      onOpen={openJob}
                    />
                  ))}
                </div>

                {appsVisible < appsFiltered.length && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setAppsVisible((count) => count + PAGE_SIZE)
                      }
                    >
                      Load more ({appsFiltered.length - appsVisible} remaining)
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>

      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      <div className="mt-5">{action}</div>
    </div>
  );
}

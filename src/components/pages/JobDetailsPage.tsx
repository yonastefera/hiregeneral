"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe,
  MapPin,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { JobCard } from "@/components/jobs/JobCard";
import { featuredJobs, getJobBySlug } from "@/data/jobPlatform";

export default function JobDetailsPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const slug = params.slug;
  const job = slug ? getJobBySlug(slug) : undefined;

  const [saved, setSaved] = useState(false);

  const related = useMemo(
    () =>
      featuredJobs
        .filter(
          (item) =>
            item.id !== job?.id && item.category === job?.category
        )
        .slice(0, 2),
    [job?.id, job?.category]
  );

  if (!job) {
    return (
      <main className="min-h-screen bg-background">
        <SiteHeader />

        <section className="mx-auto max-w-3xl px-4 py-24 text-center">
          <Badge variant="soft">Job not found</Badge>

          <h1 className="mt-5 text-3xl font-bold tracking-tight">
            This listing is no longer available
          </h1>

          <p className="mt-3 text-muted-foreground">
            The role you’re looking for may have been filled or removed. Browse
            open roles instead.
          </p>

          <Button variant="hero" className="mt-6" asChild>
            <Link href="/jobs">Back to all jobs</Link>
          </Button>
        </section>
      </main>
    );
  }

  const onApply = () => {
    if (job.applyUrl) {
      window.open(job.applyUrl, "_blank", "noopener,noreferrer");
      toast.success(`Opening ${job.company} careers page in a new tab.`);
      return;
    }

    router.push(`/jobs/${job.slug}/apply`);
  };

  const onSave = () => {
    setSaved((value) => !value);
    toast.info(
      saved ? "Removed from saved jobs." : "Saved. Sign in to keep across devices."
    );
  };

  const onShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${job.title} — ${job.company}`,
          url,
        });
        return;
      } catch {
        // User cancelled native share.
      }
    }

    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard.");
  };

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border bg-hero-gradient px-4 pb-10 pt-8">
        <div className="mx-auto max-w-7xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4 -ml-3 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to results
          </Button>

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-primary-gradient text-lg font-bold text-primary-foreground shadow-lift">
                {job.logo}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  {job.company}
                </p>

                <h1 className="mt-1 text-3xl font-bold tracking-tight text-balance md:text-4xl">
                  {job.title}
                </h1>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" />
                    {job.location}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <BriefcaseBusiness className="size-4" />
                    {job.employmentType}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="size-4" />
                    Posted{" "}
                    {job.postedDaysAgo === 0
                      ? "today"
                      : `${job.postedDaysAgo} days ago`}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4" />
                    {job.applicants} applicants
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {job.salary && <Badge variant="success">{job.salary}</Badge>}
                  <Badge variant="soft">{job.workMode}</Badge>
                  <Badge variant="soft">{job.experienceLevel}</Badge>
                  <Badge variant="soft">
                    {job.distance === 0 ? "Remote" : `${job.distance} mi away`}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-stretch">
              <Button variant="hero" size="lg" onClick={onApply}>
                {job.applyUrl ? (
                  <>
                    Apply on {job.company}
                    <ExternalLink className="size-4" />
                  </>
                ) : (
                  <>
                    Apply now
                    <ArrowUpRight className="size-4" />
                  </>
                )}
              </Button>

              <Button
                variant={saved ? "warm" : "glass"}
                size="lg"
                onClick={onSave}
              >
                <Bookmark className={saved ? "fill-current" : ""} />
                {saved ? "Saved" : "Save job"}
              </Button>

              <Button variant="ghost" size="lg" onClick={onShare}>
                <Share2 className="size-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_340px]">
        <article className="space-y-8">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
            <h2 className="text-2xl font-bold tracking-tight">About the role</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {job.description}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
            <h2 className="text-2xl font-bold tracking-tight">What you’ll do</h2>

            <ul className="mt-5 space-y-3">
              {job.responsibilities.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
            <h2 className="text-2xl font-bold tracking-tight">
              What we’re looking for
            </h2>

            <ul className="mt-5 space-y-3">
              {job.requirements.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
            <h2 className="text-2xl font-bold tracking-tight">Benefits</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {job.benefits.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground"
                >
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
            <h2 className="text-2xl font-bold tracking-tight">Skills</h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  <Sparkles className="size-3" />
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary-gradient p-6 text-primary-foreground shadow-lift md:p-8">
            <h2 className="text-2xl font-bold tracking-tight">Ready to apply?</h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/80">
              {job.applyUrl
                ? `Applications are reviewed directly by the ${job.company} hiring team. You’ll be redirected to their careers page.`
                : "Submit your HireGeneral profile and resume to apply in one click."}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="warm" size="lg" onClick={onApply}>
                {job.applyUrl ? (
                  <>
                    Apply on {job.company}
                    <ExternalLink className="size-4" />
                  </>
                ) : (
                  <>
                    Apply now
                    <ArrowUpRight className="size-4" />
                  </>
                )}
              </Button>

              <Button variant="glass" size="lg" onClick={onSave}>
                <Bookmark className={saved ? "fill-current" : ""} />
                {saved ? "Saved" : "Save for later"}
              </Button>
            </div>
          </div>
        </article>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-secondary text-sm font-bold text-secondary-foreground">
                {job.logo}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Company
                </p>
                <p className="font-semibold">{job.company}</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {job.companyTagline}
            </p>

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Building2 className="size-4" />
                {job.companySize}
              </p>

              <p className="flex items-center gap-2">
                <MapPin className="size-4" />
                {job.location}
              </p>

              {job.companyWebsite && (
                <a
                  href={job.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                >
                  <Globe className="size-4" />
                  Visit careers site
                </a>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-soft">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Job snapshot
            </h3>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">{job.employmentType}</dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Work mode</dt>
                <dd className="font-medium">{job.workMode}</dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Experience</dt>
                <dd className="font-medium">{job.experienceLevel}</dd>
              </div>

              {job.salary && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Salary</dt>
                  <dd className="font-medium">{job.salary}</dd>
                </div>
              )}

              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium">{job.category}</dd>
              </div>
            </dl>
          </div>

          {related.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Similar roles
              </h3>

              {related.map((item) => (
                <JobCard
                  key={item.id}
                  job={item}
                  saved={false}
                  onSave={() => toast.info("Sign in to save jobs.")}
                />
              ))}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
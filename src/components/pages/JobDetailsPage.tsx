"use client";

import { useEffect, useState } from "react";
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
  Loader2,
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
import type { Job, JobCardShape } from "@/lib/db/types";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatSalary(min: number | null, max: number | null, currency = "USD") {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

function daysAgoLabel(postedAt: string) {
  return Math.floor((Date.now() - new Date(postedAt).getTime()) / 86_400_000);
}

function toCardShape(job: Job): JobCardShape {
  return {
    id: job.id,
    slug: job.slug,
    company: job.company_name,
    logo: job.company_logo_url ?? job.company_name.slice(0, 2).toUpperCase(),
    title: job.title,
    location: job.location,
    postedDaysAgo: daysAgoLabel(job.posted_at),
    employmentType: job.employment_type,
    summary: job.description.slice(0, 180),
    salary: formatSalary(job.salary_min, job.salary_max, job.salary_currency),
    workMode: job.work_mode,
    distance: 0,
    skills: job.skills,
    applicants: job.applicant_count ?? 0,
    applyUrl: job.apply_url ?? null,
  };
}

// ─── component ──────────────────────────────────────────────────────────────

export default function JobDetailsPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug   = params?.slug;

  const [job, setJob]         = useState<Job | null>(null);
  const [related, setRelated] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved]     = useState(false);

  // Fetch main job
  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    fetch(`/api/jobs/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data: Job) => {
        setJob(data);
        // Fetch related jobs in same category
        if (data.category) {
          const params = new URLSearchParams({
            category: data.category,
            pageSize: "3",
            excludeId: data.id,
          });
          return fetch(`/api/jobs?${params}`).then((r) => r.json());
        }
      })
      .then((res) => {
        if (res?.data) setRelated(res.data.filter((j: Job) => j.id !== slug));
      })
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [slug]);

  // ── Loading state ──
  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </main>
    );
  }

  // ── Not found ──
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
            The role you&apos;re looking for may have been filled or removed.
          </p>
          <Button variant="hero" className="mt-6" asChild>
            <Link href="/jobs">Back to all jobs</Link>
          </Button>
        </section>
      </main>
    );
  }

  // ── Derived ──
  const salary       = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
  const postedDays   = daysAgoLabel(job.posted_at);
  const isExternal   = Boolean(job.apply_url);
  const logoInitials = job.company_name.slice(0, 2).toUpperCase();

  const onApply = () => {
    if (isExternal && job.apply_url) {
      window.open(job.apply_url, "_blank", "noopener,noreferrer");
      toast.success(`Opening ${job.company_name} careers page in a new tab.`);
      return;
    }
    router.push(`/jobs/${job.slug}/apply`);
  };

  const onSave = () => {
    setSaved((v) => !v);
    toast.info(saved ? "Removed from saved jobs." : "Saved. Sign in to keep across devices.");
  };

  const onShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `${job.title} — ${job.company_name}`, url }); return; }
      catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard.");
  };

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />

      {/* ── Hero ── */}
      <section className="border-b border-border bg-hero-gradient px-4 pb-10 pt-8">
        <div className="mx-auto max-w-7xl">
          <Button
            variant="ghost" size="sm"
            onClick={() => router.back()}
            className="mb-4 -ml-3 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to results
          </Button>

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              {job.company_logo_url ? (
                <img
                  src={job.company_logo_url}
                  alt={job.company_name}
                  className="size-16 shrink-0 rounded-xl object-contain shadow-lift"
                />
              ) : (
                <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-primary-gradient text-lg font-bold text-primary-foreground shadow-lift">
                  {logoInitials}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">{job.company_name}</p>
                <h1 className="mt-1 text-balance text-3xl font-bold tracking-tight md:text-4xl">
                  {job.title}
                </h1>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{job.location}</span>
                  <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness className="size-4" />{job.employment_type}</span>
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4" />
                    Posted {postedDays === 0 ? "today" : `${postedDays} days ago`}
                  </span>
                  <span className="inline-flex items-center gap-1.5"><Users className="size-4" />{job.applicant_count ?? 0} applicants</span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {salary && <Badge variant="success">{salary}</Badge>}
                  <Badge variant="soft">{job.work_mode}</Badge>
                  {job.experience_level && <Badge variant="soft">{job.experience_level}</Badge>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-stretch">
              <Button variant="hero" size="lg" onClick={onApply}>
                {isExternal ? (<>Apply on {job.company_name}<ExternalLink className="size-4" /></>) : (<>Apply now<ArrowUpRight className="size-4" /></>)}
              </Button>
              <Button variant={saved ? "warm" : "glass"} size="lg" onClick={onSave}>
                <Bookmark className={saved ? "fill-current" : ""} />
                {saved ? "Saved" : "Save job"}
              </Button>
              <Button variant="ghost" size="lg" onClick={onShare}>
                <Share2 className="size-4" /> Share
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_340px]">
        <article className="space-y-8">

          {/* About */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
            <h2 className="text-2xl font-bold tracking-tight">About the role</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{job.description}</p>
          </div>

          {/* Responsibilities */}
          {job.responsibilities.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
              <h2 className="text-2xl font-bold tracking-tight">What you&apos;ll do</h2>
              <ul className="mt-5 space-y-3">
                {job.responsibilities.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {job.requirements.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
              <h2 className="text-2xl font-bold tracking-tight">What we&apos;re looking for</h2>
              <ul className="mt-5 space-y-3">
                {job.requirements.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {job.benefits.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
              <h2 className="text-2xl font-bold tracking-tight">Benefits</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {job.benefits.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {job.skills.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
              <h2 className="text-2xl font-bold tracking-tight">Skills</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1">
                    <Sparkles className="size-3" />{skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="rounded-xl border border-primary/20 bg-primary-gradient p-6 text-primary-foreground shadow-lift md:p-8">
            <h2 className="text-2xl font-bold tracking-tight">Ready to apply?</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/80">
              {isExternal
                ? `Applications are reviewed directly by the ${job.company_name} hiring team. You'll be redirected to their careers page.`
                : "Submit your HireGeneral profile and resume to apply in one click."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="warm" size="lg" onClick={onApply}>
                {isExternal ? (<>Apply on {job.company_name}<ExternalLink className="size-4" /></>) : (<>Apply now<ArrowUpRight className="size-4" /></>)}
              </Button>
              <Button variant="glass" size="lg" onClick={onSave}>
                <Bookmark className={saved ? "fill-current" : ""} />
                {saved ? "Saved" : "Save for later"}
              </Button>
            </div>
          </div>
        </article>

        {/* ── Sidebar ── */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-soft">
            <div className="flex items-center gap-3">
              {job.company_logo_url ? (
                <img src={job.company_logo_url} alt={job.company_name} className="size-10 rounded-lg object-contain" />
              ) : (
                <div className="grid size-10 place-items-center rounded-lg bg-secondary text-sm font-bold text-secondary-foreground">
                  {logoInitials}
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Company</p>
                <p className="font-semibold">{job.company_name}</p>
              </div>
            </div>

            {job.company_tagline && (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{job.company_tagline}</p>
            )}

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              {job.company_size && (
                <p className="flex items-center gap-2"><Building2 className="size-4" />{job.company_size}</p>
              )}
              <p className="flex items-center gap-2"><MapPin className="size-4" />{job.location}</p>
              {job.company_website && (
                <a href={job.company_website} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-primary hover:underline">
                  <Globe className="size-4" /> Visit careers site
                </a>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-soft">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Job snapshot</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Type</dt><dd className="font-medium">{job.employment_type}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Work mode</dt><dd className="font-medium">{job.work_mode}</dd></div>
              {job.experience_level && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Experience</dt><dd className="font-medium">{job.experience_level}</dd></div>}
              {salary && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Salary</dt><dd className="font-medium">{salary}</dd></div>}
              {job.category && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Category</dt><dd className="font-medium">{job.category}</dd></div>}
            </dl>
          </div>

          {related.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Similar roles</h3>
              {related.map((item) => (
                <JobCard
                  key={item.id}
                  job={toCardShape(item) as any}
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

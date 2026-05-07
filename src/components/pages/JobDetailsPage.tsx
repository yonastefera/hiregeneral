"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
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
import { useSavedJobs } from "@/hooks/useSavedJobs";
import type { Job } from "@/lib/db/types";
import { isSupportedLogoUrl } from "@/lib/logos";
import { htmlToText, cleanTextArray } from "@/lib/text/html";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatSalary(
  min: number | null,
  max: number | null,
  currency = "USD",
) {
  if (!min && !max) return null;

  const fmt = (n: number) =>
    Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);

  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;

  return `Up to ${fmt(max!)}`;
}

function daysAgoLabel(postedAt: string | null | undefined) {
  if (!postedAt) return 0;

  const postedTime = new Date(postedAt).getTime();

  if (Number.isNaN(postedTime)) return 0;

  return Math.max(Math.floor((Date.now() - postedTime) / 86_400_000), 0);
}

function supportedLogoUrl(value: string | null | undefined) {
  return value && isSupportedLogoUrl(value) ? value : null;
}

function cleanJob(job: Job): Job {
  return {
    ...job,
    title: htmlToText(job.title),
    description: htmlToText(job.description),
    company_tagline: job.company_tagline
      ? htmlToText(job.company_tagline)
      : job.company_tagline,
    responsibilities: cleanTextArray(job.responsibilities),
    requirements: cleanTextArray(job.requirements),
    benefits: cleanTextArray(job.benefits),
    skills: job.skills ?? [],
  };
}

function compactText(value: string) {
  return htmlToText(value)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function splitSentences(value: string, maxItems = 8) {
  const cleaned = compactText(value);

  if (!cleaned) return [];

  return cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((item) => item.trim())
    .filter((item) => item.length > 20)
    .slice(0, maxItems);
}

function splitBullets(value: string, maxItems = 10) {
  const cleaned = htmlToText(value)
    .replace(/\r/g, "\n")
    .replace(/•/g, "\n• ")
    .replace(/\s*;\s*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();

  const bulletItems = cleaned
    .split(/\n|•| - | – /)
    .map((item) => compactText(item))
    .filter((item) => item.length > 12);

  if (bulletItems.length > 1) {
    return bulletItems.slice(0, maxItems);
  }

  return splitSentences(cleaned, maxItems);
}

type DerivedSections = {
  about: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  extra: string[];
};

function removeSectionHeading(value: string, headings: string[]) {
  let result = compactText(value);

  for (const heading of headings) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(`^${escaped}\\s*`, "i"), "");
  }

  return result.trim();
}

function deriveDescriptionSections(job: Job): DerivedSections {
  const fullText = htmlToText(job.description)
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const existingResponsibilities = cleanTextArray(job.responsibilities);
  const existingRequirements = cleanTextArray(job.requirements);
  const existingBenefits = cleanTextArray(job.benefits);

  const sectionPattern =
    /(Who we are|About the role|About Stripe|About the team|About this role|In this role, you will|What you’ll do|What you'll do|Responsibilities|What we’re looking for|What we're looking for|Who you are|Required qualifications|Desired qualifications|Minimum requirements|Preferred qualifications|Job expectations|Requirements|Qualifications|Benefits|Pay range|Pay and benefits|Compensation|Salary|Posting end date|We value equal opportunity|Applicants with disabilities|Drug and alcohol policy|Recruitment and hiring requirements)/gi;

  const markers = [...fullText.matchAll(sectionPattern)].map((match) => ({
    label: match[0],
    index: match.index ?? 0,
  }));

  if (markers.length === 0) {
    return {
      about: splitSentences(fullText, 4).join(" "),
      responsibilities: existingResponsibilities,
      requirements: existingRequirements,
      benefits: existingBenefits,
      extra: [],
    };
  }

  const chunks = markers.map((marker, index) => {
    const next = markers[index + 1];
    const raw = fullText.slice(marker.index, next?.index ?? fullText.length);

    return {
      label: marker.label.toLowerCase(),
      text: raw,
    };
  });

  const aboutChunks: string[] = [];
  const responsibilityChunks: string[] = [];
  const requirementChunks: string[] = [];
  const benefitChunks: string[] = [];
  const extraChunks: string[] = [];

  for (const chunk of chunks) {
    const label = chunk.label;

    if (
      label.includes("who we are") ||
      label.includes("about") ||
      label.includes("team")
    ) {
      aboutChunks.push(
        removeSectionHeading(chunk.text, [
          "Who we are",
          "About the role",
          "About Stripe",
          "About the team",
          "About this role",
        ]),
      );
      continue;
    }

    if (
      label.includes("in this role") ||
      label.includes("what you") ||
      label.includes("responsibilities")
    ) {
      responsibilityChunks.push(
        removeSectionHeading(chunk.text, [
          "In this role, you will",
          "What you’ll do",
          "What you'll do",
          "Responsibilities",
        ]),
      );
      continue;
    }

    if (
      label.includes("looking for") ||
      label.includes("who you are") ||
      label.includes("requirements") ||
      label.includes("qualifications") ||
      label.includes("job expectations")
    ) {
      requirementChunks.push(
        removeSectionHeading(chunk.text, [
          "What we’re looking for",
          "What we're looking for",
          "Who you are",
          "Required qualifications",
          "Desired qualifications",
          "Minimum requirements",
          "Preferred qualifications",
          "Job expectations",
          "Requirements",
          "Qualifications",
        ]),
      );
      continue;
    }

    if (
      label.includes("benefits") ||
      label.includes("compensation") ||
      label.includes("salary")
    ) {
      benefitChunks.push(
        removeSectionHeading(chunk.text, [
          "Benefits",
          "Pay and benefits",
          "Compensation",
          "Salary",
        ]),
      );
      continue;
    }

    if (
      label.includes("posting end date") ||
      label.includes("equal opportunity") ||
      label.includes("disabilities") ||
      label.includes("drug and alcohol") ||
      label.includes("recruitment and hiring")
    ) {
      continue;
    }

    extraChunks.push(chunk.text);
  }

  const about =
    aboutChunks.length > 0
      ? splitSentences(aboutChunks.join(" "), 4).join(" ")
      : splitSentences(fullText, 4).join(" ");

  const responsibilities =
    existingResponsibilities.length > 0
      ? existingResponsibilities
      : splitBullets(responsibilityChunks.join("\n"), 8);

  const requirements =
    existingRequirements.length > 0
      ? existingRequirements
      : splitBullets(requirementChunks.join("\n"), 8);

  const benefits =
    existingBenefits.length > 0
      ? existingBenefits
      : splitBullets(benefitChunks.join("\n"), 6);

  return {
    about,
    responsibilities,
    requirements,
    benefits,
    extra: splitSentences(extraChunks.join(" "), 4),
  };
}

function similarSummary(job: Job) {
  const text = compactText(job.description);

  if (text.length <= 110) return text;

  return `${text.slice(0, 110).trim()}...`;
}

async function fetchRelatedJobs(job: Job, slug: string) {
  const searches = [
    job.category
      ? new URLSearchParams({
          category: job.category,
          pageSize: "3",
          excludeId: job.id,
        })
      : null,
    new URLSearchParams({
      company: job.company_name,
      pageSize: "3",
      excludeId: job.id,
    }),
    new URLSearchParams({
      query: job.title.split(/\s+/).slice(0, 2).join(" "),
      pageSize: "3",
      excludeId: job.id,
    }),
  ].filter((params): params is URLSearchParams => Boolean(params));

  for (const params of searches) {
    const response = await fetch(`/api/jobs?${params.toString()}`);

    if (!response.ok) continue;

    const body = await response.json();
    const jobs = Array.isArray(body.data) ? (body.data as Job[]) : [];
    const cleanedRelated = jobs
      .map(cleanJob)
      .filter((relatedJob) => relatedJob.id !== job.id)
      .filter((relatedJob) => relatedJob.slug !== slug);

    if (cleanedRelated.length > 0) {
      return cleanedRelated.slice(0, 3);
    }
  }

  return [];
}

// ─── similar role card ──────────────────────────────────────────────────────

function SimilarRoleCard({
  job,
  saved,
  saving,
  onSave,
}: {
  job: Job;
  saved: boolean;
  saving: boolean;
  onSave: (jobId: string) => void;
}) {
  const router = useRouter();

  const href = `/jobs/${job.slug ?? job.id}`;
  const logoInitials = job.company_name.slice(0, 2).toUpperCase();
  const postedDays = daysAgoLabel(job.posted_at);
  const isExternal = Boolean(job.apply_url);
  const salary = formatSalary(
    job.salary_min,
    job.salary_max,
    job.salary_currency,
  );
  const logoUrl = supportedLogoUrl(job.company_logo_url);

  const goToDetails = () => {
    router.push(href);
  };

  const onApply = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (isExternal && job.apply_url) {
      window.open(job.apply_url, "_blank", "noopener,noreferrer");
      return;
    }

    router.push(`${href}/apply`);
  };

  const onSaveClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (saving) return;

    onSave(job.id);
  };

  return (
    <article className="rounded-xl border border-border bg-card p-6 shadow-soft transition-colors hover:border-primary/40 hover:shadow-lift">
      <div className="flex items-start justify-between gap-5">
        <div className="flex min-w-0 items-center gap-4">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${job.company_name} logo`}
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-lg object-contain"
            />
          ) : (
            <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-secondary text-sm font-bold text-secondary-foreground">
              {logoInitials}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">
              {job.company_name}
            </p>

            <button
              type="button"
              onClick={goToDetails}
              className="mt-4 line-clamp-2 text-left text-2xl font-bold leading-tight tracking-tight text-foreground transition-colors hover:text-primary"
            >
              {job.title}
            </button>
          </div>
        </div>

        <button
          type="button"
          aria-label={saved ? "Remove saved job" : "Save job"}
          aria-pressed={saved}
          disabled={saving}
          onClick={onSaveClick}
          className="grid size-12 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:cursor-wait disabled:opacity-70 aria-pressed:border-primary/40 aria-pressed:bg-primary/10 aria-pressed:text-primary"
        >
          {saving ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Bookmark className={saved ? "size-6 fill-current" : "size-6"} />
          )}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <MapPin className="size-4 shrink-0" />
          <span className="line-clamp-1">{job.location}</span>
        </span>

        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="size-4" />
          {postedDays === 0 ? "Today" : `${postedDays}d ago`}
        </span>
      </div>

      <div className="mt-6 border-t border-dashed border-border" />

      <p className="mt-5 line-clamp-3 text-base leading-7 text-muted-foreground">
        {similarSummary(job)}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{job.employment_type}</Badge>
        <Badge variant="soft">{job.work_mode}</Badge>
        {salary && <Badge variant="secondary">{salary}</Badge>}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/60 pt-5">
        <button
          type="button"
          onClick={goToDetails}
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
        >
          Details <ArrowRight className="size-4" />
        </button>

        <Button size="lg" onClick={onApply}>
          Apply
          {isExternal ? (
            <ExternalLink className="size-4" />
          ) : (
            <ArrowRight className="size-4" />
          )}
        </Button>
      </div>
    </article>
  );
}

// ─── component ──────────────────────────────────────────────────────────────

export default function JobDetailsPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const { isSaved, toggleSaved, pendingId } = useSavedJobs();

  const [job, setJob] = useState<Job | null>(null);
  const [related, setRelated] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);

    fetch(`/api/jobs/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data: Job) => {
        const cleanedJob = cleanJob(data);
        setJob(cleanedJob);
        return fetchRelatedJobs(cleanedJob, slug);
      })
      .then((nextRelated) => {
        setRelated(nextRelated);
      })
      .catch(() => {
        setJob(null);
        setRelated([]);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const sections = useMemo(() => {
    if (!job) return null;
    return deriveDescriptionSections(job);
  }, [job]);

  // ── Loading state ──
  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </main>
    );
  }

  // ── Not found ──
  if (!job || !sections) {
    return (
      <main className="min-h-screen bg-background">
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
  const salary = formatSalary(
    job.salary_min,
    job.salary_max,
    job.salary_currency,
  );

  const postedDays = daysAgoLabel(job.posted_at);
  const isExternal = Boolean(job.apply_url);
  const logoInitials = job.company_name.slice(0, 2).toUpperCase();
  const logoUrl = supportedLogoUrl(job.company_logo_url);
  const saved = isSaved(job.id);
  const saving = pendingId === job.id;

  const onApply = () => {
    if (isExternal && job.apply_url) {
      window.open(job.apply_url, "_blank", "noopener,noreferrer");
      toast.success(`Opening ${job.company_name} careers page in a new tab.`);
      return;
    }

    router.push(`/jobs/${job.slug}/apply`);
  };

  const onSave = async () => {
    const nowSaved = await toggleSaved(job.id);
    toast.info(nowSaved ? "Saved to your jobs." : "Removed from saved jobs.");
  };

  const onShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${job.title} — ${job.company_name}`,
          url,
        });
        return;
      } catch {
        // Share cancelled.
      }
    }

    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard.");
  };

  return (
    <main className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <section className="border-b border-border bg-hero-gradient px-4 pb-10 pt-8">
        <div className="mx-auto max-w-7xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4 -ml-3 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to results
          </Button>

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={`${job.company_name} logo`}
                  width={64}
                  height={64}
                  className="size-16 shrink-0 rounded-xl object-contain shadow-lift"
                />
              ) : (
                <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-primary-gradient text-lg font-bold text-primary-foreground shadow-lift">
                  {logoInitials}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  {job.company_name}
                </p>

                <h1 className="mt-1 text-balance text-3xl font-bold tracking-tight md:text-4xl">
                  {job.title}
                </h1>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" />
                    {job.location}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <BriefcaseBusiness className="size-4" />
                    {job.employment_type}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="size-4" />
                    Posted{" "}
                    {postedDays === 0 ? "today" : `${postedDays} days ago`}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4" />
                    {job.applicant_count ?? 0} applicants
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {salary && <Badge variant="success">{salary}</Badge>}

                  <Badge variant="soft">{job.work_mode}</Badge>

                  {job.experience_level && (
                    <Badge variant="soft">{job.experience_level}</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="hero" size="lg" onClick={onApply}>
                {isExternal ? (
                  <>
                    Apply on {job.company_name}
                    <ExternalLink className="size-4" />
                  </>
                ) : (
                  <>
                    Apply now
                    <ArrowUpRight className="size-4" />
                  </>
                )}
              </Button>

              <button
                type="button"
                aria-label={saved ? "Remove saved job" : "Save job"}
                aria-pressed={saved}
                onClick={onSave}
                disabled={saving}
                className="grid size-12 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:cursor-wait disabled:opacity-70 aria-pressed:border-primary/40 aria-pressed:bg-primary/10 aria-pressed:text-primary"
              >
                {saving ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <Bookmark
                    className={saved ? "size-6 fill-current" : "size-6"}
                  />
                )}
              </button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onShare}
                aria-label="Share job"
                className="size-12 rounded-lg"
              >
                <Share2 className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_340px]">
        <article className="space-y-8">
          {/* About */}
          {sections.about && (
            <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
              <h2 className="text-2xl font-bold tracking-tight">
                About the role
              </h2>

              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {sections.about}
              </p>
            </div>
          )}

          {/* Responsibilities */}
          {sections.responsibilities.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
              <h2 className="text-2xl font-bold tracking-tight">
                What you&apos;ll do
              </h2>

              <ul className="mt-5 space-y-3">
                {sections.responsibilities.map((item) => (
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
          )}

          {/* Requirements */}
          {sections.requirements.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
              <h2 className="text-2xl font-bold tracking-tight">
                What we&apos;re looking for
              </h2>

              <ul className="mt-5 space-y-3">
                {sections.requirements.map((item) => (
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
          )}

          {/* Benefits */}
          {sections.benefits.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
              <h2 className="text-2xl font-bold tracking-tight">Benefits</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {sections.benefits.map((item) => (
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
          )}

          {/* Additional info */}
          {sections.extra.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
              <h2 className="text-2xl font-bold tracking-tight">
                Additional details
              </h2>

              <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                {sections.extra.map((item) => (
                  <p key={item}>{item}</p>
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
                    <Sparkles className="size-3" />
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="rounded-xl border border-primary/20 bg-primary-gradient p-6 text-primary-foreground shadow-lift md:p-8">
            <h2 className="text-2xl font-bold tracking-tight">
              Ready to apply?
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/80">
              {isExternal
                ? `Applications are reviewed directly by the ${job.company_name} hiring team. You'll be redirected to their careers page.`
                : "Submit your HireGeneral profile and resume to apply in one click."}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="warm" size="lg" onClick={onApply}>
                {isExternal ? (
                  <>
                    Apply on {job.company_name}
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
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Bookmark className={saved ? "fill-current" : ""} />
                )}
                {saving ? "Saving…" : saved ? "Saved" : "Save for later"}
              </Button>
            </div>
          </div>

          {related.length > 0 && (
            <section className="space-y-4 pt-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Similar roles
              </h2>

              <div className="space-y-5">
                {related.map((item) => (
                  <SimilarRoleCard
                    key={item.id}
                    job={item}
                    saved={isSaved(item.id)}
                    saving={pendingId === item.id}
                    onSave={toggleSaved}
                  />
                ))}
              </div>
            </section>
          )}
        </article>

        {/* ── Sidebar ── */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-soft">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={`${job.company_name} logo`}
                  width={40}
                  height={40}
                  className="size-10 rounded-lg object-contain"
                />
              ) : (
                <div className="grid size-10 place-items-center rounded-lg bg-secondary text-sm font-bold text-secondary-foreground">
                  {logoInitials}
                </div>
              )}

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Company
                </p>
                <p className="font-semibold">{job.company_name}</p>
              </div>
            </div>

            {job.company_tagline && (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {job.company_tagline}
              </p>
            )}

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              {job.company_size && (
                <p className="flex items-center gap-2">
                  <Building2 className="size-4" />
                  {job.company_size}
                </p>
              )}

              <p className="flex items-center gap-2">
                <MapPin className="size-4" />
                {job.location}
              </p>

              {job.company_website && (
                <a
                  href={job.company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                >
                  <Globe className="size-4" /> Visit careers site
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
                <dd className="font-medium">{job.employment_type}</dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Work mode</dt>
                <dd className="font-medium">{job.work_mode}</dd>
              </div>

              {job.experience_level && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Experience</dt>
                  <dd className="font-medium">{job.experience_level}</dd>
                </div>
              )}

              {salary && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Salary</dt>
                  <dd className="font-medium">{salary}</dd>
                </div>
              )}

              {job.category && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="text-right font-medium">{job.category}</dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </section>
    </main>
  );
}

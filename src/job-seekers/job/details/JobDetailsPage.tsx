import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  Globe,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import JobDetailsActions from "./JobDetailsActions";
import JobPostingJsonLd from "./JobPostingJsonLd";
import SimilarRoles from "./SimilarRoles";
import { getJobDetailsPageData } from "./job-details-data";
import {
  daysAgoLabel,
  deriveDescriptionSections,
  formatSalary,
  getDisplayLocation,
  getDisplayTitle,
  supportedLogoUrl,
} from "./job-details-utils";

type JobDetailsPageProps = {
  jobId: string;
};

export default async function JobDetailsPage({ jobId }: JobDetailsPageProps) {
  const { job, related } = await getJobDetailsPageData(jobId);

  if (!job) {
    notFound();
  }

  const sections = deriveDescriptionSections(job);
  const salary = formatSalary(
    job.salary_min,
    job.salary_max,
    job.salary_currency,
  );

  const postedDays = daysAgoLabel(job.posted_at);
  const logoInitials = job.company_name.slice(0, 2).toUpperCase();
  const logoUrl = supportedLogoUrl(job.company_logo_url);
  const displayTitle = getDisplayTitle(job);
  const heroLocation = getDisplayLocation(job);

  return (
    <main className="min-h-screen bg-background">
      <JobPostingJsonLd job={job} />

      <section className="border-b border-border bg-hero-gradient px-4 pb-10 pt-8">
        <div className="mx-auto max-w-416 px-4 md:px-6 xl:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-3 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/jobs">
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to results
            </Link>
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
                  {displayTitle}
                </h1>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin aria-hidden="true" className="size-4" />
                    <span className="line-clamp-2" title={job.location}>
                      {heroLocation}
                    </span>
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <BriefcaseBusiness aria-hidden="true" className="size-4" />
                    {job.employment_type}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 aria-hidden="true" className="size-4" />
                    Posted{" "}
                    {postedDays === 0 ? "today" : `${postedDays} days ago`}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <Users aria-hidden="true" className="size-4" />
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

            <JobDetailsActions
              jobId={job.id}
              slug={job.slug}
              companyName={job.company_name}
              title={displayTitle}
              applyUrl={job.apply_url}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-416 gap-8 px-4 py-10 md:px-6 lg:grid-cols-[minmax(0,64rem)_minmax(26rem,32rem)] xl:px-8">
        <article className="space-y-8">
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
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-success"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sections.benefits.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
              <h2 className="text-2xl font-bold tracking-tight">Benefits</h2>

              <ul className="mt-5 grid gap-3 md:grid-cols-2">
                {sections.benefits.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-lg bg-background/70 p-4 text-sm leading-6 text-muted-foreground ring-1 ring-inset ring-border/70"
                  >
                    <Sparkles
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-accent"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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

          {job.skills.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
              <h2 className="text-2xl font-bold tracking-tight">Skills</h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1">
                    <Sparkles aria-hidden="true" className="size-3" />
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-primary/20 bg-primary-gradient p-6 text-primary-foreground shadow-lift md:p-8">
            <h2 className="text-2xl font-bold tracking-tight">
              Ready to apply?
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/80">
              {job.apply_url
                ? `Applications are reviewed directly by the ${job.company_name} hiring team. You'll be redirected to their careers page.`
                : "Submit your HireGeneral profile and resume to apply in one click."}
            </p>

            <JobDetailsActions
              jobId={job.id}
              slug={job.slug}
              companyName={job.company_name}
              title={displayTitle}
              applyUrl={job.apply_url}
              variant="cta"
            />
          </div>
        </article>

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
                  <Building2 aria-hidden="true" className="size-4" />
                  {job.company_size}
                </p>
              )}

              <p className="flex items-center gap-2">
                <MapPin aria-hidden="true" className="size-4 shrink-0" />
                <span title={job.location}>{heroLocation}</span>
              </p>

              {job.company_website && (
                <a
                  href={job.company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
                >
                  <Globe aria-hidden="true" className="size-4" />
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

          <SimilarRoles jobs={related} />
        </aside>
      </section>
    </main>
  );
}

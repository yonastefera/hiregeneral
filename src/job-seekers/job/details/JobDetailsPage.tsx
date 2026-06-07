import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Check,
  CheckCircle2,
  Clock3,
  Globe,
  Heart,
  MapPin,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import type { Job } from "@/lib/db/types";
import { cn } from "@/lib/utils";
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
  sourcePostingHtml,
  supportedLogoUrl,
} from "./job-details-utils";

type JobDetailsPageProps = {
  jobId: string;
};

function LogoMark({
  job,
  size = "lg",
  dark = false,
}: {
  job: Job;
  size?: "md" | "lg";
  dark?: boolean;
}) {
  const logoUrl = supportedLogoUrl(job.company_logo_url);
  const logoInitials = job.company_name.slice(0, 2).toUpperCase();
  const sizeClass =
    size === "lg" ? "size-18 rounded-3xl" : "size-10 rounded-xl";

  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={`${job.company_name} logo`}
        width={size === "lg" ? 72 : 40}
        height={size === "lg" ? 72 : 40}
        className={cn(
          sizeClass,
          "shrink-0 object-contain ring-1 ring-black/5",
          dark ? "bg-white/10" : "bg-white",
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center bg-linear-to-br from-teal-400 to-emerald-500 font-bold text-white shadow-[0_24px_60px_-18px_rgba(13,148,136,0.35)] ring-1 ring-teal-900/10",
        sizeClass,
        size === "lg" ? "text-xl" : "text-[11px]",
      )}
    >
      {logoInitials}
    </div>
  );
}

function postedLabel(days: number) {
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  return `Posted ${days} days ago`;
}

function HeroPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 backdrop-blur",
        className,
      )}
    >
      {children}
    </span>
  );
}

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-black/[0.06] shadow-[0_1px_0_rgba(0,0,0,0.02)] md:p-8",
        className,
      )}
    >
      {children}
    </article>
  );
}

function CompanyRailCard({
  job,
  displayLocation,
}: {
  job: Job;
  displayLocation: string;
}) {
  return (
    <section
      aria-labelledby="job-company-heading"
      className="rounded-3xl border border-black/5 bg-linear-to-br from-neutral-950 to-neutral-800 p-5 text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.7)]"
    >
      <h2
        id="job-company-heading"
        className="text-[10px] uppercase tracking-[0.18em] text-neutral-500"
      >
        Company
      </h2>
      <div className="mt-3 flex items-center gap-3">
        <LogoMark job={job} size="md" dark />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {job.company_name}
          </div>
          <div className="line-clamp-2 text-[12px] leading-5 text-neutral-400">
            {displayLocation}
            {job.company_size ? ` / ${job.company_size}` : ""}
          </div>
        </div>
      </div>

      {job.company_website && (
        <a
          href={job.company_website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-teal-300 hover:text-teal-200"
        >
          <Globe aria-hidden="true" className="size-3.5" />
          Visit careers site
        </a>
      )}
    </section>
  );
}

export default async function JobDetailsPage({ jobId }: JobDetailsPageProps) {
  const { job, related } = await getJobDetailsPageData(jobId);

  if (!job) {
    notFound();
  }

  const sections = deriveDescriptionSections(job);
  const sourceHtml = sourcePostingHtml(job);
  const salary = formatSalary(
    job.salary_min,
    job.salary_max,
    job.salary_currency,
  );
  const postedDays = daysAgoLabel(job.posted_at);
  const displayTitle = getDisplayTitle(job);
  const heroLocation = getDisplayLocation(job);
  const applicantCount = job.applicant_count ?? 0;
  const heroPills = [
    {
      label: job.work_mode,
      className: "bg-white/80 text-neutral-800 ring-black/5",
    },
    job.category && {
      label: job.category,
      className: "bg-teal-50 text-teal-800 ring-teal-200/60",
    },
    salary && {
      label: salary,
      className: "bg-emerald-50 text-emerald-800 ring-emerald-200/70",
    },
    job.experience_level && {
      label: job.experience_level,
      className: "bg-orange-50 text-orange-800 ring-orange-200/70",
    },
  ].filter((pill): pill is { label: string; className: string } =>
    Boolean(pill),
  );

  return (
    <main className="min-h-screen bg-[#f0f6f7] text-neutral-950 antialiased">
      <JobPostingJsonLd job={job} />

      <section className="relative overflow-hidden bg-[#f0f6f7]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 55% at 10% 20%, rgba(94, 234, 212, 0.22) 0%, transparent 60%), radial-gradient(50% 45% at 90% 10%, rgba(251, 146, 60, 0.18) 0%, transparent 55%), radial-gradient(45% 50% at 50% 100%, rgba(110, 231, 183, 0.20) 0%, transparent 60%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pt-8 md:px-6">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-[13px] text-neutral-600 transition hover:text-neutral-900"
          >
            <ArrowLeft aria-hidden="true" className="size-3.5" />
            Back to results
          </Link>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-6 md:px-6">
          <div className="grid items-start gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="min-w-0 pt-14">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <LogoMark job={job} size="lg" />
                    <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                      <Check
                        aria-hidden="true"
                        className="size-3.5"
                        strokeWidth={3}
                      />
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-[13px] font-semibold text-teal-700">
                    <span className="rounded-md bg-teal-50 px-2 py-0.5 ring-1 ring-teal-200/60">
                      {job.company_name}
                    </span>
                    <span className="text-neutral-300">/</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-emerald-500 to-teal-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm shadow-emerald-500/30">
                      <Sparkles aria-hidden="true" className="size-3" />
                      Curated role
                    </span>
                  </div>
                </div>

                <h1 className="mt-5 max-w-4xl text-balance text-3xl font-semibold leading-[1.1] tracking-tight md:text-4xl">
                  {displayTitle}
                </h1>

                <div className="mt-4 flex max-w-4xl flex-col gap-2 text-[13px] text-neutral-700 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <MapPin
                      aria-hidden="true"
                      className="size-3.5 shrink-0 text-teal-600"
                    />
                    <span className="line-clamp-2" title={job.location}>
                      {heroLocation}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase
                      aria-hidden="true"
                      className="size-3.5 text-orange-500"
                    />
                    {job.employment_type}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3
                      aria-hidden="true"
                      className="size-3.5 text-emerald-600"
                    />
                    {postedLabel(postedDays)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users
                      aria-hidden="true"
                      className="size-3.5 text-rose-500"
                    />
                    {applicantCount} applicants
                  </span>
                </div>

                {heroPills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {heroPills.map((pill) => (
                      <HeroPill key={pill.label} className={pill.className}>
                        {pill.label}
                      </HeroPill>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="relative overflow-hidden rounded-3xl border border-teal-900/10 bg-white p-5 shadow-[0_30px_80px_-30px_rgba(13,148,136,0.35)]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-linear-to-br from-teal-300/40 to-emerald-400/30 blur-2xl"
                />
                <div className="relative">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-emerald-700">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Accepting applications
                  </div>

                  {salary && (
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="bg-linear-to-br from-neutral-900 to-teal-800 bg-clip-text text-3xl font-semibold tracking-tight text-transparent">
                        {salary}
                      </span>
                      <span className="text-xs text-neutral-500">/ year</span>
                    </div>
                  )}

                  <div className="mt-4">
                    <JobDetailsActions
                      jobId={job.id}
                      slug={job.slug}
                      companyName={job.company_name}
                      title={displayTitle}
                      applyUrl={job.apply_url}
                      variant="apply-card"
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-dashed border-teal-900/10 pt-4">
                    {[
                      { k: "Type", v: job.employment_type, c: "text-teal-700" },
                      { k: "Mode", v: job.work_mode, c: "text-orange-600" },
                      {
                        k: "Level",
                        v: job.experience_level ?? "Open",
                        c: "text-emerald-700",
                      },
                    ].map((item) => (
                      <div key={item.k} className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-neutral-400">
                          {item.k}
                        </div>
                        <div
                          className={cn(
                            "mt-0.5 truncate text-[13px] font-semibold",
                            item.c,
                          )}
                          title={item.v}
                        >
                          {item.v}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#f0f6f7] via-[#f5f9fa] to-[#f0f6f7]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-2 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(390px,430px)] xl:grid-cols-[minmax(0,1fr)_minmax(420px,460px)]">
          <div className="space-y-6">
            {sourceHtml ? (
              <SectionCard>
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-8 h-12 w-1 rounded-r bg-gradient-to-b from-teal-500 to-emerald-600"
                />
                <h2 className="text-2xl font-semibold tracking-tight">
                  About the role
                </h2>
                <div
                  className="source-job-posting mt-5 text-[14.5px] leading-[1.75] text-neutral-700 [&_h2:first-child]:mt-0 [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:uppercase [&_h2]:tracking-[0.08em] [&_h2]:text-neutral-950 [&_h3:first-child]:mt-0 [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-neutral-950 [&_li]:mb-2 [&_li]:pl-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p:first-child]:mt-0 [&_p]:my-3 [&_strong]:font-semibold [&_strong]:text-neutral-950 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6"
                  dangerouslySetInnerHTML={{ __html: sourceHtml }}
                />
              </SectionCard>
            ) : sections.about ? (
              <SectionCard>
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-8 h-12 w-1 rounded-r bg-gradient-to-b from-teal-500 to-emerald-600"
                />
                <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-700">
                  About the role
                </div>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  A closer look at this opportunity.
                </h2>
                <p className="mt-4 text-[15px] leading-[1.75] text-neutral-700">
                  {sections.about}
                </p>
              </SectionCard>
            ) : null}

            {!sourceHtml && sections.responsibilities.length > 0 && (
              <SectionCard>
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-lg bg-teal-100 text-teal-700">
                    <Briefcase aria-hidden="true" className="size-3.5" />
                  </span>
                  <h2 className="text-lg font-semibold tracking-tight">
                    What you&apos;ll do
                  </h2>
                </div>
                <ul className="mt-4 space-y-3">
                  {sections.responsibilities.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-[14.5px] leading-[1.65] text-neutral-700"
                    >
                      <span className="mt-1.5 grid size-4 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white">
                        <Check
                          aria-hidden="true"
                          className="size-2.5"
                          strokeWidth={3.5}
                        />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {!sourceHtml && sections.requirements.length > 0 && (
              <SectionCard className="bg-gradient-to-br from-neutral-950 to-neutral-800 text-white ring-black/10">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-lg bg-white/10 text-teal-300">
                    <Star aria-hidden="true" className="size-3.5" />
                  </span>
                  <h2 className="text-lg font-semibold tracking-tight">
                    What we&apos;re looking for
                  </h2>
                </div>
                <ul className="mt-4 space-y-3">
                  {sections.requirements.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-[14.5px] leading-[1.65] text-neutral-200"
                    >
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {job.skills.length > 0 && (
              <SectionCard>
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Sparkles aria-hidden="true" className="size-3.5" />
                  </span>
                  <h2 className="text-lg font-semibold tracking-tight">
                    Skills mentioned
                  </h2>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </SectionCard>
            )}

            {sections.benefits.length > 0 && (
              <SectionCard className="bg-gradient-to-br from-orange-100 via-amber-50 to-rose-100 ring-orange-200/60">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-orange-300/40 blur-3xl"
                />
                <div className="relative flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-lg bg-orange-500 text-white">
                    <Heart aria-hidden="true" className="size-3.5" />
                  </span>
                  <h2 className="text-lg font-semibold tracking-tight">
                    Benefits and perks
                  </h2>
                </div>
                <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
                  {sections.benefits.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2.5 rounded-2xl bg-white/80 px-4 py-3 text-[13.5px] font-medium text-neutral-800 ring-1 ring-orange-200/40 backdrop-blur"
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className="size-4 shrink-0 text-orange-600"
                      />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {sections.extra.length > 0 && (
              <SectionCard>
                <h2 className="text-lg font-semibold tracking-tight">
                  Additional details
                </h2>
                <div className="mt-4 space-y-3 text-[14.5px] leading-[1.7] text-neutral-700">
                  {sections.extra.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          <aside className="min-w-0">
            <div className="sticky top-24 space-y-4">
              <CompanyRailCard job={job} displayLocation={heroLocation} />
              <SimilarRoles jobs={related} />
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-[#f0f6f7] px-4 pb-16 md:px-6 md:pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-700 p-8 text-white md:p-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-40 -top-40 size-[480px] rounded-full bg-orange-400/30 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-32 -left-20 size-[360px] rounded-full bg-teal-300/30 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />

            <div className="relative grid items-center gap-10 md:grid-cols-12">
              <div className="md:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white ring-1 ring-white/25 backdrop-blur">
                  <Sparkles aria-hidden="true" className="size-3" />
                  Ready to apply?
                </div>
                <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
                  Take the next step.
                  <br />
                  <span className="italic text-orange-200">
                    It takes 90 seconds.
                  </span>
                </h2>
                <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-teal-50/90">
                  {job.apply_url
                    ? `Applications are reviewed directly by the ${job.company_name} hiring team. You will be redirected to their careers page.`
                    : "Submit your HireGeneral profile and resume to apply in one place."}
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-6 text-[12px] text-teal-50/90">
                  {[
                    { k: String(applicantCount), v: "applicants so far" },
                    { k: job.employment_type, v: "role type" },
                    { k: job.work_mode, v: "work mode" },
                  ].map((item) => (
                    <div key={item.v} className="flex items-baseline gap-1.5">
                      <span className="text-xl font-semibold text-white">
                        {item.k}
                      </span>
                      <span>{item.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-5">
                <div className="rounded-3xl bg-white/10 p-2 ring-1 ring-white/20 backdrop-blur">
                  <JobDetailsActions
                    jobId={job.id}
                    slug={job.slug}
                    companyName={job.company_name}
                    title={displayTitle}
                    applyUrl={job.apply_url}
                    variant="cta"
                  />
                </div>
                <p className="mt-3 text-center text-[11px] text-white/70">
                  You can return to this role from saved jobs any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

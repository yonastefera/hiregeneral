import type { JobListing } from "@/data/jobPlatform";
import type { Job } from "@/lib/db/types";

export type JobCardJob = JobListing;

export function formatSalary(
  min: number | null,
  max: number | null,
  currency = "USD",
) {
  if (!min && !max) return undefined;

  const fmt = (n: number) =>
    Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);

  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;

  return `Up to ${fmt(max!)}`;
}

export function postedDaysAgo(postedAt: string | null | undefined) {
  if (!postedAt) return 0;

  const postedTime = new Date(postedAt).getTime();

  if (Number.isNaN(postedTime)) return 0;

  const days = Math.floor((Date.now() - postedTime) / 86_400_000);

  return Math.max(days, 0);
}

const SUMMARY_STOP_WORDS = new Set([
  "and",
  "for",
  "from",
  "lead",
  "manager",
  "principal",
  "senior",
  "the",
  "with",
]);

const DANGLING_SUMMARY_ENDINGS =
  /\b(a|an|and|as|at|by|for|from|in|into|of|on|or|our|the|their|to|using|via|with|without)$/i;

function isBoilerplateSummary(sentence: string) {
  return /\b(equal opportunity|reasonable accommodation|privacy policy|eligible for sponsorship|not eligible for sponsorship|if you already have a profile|log in to check status|click the apply now|complete your application|more than a career|it's a mission|our people are the foundation|pay transparency|benefits eligible|background check|drug test)\b/i.test(
    sentence,
  );
}

function hasCompleteEnding(sentence: string) {
  const trimmed = sentence.trim();

  return /[.!?)]$/.test(trimmed) && !DANGLING_SUMMARY_ENDINGS.test(trimmed);
}

function presentSummary(sentence: string) {
  const trimmed = sentence.trim();

  if (!trimmed) return "";
  if (hasCompleteEnding(trimmed)) return trimmed;

  return `${trimmed.replace(/[,\s]+$/, "")}...`;
}

function roleKeywords(title: string, companyName: string) {
  return `${title} ${companyName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !SUMMARY_STOP_WORDS.has(word));
}

function summaryScore(sentence: string, keywords: string[]) {
  const lower = sentence.toLowerCase();
  let score = 0;

  for (const keyword of keywords) {
    if (lower.includes(keyword)) score += 3;
  }

  if (
    /\b(role|position|team|responsible|support|build|design|develop|deliver|drive|partner|leadership|product|software|data|technology|platform|systems|engineering|analyst)\b/i.test(
      sentence,
    )
  ) {
    score += 4;
  }

  if (sentence.length >= 90) score += 2;
  if (sentence.length >= 160) score += 1;
  if (sentence.length > 420) score -= 2;
  if (/^(about|company|overview)\b/i.test(sentence)) score -= 2;
  if (!hasCompleteEnding(sentence)) score -= 6;

  return score;
}

function jobSummary(
  description: string | null,
  title: string,
  companyName: string,
) {
  if (!description) return "";

  const cleaned = description
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .replace(
      /^The position is described below\.\s*If you want to apply, click the Apply Now button at the top or bottom of this page\.\s*/i,
      "",
    )
    .replace(/^After you click Apply Now[^.]*\.\s*/i, "")
    .replace(
      /\b(Job Summary|Role Summary|Position Summary|Description)\b\s*/gi,
      "",
    )
    .trim();

  const sentences = cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 40)
    .filter((sentence) => !isBoilerplateSummary(sentence));

  const keywords = roleKeywords(title, companyName);
  const [bestSentence] = sentences
    .map((sentence, index) => ({
      sentence,
      index,
      score: summaryScore(sentence, keywords),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  if (bestSentence) {
    const candidate = bestSentence.sentence;
    const following = sentences[bestSentence.index + 1];

    if (
      candidate.length < 120 &&
      following &&
      !isBoilerplateSummary(following)
    ) {
      return presentSummary(`${candidate} ${following}`);
    }

    return presentSummary(candidate);
  }

  return presentSummary(cleaned);
}

export function toJobCardShape(job: Job): JobCardJob {
  const enrichment = job.enrichment;

  return {
    id: job.id,
    slug: job.slug ?? job.id,

    company: job.company_name,
    logo: job.company_logo_url ?? job.company_name.slice(0, 2).toUpperCase(),

    title: enrichment?.display_title ?? job.title,
    location: enrichment?.display_location ?? job.location,
    postedDaysAgo: postedDaysAgo(job.posted_at),
    employmentType: job.employment_type,

    summary:
      enrichment?.summary ??
      jobSummary(job.description, job.title, job.company_name),
    description: job.description ?? "",

    salary: formatSalary(
      job.salary_min,
      job.salary_max,
      job.salary_currency ?? "USD",
    ),

    workMode: job.work_mode,
    distance: 0,

    skills: job.skills ?? [],
    applicants: job.applicant_count ?? 0,

    applyUrl: job.apply_url ?? undefined,

    companyTagline: job.company_tagline ?? "",
    companySize: job.company_size ?? "",
    companyWebsite: job.company_website ?? "",
    experienceLevel: job.experience_level ?? "",
    category: job.category ?? "",

    responsibilities: job.responsibilities ?? [],
    requirements: job.requirements ?? [],
    benefits: job.benefits ?? [],
  };
}

import type { Job } from "@/lib/db/types";
import { listingLocation } from "@/lib/jobs/display";
import { isSupportedLogoUrl, logoSrcFromUrl } from "@/lib/logos";
import {
  cleanTextArray,
  htmlToText,
  sanitizeJobPostingHtml,
} from "@/lib/text/html";

export function formatSalary(
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

export function daysAgoLabel(postedAt: string | null | undefined) {
  if (!postedAt) return 0;

  const postedTime = new Date(postedAt).getTime();

  if (Number.isNaN(postedTime)) return 0;

  return Math.max(Math.floor((Date.now() - postedTime) / 86_400_000), 0);
}

export function supportedLogoUrl(value: string | null | undefined) {
  if (!isSupportedLogoUrl(value)) return null;

  return logoSrcFromUrl(value, 128);
}

export function cleanJob(job: Job): Job {
  return {
    ...job,
    title: htmlToText(job.title),
    description: job.description,
    company_tagline: job.company_tagline
      ? htmlToText(job.company_tagline)
      : job.company_tagline,
    responsibilities: cleanTextArray(job.responsibilities),
    requirements: cleanTextArray(job.requirements),
    benefits: cleanTextArray(job.benefits),
    skills: job.skills ?? [],
  };
}

export function compactText(value: string) {
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

function splitParagraphs(value: string, maxItems = 8) {
  return htmlToText(value)
    .split(/\n{2,}/)
    .map((item) => compactText(item))
    .filter((item) => item.length > 20)
    .slice(0, maxItems);
}

function trimDynamicHeading(value: string) {
  return value
    .replace(/^(?:As an?|As a)\s+[^.\n]{3,160}?,\s+you will:?\s*/i, "")
    .replace(
      /^(?:Here(?:'|’)s what you need|What you need|Nice to have):?\s*/i,
      "",
    )
    .trim();
}

function sanitizeSectionItems(items: string[], maxLength = 260) {
  const blockedPatterns = [
    /\b(equal opportunity|applicants with disabilities|drug and alcohol|posting end date|interview practices)\b/i,
    /\b(accommodation|pay transparency|specific office location|local law|recruitment process)\b/i,
    /\b(job posting will be posted|market competitive suite|see more information)\b/i,
    /\b(annual salary range|role location annual|range california|range colorado)\b/i,
    /\b(actual base salary offer|compensation range listed|wide array of factors)\b/i,
  ];

  return items
    .map((item) => trimDynamicHeading(compactText(item)))
    .filter((item) => item.length >= 16 && item.length <= maxLength)
    .filter((item) => !blockedPatterns.some((pattern) => pattern.test(item)))
    .slice(0, 8);
}

function sanitizeBenefitItems(items: string[]) {
  const fragments = [
    /^[,.;:]/,
    /^(?:actual|and|are|base|for|range|site|plan|here|though)\b/i,
    /\b(eligible employees|eligibility for specific|defined benefit pension|available upon request)\b/i,
    /\b(restricted stock units|advance through the hiring process)\b/i,
    /\b(compensation range listed|base salary offer|hiring process|recruiter can share)\b/i,
    /\$[\d,.]+\s*[-–]\s*\$[\d,.]+/,
  ];

  return sanitizeSectionItems(items)
    .filter((item) => !fragments.some((pattern) => pattern.test(item)))
    .slice(0, 6);
}

function deriveBenefitItemsFromText(value: string) {
  const text = htmlToText(value);
  const match = text.match(
    /Wolters Kluwer offers[\s\S]*?(?:available upon request\.|$)/i,
  );
  const source = match?.[0] ?? text;

  const listedBenefits = source.match(
    /including but not limited to:\s*([\s\S]*?)(?:\.|Full details|$)/i,
  );

  if (listedBenefits?.[1]) {
    const items = listedBenefits[1]
      .split(/,\s+|,\s*&\s*|\s+and\s+/)
      .map((item) => compactText(item))
      .filter((item) => item.length > 3 && item.length <= 80);

    if (items.length > 0) {
      return items.slice(0, 6);
    }
  }

  return sanitizeBenefitItems(splitParagraphs(source, 4));
}

export type DerivedSections = {
  about: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  extra: string[];
};

export function sourcePostingHtml(job: Job) {
  const html = sanitizeJobPostingHtml(job.description);

  return htmlToText(html).length >= 180 ? html : "";
}

function removeSectionHeading(value: string, headings: string[]) {
  let result = compactText(value);

  for (const heading of headings) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(`^${escaped}\\s*`, "i"), "");
  }

  return result.trim();
}

export function deriveDescriptionSections(job: Job): DerivedSections {
  const enrichment = job.enrichment;

  if (enrichment) {
    const responsibilities = sanitizeSectionItems(
      enrichment.responsibilities,
      320,
    );
    const requirements = sanitizeSectionItems(enrichment.requirements, 320);
    const benefits = sanitizeBenefitItems(enrichment.benefits);

    if (
      enrichment.about_role ||
      responsibilities.length > 0 ||
      requirements.length > 0 ||
      benefits.length > 0
    ) {
      return {
        about: enrichment.about_role,
        responsibilities,
        requirements,
        benefits,
        extra: [],
      };
    }
  }

  const fullText = htmlToText(job.description)
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const existingResponsibilities = sanitizeSectionItems(
    cleanTextArray(job.responsibilities),
    320,
  );
  const existingRequirements = sanitizeSectionItems(
    cleanTextArray(job.requirements),
    320,
  );
  const existingBenefits = sanitizeBenefitItems(cleanTextArray(job.benefits));

  const sectionPattern =
    /(Who we are|About the role|About Stripe|About Accenture|About the team|About this role|In this role, you will|As an? [^.\n]{3,160}?, you will|What you’ll do|What you'll do|Responsibilities|Other Duties|Job Qualifications|Education and Experience|Here(?:'|’)s what you need|What you need|Nice to have|What we’re looking for|What we're looking for|Who you are|Required qualifications|Desired qualifications|Minimum requirements|Preferred qualifications|Other Knowledge, Skills, Abilities or Certifications|Job expectations|Requirements|Qualifications|Travel requirements|Physical Demands|Benefits|Additional Information|Pay range|Pay and benefits|Compensation|Salary|Our Interview Practices|Posting end date|We value equal opportunity|Applicants with disabilities|Drug and alcohol policy|Recruitment and hiring requirements)/gi;

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
          "About Accenture",
          "About the team",
          "About this role",
        ]),
      );
      continue;
    }

    if (
      label.includes("what you need") ||
      label.includes("nice to have") ||
      label.includes("looking for") ||
      label.includes("who you are") ||
      label.includes("job qualifications") ||
      label.includes("education and experience") ||
      label.includes("other knowledge") ||
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
          "Job Qualifications",
          "Education and Experience",
          "Other Knowledge, Skills, Abilities or Certifications",
          "Job expectations",
          "Requirements",
          "Qualifications",
        ]),
      );
      continue;
    }

    if (
      label.includes("in this role") ||
      label.includes("you will") ||
      label.includes("what you") ||
      label.includes("responsibilities") ||
      label.includes("other duties")
    ) {
      responsibilityChunks.push(
        removeSectionHeading(chunk.text, [
          "In this role, you will",
          "What you’ll do",
          "What you'll do",
          "Responsibilities",
          "Other Duties",
        ]),
      );
      continue;
    }

    if (
      label.includes("benefits") ||
      label.includes("additional information") ||
      label.includes("compensation") ||
      label.includes("salary")
    ) {
      benefitChunks.push(
        removeSectionHeading(chunk.text, [
          "Benefits",
          "Pay and benefits",
          "Additional Information",
          "Compensation",
          "Salary",
        ]),
      );
      continue;
    }

    if (
      label.includes("our interview practices") ||
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
      : sanitizeSectionItems(
          splitBullets(responsibilityChunks.join("\n"), 8),
          320,
        );

  const requirements =
    existingRequirements.length > 0
      ? existingRequirements
      : sanitizeSectionItems(
          splitBullets(requirementChunks.join("\n"), 8),
          320,
        );

  const benefits =
    existingBenefits.length > 0
      ? existingBenefits
      : deriveBenefitItemsFromText(benefitChunks.join("\n"));

  return {
    about,
    responsibilities,
    requirements,
    benefits,
    extra: splitSentences(extraChunks.join(" "), 4),
  };
}

export function similarSummary(job: Job) {
  if (job.enrichment?.summary) return job.enrichment.summary;

  const text = compactText(job.description);

  if (text.length <= 110) return text;

  return `${text.slice(0, 110).trim()}...`;
}

export function getDisplayTitle(job: Job) {
  return job.enrichment?.display_title ?? job.title;
}

export function getDisplayLocation(job: Job) {
  return job.enrichment?.display_location ?? listingLocation(job.location);
}

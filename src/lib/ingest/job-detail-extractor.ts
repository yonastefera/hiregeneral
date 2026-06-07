import {
  htmlToText,
  normalizeEmploymentType,
  safeDescription,
  type ImportedJob,
} from "./normalize";
import { sanitizeJobPostingHtml } from "@/lib/text/html";

type JobPostingSchema = {
  "@type"?: string | string[];
  title?: string;
  description?: string;
  datePosted?: string;
  employmentType?: string | string[];
  baseSalary?: unknown;
  jobBenefits?: string | string[];
  benefits?: string | string[];
  qualifications?: string | string[];
  responsibilities?: string | string[];
  skills?: string | string[];
};

type EnhanceImportedJobInput = {
  job: ImportedJob;
  detailUrl?: string | null;
  signal?: AbortSignal;
};

type DerivedDetailSections = {
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  skills: string[];
};

type SalaryRange = {
  salaryMin: number | null;
  salaryMax: number | null;
};

export type ExtractedJobDetailContent = {
  description: string;
  descriptionHtml: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  skills: string[];
  employmentType: string | null;
  postedAt: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
};

const MIN_USEFUL_DESCRIPTION_LENGTH = 300;

function decodeHtml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(parseInt(code, 10)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanInlineText(value: string | null | undefined) {
  return htmlToText(value ?? "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function compactText(value: string | null | undefined) {
  return cleanInlineText(value).replace(/\s+/g, " ").trim();
}

function normalizeItem(value: string) {
  return compactText(value)
    .replace(/^[•·\-\u2013\u2014\s]+/, "")
    .replace(/^[:;,.\s]+/, "")
    .trim();
}

function uniqueItems(items: string[], maxItems: number) {
  const seen = new Set<string>();

  return items
    .map(normalizeItem)
    .filter((item) => item.length >= 8)
    .filter((item) => {
      const key = item.toLowerCase();

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    })
    .slice(0, maxItems);
}

function toStringArray(value: unknown, maxItems: number) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return uniqueItems(
      value.map((item) => compactText(String(item ?? ""))),
      maxItems,
    );
  }

  if (typeof value === "string") {
    return uniqueItems(
      value
        .replace(/•/g, "\n• ")
        .replace(/\s*;\s*/g, "\n")
        .split(/\n|•| - | – /)
        .map(compactText),
      maxItems,
    );
  }

  return [];
}

function stripNoise(text: string) {
  return text
    .replace(/\bApply Now\b/gi, " ")
    .replace(/\bSave Job\b/gi, " ")
    .replace(/\bShare Job\b/gi, " ")
    .replace(/\bBack to Search Results\b/gi, " ")
    .replace(/\bSimilar Jobs\b/gi, " ")
    .replace(/\bJob Alerts\b/gi, " ")
    .replace(/\bSign up for job alerts\b/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractJsonObjectsFromScriptContent(raw: string) {
  const text = decodeHtml(raw).trim();

  try {
    const parsed = JSON.parse(text) as unknown;
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function extractJsonLdBlocks(html: string) {
  return [
    ...html.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ].flatMap((match) => extractJsonObjectsFromScriptContent(match[1]));
}

function isJobPostingSchema(value: unknown): value is JobPostingSchema {
  if (!value || typeof value !== "object") return false;

  const type = (value as Record<string, unknown>)["@type"];

  if (typeof type === "string") {
    return type.toLowerCase() === "jobposting";
  }

  if (Array.isArray(type)) {
    return type.some(
      (item) => typeof item === "string" && item.toLowerCase() === "jobposting",
    );
  }

  return false;
}

function findJobPostingSchema(value: unknown): JobPostingSchema | null {
  if (isJobPostingSchema(value)) return value;

  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const graph = record["@graph"];

  if (Array.isArray(graph)) {
    for (const item of graph) {
      const match = findJobPostingSchema(item);

      if (match) return match;
    }
  }

  const itemList = record.itemListElement;

  if (Array.isArray(itemList)) {
    for (const item of itemList) {
      const match = findJobPostingSchema(item);

      if (match) return match;
    }
  }

  return null;
}

function extractJobPostingSchema(html: string) {
  for (const block of extractJsonLdBlocks(html)) {
    const schema = findJobPostingSchema(block);

    if (schema) return schema;
  }

  return null;
}

function extractMainHtml(html: string) {
  const candidates = [
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<section\b[^>]*(?:class|id)=["'][^"']*(?:job|posting|description|content|details)[^"']*["'][^>]*>([\s\S]*?)<\/section>/i,
    /<div\b[^>]*(?:class|id)=["'][^"']*(?:job|posting|description|content|details)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<body\b[^>]*>([\s\S]*?)<\/body>/i,
  ];

  for (const pattern of candidates) {
    const match = html.match(pattern);

    if (!match?.[1]) continue;

    const text = stripNoise(cleanInlineText(match[1]));

    if (text.length >= MIN_USEFUL_DESCRIPTION_LENGTH) {
      return match[1];
    }
  }

  return html;
}

function extractVisibleDetailText(html: string) {
  const mainHtml = extractMainHtml(html);

  return stripNoise(cleanInlineText(mainHtml));
}

function chooseBestDescription(params: {
  schemaDescription: string;
  visibleText: string;
  fallbackDescription: string;
}) {
  const schemaText = compactText(params.schemaDescription);
  const visibleText = compactText(params.visibleText);
  const fallbackText = compactText(params.fallbackDescription);

  const candidates = [visibleText, schemaText, fallbackText]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  return candidates[0] ?? fallbackText;
}

function chooseBestDescriptionHtml(params: {
  mainHtml: string;
  schemaDescription: string;
  fallbackDescription: string;
}) {
  const candidates = [
    sanitizeJobPostingHtml(params.mainHtml),
    sanitizeJobPostingHtml(params.schemaDescription),
    sanitizeJobPostingHtml(params.fallbackDescription),
  ]
    .filter(Boolean)
    .sort((a, b) => htmlToText(b).length - htmlToText(a).length);

  return candidates[0] ?? "";
}

function sectionBetween(text: string, start: RegExp, end: RegExp) {
  const startMatch = text.match(start);

  if (!startMatch || startMatch.index === undefined) return "";

  const startIndex = startMatch.index + startMatch[0].length;
  const rest = text.slice(startIndex);
  const endMatch = rest.match(end);

  return endMatch && endMatch.index !== undefined
    ? rest.slice(0, endMatch.index)
    : rest;
}

function splitSectionItems(value: string, maxItems: number) {
  const normalized = cleanInlineText(value)
    .replace(/([a-z])([A-Z][a-z])/g, "$1\n$2")
    .replace(/•/g, "\n• ")
    .replace(/\s*;\s*/g, "\n")
    .replace(/\n{2,}/g, "\n");

  const bulletItems = normalized
    .split(/\n|•| - | – /)
    .map(normalizeItem)
    .filter((item) => item.length >= 12 && item.length <= 420);

  if (bulletItems.length > 1) {
    return uniqueItems(bulletItems, maxItems);
  }

  const sentenceItems = compactText(normalized)
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map(normalizeItem)
    .filter((item) => item.length >= 30 && item.length <= 420);

  return uniqueItems(sentenceItems, maxItems);
}

function deriveSectionsFromDetailText(text: string): DerivedDetailSections {
  const responsibilitiesText = sectionBetween(
    text,
    /(key accountabilities|key responsibilities|responsibilities|what you(?:'|’)ll do|what you'll do|in this role, you will):?\s*/i,
    /(what we(?:'|’)re looking for|what we're looking for|required qualifications|preferred qualifications|qualifications|requirements|technical expertise|leadership competencies|example projects|benefits|pay range|pay range details|we(?:'|’)ve got you covered|we've got you covered):?\s*/i,
  );

  const requirementsText = sectionBetween(
    text,
    /(what we(?:'|’)re looking for|what we're looking for|required qualifications|qualifications|requirements):?\s*/i,
    /(nice to have|preferred qualifications|technical expertise|leadership competencies|benefits|pay range|pay range details|we(?:'|’)ve got you covered|we've got you covered|about the company|equal opportunity):?\s*/i,
  );

  const preferredText = sectionBetween(
    text,
    /(preferred qualifications):?\s*/i,
    /(technical expertise|leadership competencies|benefits|pay range|pay range details|we(?:'|’)ve got you covered|we've got you covered|about the company|equal opportunity):?\s*/i,
  );

  const technicalText = sectionBetween(
    text,
    /(technical expertise|platforms & tools|languages & automation|strategic technologies):?\s*/i,
    /(leadership competencies|benefits|pay range|required qualifications|preferred qualifications):?\s*/i,
  );

  const benefitsText = sectionBetween(
    text,
    /(benefits|we(?:'|’)ve got you covered|we've got you covered):?\s*/i,
    /(learn more|equal opportunity|posting|application deadline|pay range details|pay offers are dependent):?\s*/i,
  );

  return {
    responsibilities: splitSectionItems(responsibilitiesText, 12),
    requirements: uniqueItems(
      [
        ...splitSectionItems(requirementsText, 10),
        ...splitSectionItems(preferredText, 6),
        ...splitSectionItems(technicalText, 8),
      ],
      14,
    ),
    benefits: splitSectionItems(benefitsText, 10),
    skills: splitSectionItems(technicalText, 14),
  };
}

function salaryFromSchema(value: unknown): SalaryRange {
  if (!value || typeof value !== "object") {
    return {
      salaryMin: null,
      salaryMax: null,
    };
  }

  const record = value as Record<string, unknown>;
  const nestedValue =
    record.value && typeof record.value === "object"
      ? (record.value as Record<string, unknown>)
      : record;

  const minValue =
    typeof nestedValue.minValue === "number"
      ? nestedValue.minValue
      : typeof nestedValue.minValue === "string"
        ? Number(nestedValue.minValue.replace(/,/g, ""))
        : null;

  const maxValue =
    typeof nestedValue.maxValue === "number"
      ? nestedValue.maxValue
      : typeof nestedValue.maxValue === "string"
        ? Number(nestedValue.maxValue.replace(/,/g, ""))
        : null;

  return {
    salaryMin: Number.isFinite(minValue) ? minValue : null,
    salaryMax: Number.isFinite(maxValue) ? maxValue : null,
  };
}

function salaryFromText(value: string): SalaryRange {
  const amounts = [...value.matchAll(/\$?\s*([\d,]+)(?:\.\d{2})?/g)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter(
      (amount) =>
        Number.isFinite(amount) && amount >= 20_000 && amount <= 1_000_000,
    );

  if (amounts.length === 0) {
    return {
      salaryMin: null,
      salaryMax: null,
    };
  }

  const salaryMin = Math.min(...amounts);
  const salaryMax = Math.max(...amounts);

  return {
    salaryMin,
    salaryMax: salaryMax === salaryMin ? null : salaryMax,
  };
}

function validIsoDate(value: string | null | undefined) {
  if (!value) return null;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function fetchDetailHtml(detailUrl: string, signal?: AbortSignal) {
  const response = await fetch(detailUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/json",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "HireGeneralJobBoard/1.0",
    },
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    return null;
  }

  const text = await response.text();

  try {
    const redirect = JSON.parse(text) as {
      url?: unknown;
      externalSpa?: unknown;
      widget?: unknown;
    };

    if (
      redirect.widget === "redirect" &&
      typeof redirect.url === "string" &&
      redirect.externalSpa === true
    ) {
      const redirectUrl = new URL(redirect.url, detailUrl).toString();
      const redirectResponse = await fetch(redirectUrl, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent": "HireGeneralJobBoard/1.0",
        },
        cache: "no-store",
        signal,
      });

      return redirectResponse.ok ? redirectResponse.text() : null;
    }
  } catch {
    // Non-JSON detail pages are the common case.
  }

  return text;
}

export async function extractJobDetailContentFromUrl({
  detailUrl,
  fallbackDescription,
  signal,
}: {
  detailUrl: string;
  fallbackDescription?: string;
  signal?: AbortSignal;
}): Promise<ExtractedJobDetailContent | null> {
  const html = await fetchDetailHtml(detailUrl, signal);

  if (!html) return null;

  const schema = extractJobPostingSchema(html);
  const schemaDescription =
    typeof schema?.description === "string" ? schema.description : "";
  const mainHtml = extractMainHtml(html);
  const visibleText = extractVisibleDetailText(html);
  const fullDescription = chooseBestDescription({
    schemaDescription,
    visibleText,
    fallbackDescription: fallbackDescription ?? "",
  });

  if (fullDescription.length < MIN_USEFUL_DESCRIPTION_LENGTH) {
    return null;
  }

  const sectionSource =
    visibleText.length >= MIN_USEFUL_DESCRIPTION_LENGTH
      ? visibleText
      : fullDescription;
  const derivedSections = deriveSectionsFromDetailText(sectionSource);
  const schemaResponsibilities = toStringArray(schema?.responsibilities, 12);
  const schemaRequirements = [
    ...toStringArray(schema?.qualifications, 14),
    ...toStringArray(schema?.skills, 14),
  ];
  const schemaBenefits = [
    ...toStringArray(schema?.jobBenefits, 10),
    ...toStringArray(schema?.benefits, 10),
  ];
  const schemaSalary = salaryFromSchema(schema?.baseSalary);
  const textSalary = salaryFromText(visibleText);
  const employmentType =
    typeof schema?.employmentType === "string"
      ? normalizeEmploymentType(schema.employmentType)
      : Array.isArray(schema?.employmentType)
        ? normalizeEmploymentType(schema.employmentType.join(" "))
        : null;

  return {
    description: fullDescription,
    descriptionHtml: chooseBestDescriptionHtml({
      mainHtml,
      schemaDescription,
      fallbackDescription: fallbackDescription ?? "",
    }),
    responsibilities:
      schemaResponsibilities.length > 0
        ? schemaResponsibilities
        : derivedSections.responsibilities,
    requirements:
      schemaRequirements.length > 0
        ? uniqueItems(schemaRequirements, 14)
        : derivedSections.requirements,
    benefits:
      schemaBenefits.length > 0
        ? uniqueItems(schemaBenefits, 10)
        : derivedSections.benefits,
    skills: uniqueItems(derivedSections.skills, 14),
    employmentType,
    postedAt: validIsoDate(schema?.datePosted),
    salaryMin: schemaSalary.salaryMin ?? textSalary.salaryMin,
    salaryMax: schemaSalary.salaryMax ?? textSalary.salaryMax,
  };
}

export async function enhanceImportedJobFromDetailPage({
  job,
  detailUrl,
  signal,
}: EnhanceImportedJobInput): Promise<ImportedJob> {
  if (!detailUrl) return job;

  try {
    const detail = await extractJobDetailContentFromUrl({
      detailUrl,
      fallbackDescription: job.description,
      signal,
    });

    if (!detail) return job;

    return {
      ...job,
      description:
        detail.descriptionHtml ||
        safeDescription({
          description: detail.description,
          title: job.title,
          companyName: job.companyName,
        }),
      employmentType:
        job.employmentType || detail.employmentType || "Full-time",
      salaryMin: job.salaryMin ?? detail.salaryMin,
      salaryMax: job.salaryMax ?? detail.salaryMax,
      responsibilities:
        job.responsibilities.length > 0
          ? job.responsibilities
          : detail.responsibilities,
      requirements:
        job.requirements.length > 0 ? job.requirements : detail.requirements,
      benefits: job.benefits.length > 0 ? job.benefits : detail.benefits,
      skills: job.skills.length > 0 ? job.skills : detail.skills,
      postedAt: job.postedAt || detail.postedAt || new Date().toISOString(),
    };
  } catch {
    return job;
  }
}

import {
  defaultExpiryDate,
  detectWorkMode,
  htmlToText,
  normalizeEmploymentType,
  safeDescription,
  type ImportedJob,
} from "./normalize";
import {
  isEngineeringText,
  isInternshipText,
  isUsText,
  normalizedJobTitleKey,
} from "./filters";
import type { JobSource } from "./job-sources";
import type { JobSourceAdapter } from "./source";

type SuccessFactorsConfig = {
  locale: string;
  publicBase: string;
  rssUrls: string[];
  searchTexts: string[];
};

type RssItem = {
  title: string;
  description: string;
  pubDate: string | null;
  link: string;
  guid: string;
};

function metadataString(source: JobSource, key: string) {
  const value = source.metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function metadataStringArray(source: JobSource, key: string) {
  const value = source.metadata[key];

  if (!Array.isArray(value)) return null;

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function stripCdata(value: string) {
  return value
    .trim()
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .trim();
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    );
}

function itemField(itemXml: string, field: string) {
  const match = itemXml.match(
    new RegExp(`<${field}>([\\s\\S]*?)<\\/${field}>`, "i"),
  );

  return match ? decodeXml(stripCdata(match[1])) : "";
}

function parseRssItems(xml: string) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .map((match): RssItem => {
      const itemXml = match[1];

      return {
        title: itemField(itemXml, "title"),
        description: itemField(itemXml, "description"),
        pubDate: itemField(itemXml, "pubDate") || null,
        link: itemField(itemXml, "link"),
        guid: itemField(itemXml, "guid"),
      };
    })
    .filter((item) => item.title && (item.link || item.guid));
}

function successFactorsConfig(source: JobSource): SuccessFactorsConfig {
  const sourceUrl = source.sourceUrl ? new URL(source.sourceUrl) : null;
  const locale = metadataString(source, "locale") ?? "en_US";
  const searchTexts = metadataStringArray(source, "searchTexts") ?? [
    metadataString(source, "searchText") ?? "technology",
  ];
  const publicBase =
    metadataString(source, "publicBase") ??
    source.sourceUrl?.replace(/\/$/, "") ??
    null;
  const explicitRssUrl = metadataString(source, "rssUrl");

  if (!sourceUrl || !publicBase) {
    throw new Error(
      `SuccessFactors source ${source.companyName} is missing sourceUrl metadata`,
    );
  }

  const rssUrls = explicitRssUrl
    ? [explicitRssUrl]
    : searchTexts.map((searchText) => {
        const url = new URL("/services/rss/job/", sourceUrl.origin);
        const locationSearch = metadataString(source, "locationSearch");
        const keywords = locationSearch
          ? `(${searchText}) AND locationSearch:(${locationSearch})`
          : `(${searchText})`;

        url.searchParams.set("locale", locale);
        url.searchParams.set("keywords", keywords);

        return url.toString();
      });

  return {
    locale,
    publicBase,
    rssUrls,
    searchTexts,
  };
}

function sourceId(sourceSlug: string, item: RssItem) {
  const sourceValue = item.guid || item.link || item.title;
  const idFromLink = sourceValue.match(/\/job\/[^/]+\/([0-9]+)/)?.[1];

  if (idFromLink) return `${sourceSlug}:${idFromLink}`;

  return `${sourceSlug}:${sourceValue
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

function parseTitleAndLocation(value: string) {
  const match = value.match(/^(.*?)\s*\(([^()]*)\)\s*$/);

  if (!match) {
    return {
      title: value.trim(),
      location: "United States",
    };
  }

  return {
    title: match[1].trim(),
    location: match[2].trim(),
  };
}

function postedAt(value: string | null) {
  if (!value) return new Date().toISOString();

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function uniqueItems(items: string[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.toLowerCase();

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function normalizeLine(value: string) {
  return value
    .replace(/^[•·\-\u2013\u2014\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitListItems(value: string, maxItems: number) {
  return uniqueItems(
    value
      .split(/\n+/)
      .map(normalizeLine)
      .filter((line) => line.length >= 12),
  ).slice(0, maxItems);
}

function parsedSections(descriptionHtml: string) {
  const text = htmlToText(descriptionHtml)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const markerPattern =
    /^(Intro|Why you(?:'|’)ll love this job|What you(?:'|’)ll do|All you(?:'|’)ll need for success|Minimum Qualifications.*|Preferred Qualifications.*|Skills, Licenses.*|What you(?:'|’)ll get|Benefits|Feel free to be yourself.*):?$/gim;

  const markers = [...text.matchAll(markerPattern)].map((match) => ({
    label: match[1].toLowerCase(),
    index: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }));

  const section = (labels: string[]) => {
    const chunks: string[] = [];

    markers.forEach((marker, index) => {
      if (!labels.some((label) => marker.label.includes(label))) return;

      const next = markers[index + 1];
      chunks.push(text.slice(marker.end, next?.index ?? text.length).trim());
    });

    return chunks.join("\n");
  };

  return {
    plainText: text,
    about:
      section(["intro", "why you'll love", "why you’ll love"]) ||
      text.split(/\n\n+/)[0] ||
      text,
    responsibilities: splitListItems(
      section(["what you'll do", "what you’ll do"]),
      10,
    ),
    requirements: splitListItems(
      section([
        "all you'll need",
        "all you’ll need",
        "minimum qualifications",
        "preferred qualifications",
        "skills, licenses",
      ]),
      14,
    ),
    benefits: splitListItems(
      section(["what you'll get", "what you’ll get", "benefits"]),
      10,
    ),
  };
}

function duplicateRoleKey(sourceSlug: string, item: RssItem) {
  const { title } = parseTitleAndLocation(item.title);
  const normalizedTitle = normalizedJobTitleKey(title);

  return normalizedTitle
    ? `${sourceSlug}:${normalizedTitle}`
    : sourceId(sourceSlug, item);
}

function mergeDuplicateRoles(sourceSlug: string, items: RssItem[]) {
  const grouped = new Map<
    string,
    {
      item: RssItem;
      locations: string[];
    }
  >();

  for (const item of items) {
    const key = duplicateRoleKey(sourceSlug, item);
    const { location } = parseTitleAndLocation(item.title);
    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, {
        item,
        locations: location ? [location] : ["United States"],
      });
      continue;
    }

    current.locations = uniqueItems([
      ...current.locations,
      ...(location ? [location] : ["United States"]),
    ]);
  }

  return [...grouped.values()].map((job) => ({
    ...job,
    location: job.locations.join(", "),
  }));
}

export async function fetchSuccessFactorsJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const config = successFactorsConfig(source);
  const rssItemsById = new Map<string, RssItem>();

  for (const rssUrl of config.rssUrls) {
    const response = await fetch(rssUrl, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml",
        "User-Agent": "HireGeneralJobBoard/1.0",
      },
      cache: "no-store",
      signal: context?.signal,
    });

    if (!response.ok) {
      throw new Error(
        `SuccessFactors fetch failed for ${source.companyName}: ${response.status}`,
      );
    }

    for (const item of parseRssItems(await response.text())) {
      rssItemsById.set(sourceId(source.sourceSlug, item), item);
    }
  }

  const rssItems = [...rssItemsById.values()].filter((item) => {
    const { title, location } = parseTitleAndLocation(item.title);
    const text = `${title} ${location} ${htmlToText(item.description)}`;

    return (
      isUsText(location) && isEngineeringText(text) && !isInternshipText(text)
    );
  });

  const dedupedItems = mergeDuplicateRoles(source.sourceSlug, rssItems);

  return dedupedItems.map(({ item, location }) => {
    const { title } = parseTitleAndLocation(item.title);
    const parsed = parsedSections(item.description);
    const applyUrl = item.link || item.guid || config.publicBase;

    return {
      recruiterId,

      companyId: null,
      companyName: source.companyName,
      companyLogoUrl: source.companyLogoUrl ?? null,

      title,
      description: safeDescription({
        description: parsed.plainText || parsed.about,
        title,
        companyName: source.companyName,
      }),
      location,

      latitude: null,
      longitude: null,

      employmentType: normalizeEmploymentType(null),
      workMode: detectWorkMode(title, location),

      salaryMin: null,
      salaryMax: null,
      salaryCurrency: "USD",

      skills: [],
      responsibilities: parsed.responsibilities,
      requirements: parsed.requirements,
      benefits: parsed.benefits,

      status: "published",

      postedAt: postedAt(item.pubDate),
      expiresAt: defaultExpiryDate(30),

      sourceName: "successfactors",
      sourceId: sourceId(source.sourceSlug, item),
      applyUrl,

      experienceLevel: null,
      category: null,

      companyTagline: null,
      companySize: null,
      companyWebsite: source.companyDomain
        ? `https://${source.companyDomain}`
        : null,
    };
  });
}

export const successFactorsAdapter: JobSourceAdapter = {
  type: "successfactors",
  fetchJobs: fetchSuccessFactorsJobs,
};

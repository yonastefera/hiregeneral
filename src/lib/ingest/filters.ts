const US_LOCATION_TERMS = [
  "united states",
  "usa",
  "u.s.",
  "u.s.a.",
  "remote - us",
  "remote us",
  "remote, us",
  "remote, united states",
  "alabama",
  "alaska",
  "arizona",
  "arkansas",
  "california",
  "colorado",
  "connecticut",
  "delaware",
  "florida",
  "georgia",
  "hawaii",
  "idaho",
  "illinois",
  "indiana",
  "iowa",
  "kansas",
  "kentucky",
  "louisiana",
  "maine",
  "maryland",
  "massachusetts",
  "michigan",
  "minnesota",
  "mississippi",
  "missouri",
  "montana",
  "nebraska",
  "nevada",
  "new hampshire",
  "new jersey",
  "new mexico",
  "new york",
  "north carolina",
  "north dakota",
  "ohio",
  "oklahoma",
  "oregon",
  "pennsylvania",
  "rhode island",
  "south carolina",
  "south dakota",
  "tennessee",
  "texas",
  "utah",
  "vermont",
  "virginia",
  "washington",
  "wisconsin",
  "wyoming",
  "atlanta",
  "austin",
  "boston",
  "chicago",
  "denver",
  "los angeles",
  "miami",
  "new york",
  "san francisco",
  "seattle",
];

const US_STATE_ABBREVIATION_PATTERN =
  /(?:^|[\s,/-])(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)(?:$|[\s,/-])/;

const ENGINEERING_TERMS = [
  "engineer",
  "engineering",
  "developer",
  "software",
  "backend",
  "frontend",
  "front-end",
  "full stack",
  "full-stack",
  "infrastructure",
  "platform",
  "security",
  "cybersecurity",
  "information security",
  "sre",
  "site reliability",
  "devops",
  "machine learning",
  "artificial intelligence",
  "ai ",
  "data science",
  "data engineer",
  "data analyst",
  "analytics",
  "technology",
  "information technology",
  "systems",
  "cloud",
  "digital",
  "api",
  "database",
  "network",
  "technical lead",
  "architect",
];

export function isUsText(value: string) {
  const lower = value.toLowerCase();

  return (
    US_STATE_ABBREVIATION_PATTERN.test(value) ||
    US_LOCATION_TERMS.some((term) => lower.includes(term))
  );
}

export function isEngineeringText(value: string) {
  const lower = value.toLowerCase();
  return ENGINEERING_TERMS.some((term) => lower.includes(term));
}

export function isInternshipText(value: string) {
  return /\b(intern|internship|co-op|coop|university|new grad|graduate program)\b/i.test(
    value,
  );
}

export function dedupeBySourceKey<T>(jobs: T[], getKey: (job: T) => string) {
  const seen = new Set<string>();

  return jobs.filter((job) => {
    const key = getKey(job).trim();

    if (!key) return false;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

export function normalizedJobTitleKey(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

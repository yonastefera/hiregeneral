import { citySuggestions, featuredJobs } from "@/data/jobPlatform";

const uniq = (arr: string[]) =>
  Array.from(new Set(arr.filter(Boolean))).sort((a, b) => a.localeCompare(b));

export const titleSuggestions = uniq(featuredJobs.map((j) => j.title));
export const companySuggestions = uniq(featuredJobs.map((j) => j.company));
export const skillSuggestions = uniq(featuredJobs.flatMap((j) => j.skills));
export const categorySuggestions = uniq(featuredJobs.map((j) => j.category));

// Combined keyword list for the main "Title, company, skill" field
export const keywordSuggestions = uniq([
  ...titleSuggestions,
  ...companySuggestions,
  ...skillSuggestions,
  ...categorySuggestions,
]);

export const locationSuggestions = uniq([
  ...citySuggestions,
  ...featuredJobs.map((j) => j.location),
]);

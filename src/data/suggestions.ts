const uniq = (arr: string[]) =>
  Array.from(new Set(arr.filter(Boolean))).sort((a, b) => a.localeCompare(b));

export const titleSuggestions = [
  "Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Data Engineer",
  "Platform Engineer",
  "Cloud Engineer",
  "Security Engineer",
  "DevOps Engineer",
  "Product Manager",
  "Product Designer",
];

export const companySuggestions = [
  "Bank of America",
  "Capital One",
  "PNC Bank",
  "Stripe",
  "Wells Fargo",
];

export const skillSuggestions = [
  "API",
  "AWS",
  "Cloud",
  "Cybersecurity",
  "Data Science",
  "Java",
  "Kubernetes",
  "Next.js",
  "Python",
  "React",
  "SQL",
  "TypeScript",
];

export const categorySuggestions = [
  "Analytics",
  "Cloud",
  "Cybersecurity",
  "Data",
  "Design",
  "Engineering",
  "Infrastructure",
  "Product",
  "Technology",
];

export const keywordSuggestions = uniq([
  ...titleSuggestions,
  ...companySuggestions,
  ...skillSuggestions,
  ...categorySuggestions,
]);

export const locationSuggestions = uniq([
  "Atlanta, GA",
  "Austin, TX",
  "Boston, MA",
  "Charlotte, NC",
  "Chicago, IL",
  "Columbus, OH",
  "Dallas, TX",
  "Denver, CO",
  "McLean, VA",
  "New York, NY",
  "Phoenix, AZ",
  "Remote - United States",
  "San Francisco, CA",
  "Seattle, WA",
]);

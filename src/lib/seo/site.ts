const DEFAULT_SITE_URL = "https://www.hiregeneral.com";

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;

  if (!configuredUrl) return DEFAULT_SITE_URL;

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function getCanonicalJobPath(job: { id: string; slug?: string | null }) {
  return `/jobs/${job.slug || job.id}`;
}

export function getCanonicalJobUrl(job: { id: string; slug?: string | null }) {
  return new URL(getCanonicalJobPath(job), getSiteUrl()).toString();
}

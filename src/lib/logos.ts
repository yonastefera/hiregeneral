export function companyInitials(name: string | null | undefined) {
  const value = (name ?? "").trim();

  if (!value) return "HG";

  const words = value
    .replace(/&/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return value.slice(0, 2).toUpperCase();
}

export function normalizeLogoDomain(value: string | null | undefined) {
  if (!value) return null;

  const cleaned = value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();

  if (!cleaned) return null;

  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(cleaned)) {
    return null;
  }

  return cleaned;
}

export function logoProxyUrl(
  domain: string | null | undefined,
  size: 32 | 40 | 48 | 64 | 96 | 128 | 256 = 128,
) {
  const normalizedDomain = normalizeLogoDomain(domain);

  if (!normalizedDomain) return null;

  const params = new URLSearchParams({
    domain: normalizedDomain,
    size: String(size),
  });

  return `/api/logos?${params.toString()}`;
}

/**
 * Backward-compatible helper used by ingestion/source mapping.
 * Old behavior produced direct img.logo.dev URLs.
 * New behavior returns the internal logo proxy so the Logo.dev token stays server-side.
 */
export function logoDevUrl(
  domain: string | null | undefined,
  size: 32 | 40 | 48 | 64 | 96 | 128 | 256 = 128,
) {
  return logoProxyUrl(domain, size);
}

export function logoDomainFromUrl(value: string | null | undefined) {
  if (!value) return null;

  if (value.startsWith("/api/logos")) {
    try {
      const url = new URL(value, "https://hiregeneral.local");
      return normalizeLogoDomain(url.searchParams.get("domain"));
    } catch {
      return null;
    }
  }

  try {
    const url = new URL(value);

    if (url.hostname === "img.logo.dev") {
      const domain = url.pathname.replace(/^\//, "");
      return normalizeLogoDomain(domain);
    }

    if (url.hostname === "logo.clearbit.com") {
      const domain = url.pathname.replace(/^\//, "");
      return normalizeLogoDomain(domain);
    }

    return null;
  } catch {
    return normalizeLogoDomain(value);
  }
}

export function logoSrcFromUrl(
  value: string | null | undefined,
  size: 32 | 40 | 48 | 64 | 96 | 128 | 256 = 128,
) {
  if (!value) return null;

  if (value.startsWith("/api/logos")) {
    return value;
  }

  try {
    const url = new URL(value);

    if (url.hostname === "img.logo.dev") {
      return logoProxyUrl(logoDomainFromUrl(value), size);
    }

    if (url.hostname === "logo.clearbit.com") {
      return logoProxyUrl(logoDomainFromUrl(value), size);
    }

    return value;
  } catch {
    return logoProxyUrl(value, size);
  }
}

export function isSupportedLogoUrl(value: string | null | undefined) {
  if (!value) return false;

  if (value.startsWith("/api/logos")) return true;

  try {
    const url = new URL(value);

    return ["img.logo.dev", "logo.clearbit.com"].includes(url.hostname);
  } catch {
    return Boolean(normalizeLogoDomain(value));
  }
}

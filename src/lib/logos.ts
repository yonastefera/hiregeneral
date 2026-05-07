const LOGO_DEV_HOST = "img.logo.dev";

export function logoDevUrl(domain: string) {
  const params = new URLSearchParams({
    size: "128",
    format: "png",
  });

  if (process.env.LOGO_DEV_TOKEN) {
    params.set("token", process.env.LOGO_DEV_TOKEN);
  }

  return `https://${LOGO_DEV_HOST}/${domain}?${params.toString()}`;
}

export function isSupportedLogoUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === LOGO_DEV_HOST;
  } catch {
    return false;
  }
}

export function companyInitials(companyName: string) {
  return companyName.slice(0, 2).toUpperCase();
}

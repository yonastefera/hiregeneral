import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOGO_CACHE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function normalizeDomain(value: string | null) {
  if (!value) return null;

  const cleaned = value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();

  if (!cleaned) return null;

  // Prevent unsafe values. This route should only ever pass a domain
  // to img.logo.dev, never arbitrary URLs.
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(cleaned)) {
    return null;
  }

  return cleaned;
}

function imageResponse(body: BodyInit, contentType: string) {
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": `public, s-maxage=${LOGO_CACHE_SECONDS}, stale-while-revalidate=${LOGO_CACHE_SECONDS}`,
    },
  });
}

function placeholderResponse(domain: string) {
  const label = domain
    .split(".")[0]
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 2)
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="24" fill="#e2e8f0"/><text x="64" y="66" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="42" font-weight="700" fill="#334155">${label}</text></svg>`;

  return imageResponse(svg, "image/svg+xml; charset=utf-8");
}

export async function GET(request: NextRequest) {
  const token = process.env.LOGO_DEV_TOKEN;
  const domain = normalizeDomain(request.nextUrl.searchParams.get("domain"));
  const size = request.nextUrl.searchParams.get("size") ?? "128";

  if (!domain) {
    return NextResponse.json(
      { error: "Invalid logo domain." },
      { status: 400 },
    );
  }

  if (!token) {
    return placeholderResponse(domain);
  }

  const safeSize = ["32", "40", "48", "64", "96", "128", "256"].includes(size)
    ? size
    : "128";

  const logoUrl = new URL(`https://img.logo.dev/${domain}`);
  logoUrl.searchParams.set("size", safeSize);
  logoUrl.searchParams.set("format", "png");
  logoUrl.searchParams.set("token", token);

  try {
    const response = await fetch(logoUrl.toString(), {
      headers: {
        Accept: "image/png,image/*",
        "User-Agent": "HireGeneralJobBoard/1.0",
      },
      next: {
        revalidate: LOGO_CACHE_SECONDS,
      },
    });

    if (!response.ok) {
      return placeholderResponse(domain);
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.startsWith("image/")) {
      return placeholderResponse(domain);
    }

    const body = await response.arrayBuffer();

    return imageResponse(body, contentType);
  } catch {
    return placeholderResponse(domain);
  }
}

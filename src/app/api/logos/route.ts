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

function notFoundResponse() {
  return NextResponse.json(
    {
      error: "Logo not found.",
    },
    {
      status: 404,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}

export async function GET(request: NextRequest) {
  const token = process.env.LOGO_DEV_TOKEN;
  const domain = normalizeDomain(request.nextUrl.searchParams.get("domain"));
  const size = request.nextUrl.searchParams.get("size") ?? "128";

  if (!token || !domain) {
    return notFoundResponse();
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
      return notFoundResponse();
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.startsWith("image/")) {
      return notFoundResponse();
    }

    const body = await response.arrayBuffer();

    return imageResponse(body, contentType);
  } catch {
    return notFoundResponse();
  }
}

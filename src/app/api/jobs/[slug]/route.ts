import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { publicJobDetailRateLimit } from "@/lib/rate-limit";
import {
  enforceRateLimit,
  logServerError,
  requestIp,
  safeServerError,
} from "@/lib/http/api-security";
import { loadPublicJobDetail } from "@/lib/jobs/public-job-detail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jobSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(240)
  .regex(/^[a-zA-Z0-9_-]+$/);
function jsonResponse(
  payload: Awaited<ReturnType<typeof loadPublicJobDetail>>,
) {
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const parsedSlug = jobSlugSchema.safeParse(slug);
    if (!parsedSlug.success)
      return NextResponse.json({ error: "Invalid job slug." }, { status: 400 });
    const normalizedSlug = parsedSlug.data;

    const limited = await enforceRateLimit({
      limiter: publicJobDetailRateLimit,
      key: requestIp(req),
      context: "public_job_detail",
    });
    if (limited) return limited;

    const payload = await loadPublicJobDetail(normalizedSlug);
    if (!payload) {
      return NextResponse.json(
        { error: "Job not found" },
        {
          status: 404,
          headers: {
            // Briefly cache 404s to reduce repeated misses, but not too long.
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        },
      );
    }

    return jsonResponse(payload);
  } catch (error) {
    logServerError("job_detail_load_failed", error);
    return safeServerError("Could not load the job.");
  }
}

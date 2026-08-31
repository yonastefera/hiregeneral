import { NextResponse } from "next/server";

import { writeRedactedLog } from "@/lib/logging/redact";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();
  const startedAt = performance.now();
  let healthy = false;

  try {
    const supabase = createSupabasePublicClient();
    const { error } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .abortSignal(AbortSignal.timeout(2_500));
    healthy = !error;
  } catch {
    healthy = false;
  }

  const durationMs = Math.round(performance.now() - startedAt);

  writeRedactedLog(healthy ? "info" : "error", "health_check", {
    status: healthy ? "healthy" : "unavailable",
    durationMs,
  });

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "unavailable",
      checkedAt,
      release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local",
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

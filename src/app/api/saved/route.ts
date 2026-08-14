import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  boundedJsonBody,
  enforceRateLimit,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";
import { savedJobRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const savedJobSchema = z.object({ job_id: z.string().uuid() }).strict();

// GET — returns all saved job ids for the current user
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("saved_jobs")
    .select(
      `
      id, created_at,
      jobs (
        id, title, company_name, company_logo_url,
        location, employment_type, work_mode,
        salary_min, salary_max, salary_currency,
        skills, status, slug, apply_url, posted_at
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    logServerError("saved_jobs_load_failed", error);
    return safeServerError("Could not load saved jobs.");
  }

  return NextResponse.json({ data });
}

// POST — toggle save/unsave a job
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await enforceRateLimit({
    limiter: savedJobRateLimit,
    key: user.id,
    context: "saved_job_toggle",
  });
  if (limited) return limited;

  const body = await boundedJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = savedJobSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A valid job id is required." },
      { status: 400 },
    );
  }
  const { job_id } = parsed.data;

  // Check if already saved
  const { data: existing } = await supabase
    .from("saved_jobs")
    .select("id")
    .eq("user_id", user.id)
    .eq("job_id", job_id)
    .single();

  if (existing) {
    const { error: deleteError } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("user_id", user.id)
      .eq("job_id", job_id);

    if (deleteError) {
      logServerError("saved_job_delete_failed", deleteError);
      return safeServerError("Could not update saved jobs.");
    }

    return NextResponse.json({ saved: false });
  }

  const { error: insertError } = await supabase.from("saved_jobs").insert({
    user_id: user.id,
    job_id,
  });

  if (insertError) {
    logServerError("saved_job_insert_failed", insertError);
    return safeServerError("Could not update saved jobs.");
  }

  return NextResponse.json({ saved: true });
}

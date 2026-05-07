import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

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
    return NextResponse.json({ error: error.message }, { status: 500 });
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

  const { job_id } = await req.json();

  if (!job_id) {
    return NextResponse.json({ error: "job_id is required" }, { status: 400 });
  }

  // Check if already saved
  const { data: existing } = await supabase
    .from("saved_jobs")
    .select("id")
    .eq("user_id", user.id)
    .eq("job_id", job_id)
    .single();

  if (existing) {
    await supabase
      .from("saved_jobs")
      .delete()
      .eq("user_id", user.id)
      .eq("job_id", job_id);

    return NextResponse.json({ saved: false });
  }

  await supabase.from("saved_jobs").insert({
    user_id: user.id,
    job_id,
  });

  return NextResponse.json({ saved: true });
}

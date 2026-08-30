import { NextResponse } from "next/server";

import { logServerError } from "@/lib/http/api-security";
import { resumeParsingRateLimit } from "@/lib/rate-limit";
import {
  extractResumeText,
  parseResumeSuggestions,
} from "@/lib/resumes/parser";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limit = await resumeParsingRateLimit.limit(user.id);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many parsing attempts. Please try again later." },
        { status: 429 },
      );
    }
  } catch (error) {
    logServerError("resume_parsing_rate_limit_unavailable", error);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("resume_url, resume_file_name, resume_file_size")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile?.resume_url || !profile.resume_file_name) {
    return NextResponse.json(
      { error: "Upload a resume to your profile first." },
      { status: 404 },
    );
  }

  if (
    !profile.resume_url.startsWith(`${user.id}/`) ||
    (profile.resume_file_size ?? 0) > 5 * 1024 * 1024
  ) {
    return NextResponse.json(
      { error: "Resume cannot be parsed." },
      { status: 400 },
    );
  }

  const extension = profile.resume_file_name.split(".").pop()?.toLowerCase();
  if (extension !== "pdf" && extension !== "docx") {
    return NextResponse.json(
      { error: "Automatic parsing supports PDF and DOCX resumes." },
      { status: 415 },
    );
  }

  const { data: resume, error: downloadError } = await supabase.storage
    .from("resumes")
    .download(profile.resume_url);

  if (downloadError || !resume) {
    logServerError("resume_parsing_download_failed", downloadError);
    return NextResponse.json(
      { error: "Could not read your resume." },
      { status: 500 },
    );
  }

  try {
    const text = await extractResumeText(
      new Uint8Array(await resume.arrayBuffer()),
      profile.resume_file_name,
    );
    return NextResponse.json({ suggestions: parseResumeSuggestions(text) });
  } catch (error) {
    logServerError("resume_parsing_failed", error);
    return NextResponse.json(
      { error: "Could not extract details from this resume." },
      { status: 422 },
    );
  }
}

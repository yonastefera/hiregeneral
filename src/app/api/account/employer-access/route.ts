import { NextResponse } from "next/server";
import { z } from "zod";

import {
  boundedJsonBody,
  enforceRateLimit,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";
import { accountPrivacyRateLimit } from "@/lib/rate-limit";
import { recordPrivilegedAction } from "@/lib/security/audit";
import { createClient } from "@/lib/supabase/server";

const updateSchema = z.object({ enabled: z.boolean() }).strict();

async function authenticatedContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { supabase, user: error ? null : user };
}

export async function GET() {
  const { supabase, user } = await authenticatedContext();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("visibility, employer_access_consent_at, resume_url")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    logServerError("employer_access_load_failed", error);
    return safeServerError("Could not load employer-access settings.");
  }

  return NextResponse.json({
    enabled:
      data?.visibility === "public" && Boolean(data.employer_access_consent_at),
    consentedAt: data?.employer_access_consent_at ?? null,
    hasResume: Boolean(data?.resume_url),
  });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await authenticatedContext();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await enforceRateLimit({
    limiter: accountPrivacyRateLimit,
    key: user.id,
    context: "employer_access_update",
  });
  if (limited) return limited;

  const body = await boundedJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = updateSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the employer-access setting." },
      { status: 400 },
    );
  }

  const consentedAt = parsed.data.enabled ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from("profiles")
    .update({
      visibility: parsed.data.enabled ? "public" : "private",
      employer_access_consent_at: consentedAt,
    })
    .eq("user_id", user.id)
    .eq("user_type", "job_seeker")
    .is("deleted_at", null)
    .select("visibility, employer_access_consent_at")
    .maybeSingle();

  if (error) {
    logServerError("employer_access_update_failed", error);
    return safeServerError("Could not save employer-access settings.");
  }
  if (!data) {
    return NextResponse.json(
      { error: "Job-seeker profile was not found." },
      { status: 404 },
    );
  }

  await recordPrivilegedAction({
    action: parsed.data.enabled
      ? "profile.employer_access_granted"
      : "profile.employer_access_revoked",
    targetType: "profile",
    targetId: user.id,
    metadata: { source: "account_settings" },
  });

  return NextResponse.json({
    enabled: data.visibility === "public",
    consentedAt: data.employer_access_consent_at,
  });
}

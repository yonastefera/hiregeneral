import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  normalizePublicRole,
  retryAfterSeconds,
  trustedOrigin,
} from "@/lib/auth/security";
import { authRateLimitKeys } from "@/lib/auth/rate-limit-keys";
import { routeForRole } from "@/lib/auth/roles";
import { sendConfirmationEmail } from "@/lib/email/send";
import { signupRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const signupSchema = z.object({
  email: z.email(),
  fullName: z.string().trim().min(1).max(120).optional(),
  password: z.string().min(8).max(256),
  role: z
    .unknown()
    .transform(normalizePublicRole)
    .pipe(z.enum(["job_seeker", "recruiter"])),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check your signup details." },
      { status: 400 },
    );
  }

  const { email, fullName, password, role } = parsed.data;
  const keys = authRateLimitKeys(request, email);
  try {
    const limits = await Promise.all([
      signupRateLimit.limit(keys.ip),
      signupRateLimit.limit(keys.email),
    ]);
    const blocked = limits.find((result) => !result.success);
    if (blocked) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": retryAfterSeconds(blocked.reset) },
        },
      );
    }
  } catch (error) {
    console.error("[auth-signup-rate-limit]", error);
    return NextResponse.json(
      { error: "Could not create account." },
      { status: 503 },
    );
  }

  const origin = trustedOrigin(request.nextUrl.origin);
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(routeForRole(role))}`;
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: {
      data: {
        full_name: fullName ?? null,
        role,
      },
      redirectTo,
    },
  });

  if (error) {
    console.error("[auth-signup]", error.message);
    return NextResponse.json(
      { error: "Could not create account." },
      { status: 400 },
    );
  }

  const confirmUrl = data.properties?.action_link;

  if (!confirmUrl) {
    return NextResponse.json(
      { error: "Could not create confirmation link." },
      { status: 500 },
    );
  }

  try {
    await sendConfirmationEmail({ to: email, confirmUrl, fullName });
  } catch (error) {
    console.error("[auth-signup-email]", error);
    return NextResponse.json(
      { error: "Could not create account." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}

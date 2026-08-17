import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

import { authRateLimitKeys } from "@/lib/auth/rate-limit-keys";
import { logAuthEvent } from "@/lib/auth/log";
import { routeForRole, type AppRole } from "@/lib/auth/roles";
import { emailOtpVerifySchema } from "@/lib/auth/validation";
import { boundedJsonBody, enforceRateLimit } from "@/lib/http/api-security";
import { emailOtpVerifyRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function POST(request: NextRequest) {
  const body = await boundedJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = emailOtpVerifySchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter the six-digit code from your email." },
      { status: 400 },
    );
  }

  const keys = authRateLimitKeys(request, parsed.data.email);
  for (const key of [keys.ip, keys.email]) {
    const limited = await enforceRateLimit({
      limiter: emailOtpVerifyRateLimit,
      key,
      context: "email_otp_verify",
    });
    if (limited) return limited;
  }

  const pendingCookies: PendingCookie[] = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          pendingCookies.push(...cookies);
        },
      },
    },
  );

  const { data, error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "email",
  });

  if (error || !data.user) {
    logAuthEvent("info", "email_otp_verify_failed", {
      code: error?.code,
      status: error?.status,
    });
    return NextResponse.json(
      { error: "That code is invalid or expired. Request a new code." },
      { status: 401 },
    );
  }

  const { data: roles, error: rolesError } = await createSupabaseAdminClient()
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id);

  if (rolesError) {
    logAuthEvent("error", "email_otp_role_read_failed", {
      code: rolesError.code,
    });
    return NextResponse.json(
      { error: "Could not finish signing in. Please try again." },
      { status: 503 },
    );
  }

  const roleValues = (roles ?? []).map((row) => row.role as AppRole);
  const role = roleValues.includes("admin")
    ? "admin"
    : roleValues.includes("recruiter")
      ? "recruiter"
      : roleValues.includes("job_seeker")
        ? "job_seeker"
        : null;
  const redirectTo = role ? routeForRole(role) : "/auth/choose-role";
  const response = NextResponse.json({ ok: true, role, redirectTo });

  for (const cookie of pendingCookies) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  return response;
}

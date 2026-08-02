import { NextRequest, NextResponse } from "next/server";
import { retryAfterSeconds, trustedOrigin } from "@/lib/auth/security";
import { authRateLimitKeys } from "@/lib/auth/rate-limit-keys";
import { routeForRole } from "@/lib/auth/roles";
import { signupSchema } from "@/lib/auth/validation";
import { sendConfirmationEmail } from "@/lib/email/send";
import { readJsonBody } from "@/lib/http/json-body";
import { signupRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ELIGIBILITY_MESSAGE =
  "If the address is eligible, an email will arrive shortly.";

function eligibilityResponse() {
  return NextResponse.json({ ok: true, message: ELIGIBILITY_MESSAGE });
}

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
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
    return eligibilityResponse();
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
    return eligibilityResponse();
  }

  const confirmUrl = data.properties?.action_link;

  if (!confirmUrl) {
    console.error("[auth-signup] Supabase did not return a confirmation link.");
    return eligibilityResponse();
  }

  try {
    await sendConfirmationEmail({ to: email, confirmUrl, fullName });
  } catch (error) {
    console.error("[auth-signup-email]", error);
  }

  return eligibilityResponse();
}

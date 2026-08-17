import { NextRequest, NextResponse } from "next/server";

import { authRateLimitKeys } from "@/lib/auth/rate-limit-keys";
import { logAuthEvent } from "@/lib/auth/log";
import { emailOtpRequestSchema } from "@/lib/auth/validation";
import { boundedJsonBody, enforceRateLimit } from "@/lib/http/api-security";
import { emailOtpRequestRateLimit } from "@/lib/rate-limit";
import { enforceDuplicateCooldown } from "@/lib/security/abuse";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { startOperation, withRequestId } from "@/lib/logging/observability";

const OTP_MESSAGE = "If the address is eligible, a code will arrive shortly.";

export async function POST(request: NextRequest) {
  const operation = startOperation(request, {
    route: "/api/auth/otp/request",
    operation: "request_email_otp",
    externalProvider: "supabase_auth",
  });
  const body = await boundedJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = emailOtpRequestSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const { email } = parsed.data;
  const keys = authRateLimitKeys(request, email);
  for (const key of [keys.ip, keys.email]) {
    const limited = await enforceRateLimit({
      limiter: emailOtpRequestRateLimit,
      key,
      context: "email_otp_request",
    });
    if (limited) return limited;
  }

  const duplicate = await enforceDuplicateCooldown({
    scope: "email_otp_request",
    actorKey: keys.ip,
    content: email,
    ttlSeconds: 60,
  });
  if (duplicate) return duplicate;

  const { error } = await createSupabasePublicClient().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    logAuthEvent("error", "email_otp_request_failed", {
      code: error.code,
      status: error.status,
    });
    operation.failure("external_provider", error);
    operation.metric("signup_confirmation_request_failed");
  } else {
    operation.success();
    operation.metric("signup_confirmation_requested");
  }

  return withRequestId(
    NextResponse.json({ ok: true, message: OTP_MESSAGE }),
    operation.context.requestId,
  );
}

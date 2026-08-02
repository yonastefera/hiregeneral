import { NextRequest, NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email/send";
import { retryAfterSeconds, trustedOrigin } from "@/lib/auth/security";
import { authRateLimitKeys } from "@/lib/auth/rate-limit-keys";
import { passwordResetSchema } from "@/lib/auth/validation";
import { logAuthEvent } from "@/lib/auth/log";
import { readJsonBody } from "@/lib/http/json-body";
import { passwordResetRateLimit } from "@/lib/rate-limit";
import { enforceDuplicateCooldown } from "@/lib/security/abuse";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const RESET_MESSAGE =
  "If the address is eligible, an email will arrive shortly.";

function resetResponse() {
  return NextResponse.json({ ok: true, message: RESET_MESSAGE });
}

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  const parsed = passwordResetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const { email } = parsed.data;
  const keys = authRateLimitKeys(request, email);
  try {
    const limits = await Promise.all([
      passwordResetRateLimit.limit(keys.ip),
      passwordResetRateLimit.limit(keys.email),
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
    logAuthEvent("error", "password_reset_rate_limit_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return resetResponse();
  }

  const duplicate = await enforceDuplicateCooldown({
    scope: "password_reset",
    actorKey: keys.ip,
    content: email,
    ttlSeconds: 60,
  });
  if (duplicate) return duplicate;

  const origin = trustedOrigin(request.nextUrl.origin);
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo,
    },
  });

  if (error) {
    logAuthEvent("error", "password_reset_link_generation_failed", {
      error: error.message,
    });
    return resetResponse();
  }

  const resetUrl = data.properties?.action_link;

  if (resetUrl) {
    try {
      await sendPasswordResetEmail({
        to: email,
        resetUrl,
        fullName:
          typeof data.user?.user_metadata?.full_name === "string"
            ? data.user.user_metadata.full_name
            : undefined,
      });
    } catch (error) {
      logAuthEvent("error", "password_reset_email_delivery_failed", {
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  return resetResponse();
}

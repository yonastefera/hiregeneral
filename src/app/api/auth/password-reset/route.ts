import { NextRequest, NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email/send";
import { retryAfterSeconds, trustedOrigin } from "@/lib/auth/security";
import { authRateLimitKeys } from "@/lib/auth/rate-limit-keys";
import { passwordResetSchema } from "@/lib/auth/validation";
import { readJsonBody } from "@/lib/http/json-body";
import { passwordResetRateLimit } from "@/lib/rate-limit";
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
    console.error("[password-reset-rate-limit]", error);
    return resetResponse();
  }

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
    console.error("[password-reset-email]", error.message);
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
      console.error("[password-reset-email]", error);
    }
  }

  return resetResponse();
}

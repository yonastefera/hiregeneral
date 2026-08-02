import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendPasswordResetEmail } from "@/lib/email/send";
import { retryAfterSeconds, trustedOrigin } from "@/lib/auth/security";
import { authRateLimitKeys } from "@/lib/auth/rate-limit-keys";
import { passwordResetRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const passwordResetSchema = z.object({
  email: z.email(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
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
    return NextResponse.json({ ok: true });
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
    return NextResponse.json({ ok: true });
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

  return NextResponse.json({ ok: true });
}

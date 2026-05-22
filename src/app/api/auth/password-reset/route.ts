import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendPasswordResetEmail } from "@/lib/email/send";
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
  const origin = request.nextUrl.origin;
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
    await sendPasswordResetEmail({
      to: email,
      resetUrl,
      fullName:
        typeof data.user?.user_metadata?.full_name === "string"
          ? data.user.user_metadata.full_name
          : undefined,
    });
  }

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isAppRole, routeForRole } from "@/lib/auth/roles";
import { sendConfirmationEmail } from "@/lib/email/send";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const signupSchema = z.object({
  email: z.email(),
  fullName: z.string().trim().min(1).max(120).optional(),
  password: z.string().min(6).max(256),
  role: z.string().refine(isAppRole, "Invalid role"),
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
  const origin = request.nextUrl.origin;
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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const confirmUrl = data.properties?.action_link;

  if (!confirmUrl) {
    return NextResponse.json(
      { error: "Could not create confirmation link." },
      { status: 500 },
    );
  }

  await sendConfirmationEmail({
    to: email,
    confirmUrl,
    fullName,
  });

  return NextResponse.json({ ok: true });
}

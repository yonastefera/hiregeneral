import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  RECOVERY_COOKIE,
  verifyRecoveryAuthorization,
} from "@/lib/auth/recovery-authorization";
import { passwordUpdateSchema } from "@/lib/auth/validation";
import { logAuthEvent } from "@/lib/auth/log";
import { readJsonBody } from "@/lib/http/json-body";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const INVALID_RECOVERY_MESSAGE =
  "This recovery link is invalid or expired. Request a new one.";

export async function POST(request: NextRequest) {
  const parsed = passwordUpdateSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check your new password." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cookieStore = await cookies();

  if (
    !user ||
    !verifyRecoveryAuthorization(
      cookieStore.get(RECOVERY_COOKIE)?.value,
      user.id,
    )
  ) {
    return NextResponse.json(
      { error: INVALID_RECOVERY_MESSAGE },
      { status: 401 },
    );
  }

  const { error } = await createSupabaseAdminClient().auth.admin.updateUserById(
    user.id,
    { password: parsed.data.password },
  );
  if (error) {
    logAuthEvent("error", "password_update_failed", { error: error.message });
    return NextResponse.json(
      { error: "Could not update password. Request a new link and try again." },
      { status: 503 },
    );
  }

  const { error: signOutError } = await supabase.auth.signOut({
    scope: "global",
  });
  if (signOutError)
    logAuthEvent("error", "password_update_session_revocation_failed", {
      error: signOutError.message,
    });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(RECOVERY_COOKIE, "", {
    maxAge: 0,
    path: "/api/auth/password-update",
  });
  return response;
}

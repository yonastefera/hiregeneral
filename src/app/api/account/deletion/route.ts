import { NextResponse } from "next/server";

import {
  enforceRateLimit,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";
import { accountDeletionRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await enforceRateLimit({
    limiter: accountDeletionRateLimit,
    key: user.id,
    context: "account_deletion_request",
  });
  if (limited) return limited;

  const { error } = await supabase
    .from("profiles")
    .update({ deletion_requested_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (error) {
    logServerError("account_deletion_request_failed", error);
    return safeServerError("Could not request account deletion.");
  }

  return NextResponse.json({ requested: true });
}

import { NextResponse } from "next/server";

import {
  enforceRateLimit,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";
import { accountDeletionRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const DELETION_GRACE_DAYS = 14;

function scheduledFor(requestedAt: string) {
  return new Date(
    new Date(requestedAt).getTime() + DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
}

async function authenticatedContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  return { supabase, user: authError ? null : user };
}

export async function GET() {
  const { supabase, user } = await authenticatedContext();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("deletion_requested_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    logServerError("account_deletion_status_failed", error);
    return safeServerError("Could not load account deletion status.");
  }

  const requestedAt = data?.deletion_requested_at ?? null;
  return NextResponse.json({
    requested: Boolean(requestedAt),
    requested_at: requestedAt,
    scheduled_for: requestedAt ? scheduledFor(requestedAt) : null,
    grace_days: DELETION_GRACE_DAYS,
  });
}

export async function POST() {
  const { supabase, user } = await authenticatedContext();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await enforceRateLimit({
    limiter: accountDeletionRateLimit,
    key: user.id,
    context: "account_deletion_request",
  });
  if (limited) return limited;

  const requestedAt = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({ deletion_requested_at: requestedAt })
    .eq("user_id", user.id);

  if (error) {
    logServerError("account_deletion_request_failed", error);
    return safeServerError("Could not request account deletion.");
  }

  return NextResponse.json({
    requested: true,
    requested_at: requestedAt,
    scheduled_for: scheduledFor(requestedAt),
    grace_days: DELETION_GRACE_DAYS,
  });
}

export async function DELETE() {
  const { supabase, user } = await authenticatedContext();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await enforceRateLimit({
    limiter: accountDeletionRateLimit,
    key: user.id,
    context: "account_deletion_cancellation",
  });
  if (limited) return limited;

  const { error } = await supabase
    .from("profiles")
    .update({ deletion_requested_at: null })
    .eq("user_id", user.id);

  if (error) {
    logServerError("account_deletion_cancellation_failed", error);
    return safeServerError("Could not cancel account deletion.");
  }

  return NextResponse.json({ requested: false, cancelled: true });
}

import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { logServerError } from "@/lib/http/api-security";
import {
  cancelStripeSubscription,
  isStripeNotFoundError,
} from "@/lib/stripe/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_SIZE = 10;
const STORAGE_BUCKETS = ["resumes", "avatars"] as const;

type EligibleProfile = {
  user_id: string;
  email: string | null;
};

type EmployerCompany = {
  id: string;
  stripe_subscription_id: string | null;
  subscription_status: string;
};

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || !authorization?.startsWith("Bearer ")) return false;

  const provided = Buffer.from(authorization.slice("Bearer ".length));
  const expected = Buffer.from(secret);

  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}

function deletionEnabled() {
  return process.env.ACCOUNT_DELETION_EXECUTION_ENABLED === "true";
}

function missingAuthUser(error: { message?: string; status?: number }) {
  return (
    error.status === 404 ||
    error.message?.toLowerCase().includes("user not found") === true
  );
}

async function removeUserStorage(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
) {
  for (const bucket of STORAGE_BUCKETS) {
    const storage = admin.storage.from(bucket);
    const { data, error } = await storage.list(userId, { limit: 1000 });

    if (error) throw error;

    const paths = (data ?? [])
      .filter((entry) => entry.id)
      .map((entry) => `${userId}/${entry.name}`);

    if (!paths.length) continue;

    const { error: removeError } = await storage.remove(paths);
    if (removeError) throw removeError;
  }
}

async function cancelEmployerSubscriptions(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
) {
  const { data, error } = await admin
    .from("companies")
    .select("id, stripe_subscription_id, subscription_status")
    .eq("owner_id", userId);

  if (error) throw error;

  for (const company of (data ?? []) as EmployerCompany[]) {
    const subscriptionId = company.stripe_subscription_id?.trim();
    const status = company.subscription_status.toLowerCase();

    if (!subscriptionId || ["canceled", "inactive"].includes(status)) continue;

    try {
      await cancelStripeSubscription(subscriptionId);
    } catch (stripeError) {
      if (!isStripeNotFoundError(stripeError)) throw stripeError;
    }

    const { error: updateError } = await admin
      .from("companies")
      .update({
        subscription_status: "canceled",
        current_period_end: new Date().toISOString(),
      })
      .eq("id", company.id)
      .eq("owner_id", userId);

    if (updateError) throw updateError;
  }
}

async function executeDeletion(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  profile: EligibleProfile,
) {
  await cancelEmployerSubscriptions(admin, profile.user_id);

  if (profile.email) {
    const { error } = await admin
      .from("contact_messages")
      .delete()
      .eq("email", profile.email);
    if (error) throw error;
  }

  const { error: prepareError } = await admin.rpc("prepare_account_deletion", {
    p_user_id: profile.user_id,
  });
  if (prepareError) throw prepareError;

  await removeUserStorage(admin, profile.user_id);

  const { error: authError } = await admin.auth.admin.deleteUser(
    profile.user_id,
  );
  if (authError && !missingAuthUser(authError)) throw authError;

  const { error: completeError } = await admin.rpc(
    "complete_account_deletion",
    { p_user_id: profile.user_id },
  );
  if (completeError) throw completeError;
}

async function handle(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("profiles")
    .select("user_id, email")
    .not("deletion_requested_at", "is", null)
    .lte("deletion_requested_at", cutoff)
    .is("deletion_completed_at", null)
    .order("deletion_requested_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    logServerError("account_deletion_eligibility_failed", error);
    return NextResponse.json(
      { error: "Could not process account deletions." },
      { status: 500 },
    );
  }

  const profiles = (data ?? []) as EligibleProfile[];

  if (!deletionEnabled()) {
    return NextResponse.json({
      mode: "report_only",
      eligible: profiles.length,
      batch_limit: BATCH_SIZE,
    });
  }

  let completed = 0;
  let failed = 0;

  for (const profile of profiles) {
    try {
      await executeDeletion(admin, profile);
      completed += 1;
    } catch (deletionError) {
      failed += 1;
      logServerError("account_deletion_execution_failed", deletionError);
    }
  }

  return NextResponse.json(
    {
      mode: "execute",
      eligible: profiles.length,
      completed,
      failed,
      batch_limit: BATCH_SIZE,
    },
    { status: failed ? 500 : 200 },
  );
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

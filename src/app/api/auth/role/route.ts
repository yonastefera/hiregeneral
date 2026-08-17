import { NextRequest, NextResponse } from "next/server";

import { assignInitialRole, primaryRole } from "@/lib/auth/role-assignment";
import { retryAfterSeconds } from "@/lib/auth/security";
import { routeForRole, type AppRole } from "@/lib/auth/roles";
import { roleSelectionSchema } from "@/lib/auth/validation";
import { logAuthEvent } from "@/lib/auth/log";
import { readJsonBody } from "@/lib/http/json-body";
import { roleSelectionRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { recordCurrentPolicyAcceptance } from "@/legal/policy-acceptance";
import {
  isCurrentPublishedAcceptance,
  legalPolicyRelease,
} from "@/legal/policy-release";

export const runtime = "nodejs";

type RoleRow = {
  role: AppRole;
};

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return user;
}

async function resolveRole(userId: string) {
  const admin = createSupabaseAdminClient();

  const [
    { data: profile, error: profileError },
    { data: roles, error: rolesError },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name, email, user_type")
      .eq("user_id", userId)
      .maybeSingle(),
    admin.from("user_roles").select("role").eq("user_id", userId),
  ]);

  if (profileError || rolesError)
    throw new Error("Could not load account role.");

  const roleRows = (roles ?? []) as RoleRow[];
  const role = primaryRole(roleRows);

  return {
    profile,
    role,
    redirectTo: role ? routeForRole(role) : "/auth/choose-role",
  };
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await resolveRole(user.id));
  } catch (error) {
    logAuthEvent("error", "role_read_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Could not load account." },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = roleSelectionSchema.safeParse(await readJsonBody(request));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose either job seeker or employer." },
      { status: 400 },
    );
  }

  try {
    const limit = await roleSelectionRateLimit.limit(user.id);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": retryAfterSeconds(limit.reset) },
        },
      );
    }
  } catch (error) {
    logAuthEvent("error", "role_selection_rate_limit_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Could not save account role." },
      { status: 503 },
    );
  }

  const { role: selectedRole, fullName, legalAcceptance } = parsed.data;

  if (
    legalPolicyRelease.acceptanceRequired &&
    !isCurrentPublishedAcceptance(legalAcceptance)
  ) {
    return NextResponse.json(
      { error: "Accept the current Terms and Privacy Policy to continue." },
      { status: 400 },
    );
  }

  try {
    const admin = createSupabaseAdminClient();

    if (legalPolicyRelease.acceptanceRequired) {
      await recordCurrentPolicyAcceptance({
        admin,
        userId: user.id,
        source: "role_selection",
      });
    }

    const role = await assignInitialRole({
      admin,
      user,
      role: selectedRole,
      fullName,
      source: "role_selection",
    });

    return NextResponse.json({ role, redirectTo: routeForRole(role) });
  } catch (error) {
    logAuthEvent("error", "role_assignment_failed", {
      source: "role_selection",
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Could not save account role." },
      { status: 503 },
    );
  }
}

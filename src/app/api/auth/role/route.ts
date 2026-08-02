import { NextRequest, NextResponse } from "next/server";

import { assignInitialRole, primaryRole } from "@/lib/auth/role-assignment";
import { normalizePublicRole } from "@/lib/auth/security";
import { routeForRole, type AppRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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
    console.error("[auth-role-read]", error);
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

  const body = await request.json().catch(() => ({}));
  const selectedRole = normalizePublicRole(body.role);

  if (!selectedRole) {
    return NextResponse.json(
      { error: "Choose either job seeker or employer." },
      { status: 400 },
    );
  }

  try {
    const role = await assignInitialRole({
      admin: createSupabaseAdminClient(),
      user,
      role: selectedRole,
      fullName: body.fullName,
    });

    return NextResponse.json({ role, redirectTo: routeForRole(role) });
  } catch (error) {
    console.error("[auth-role-write]", error);
    return NextResponse.json(
      { error: "Could not save account role." },
      { status: 503 },
    );
  }
}

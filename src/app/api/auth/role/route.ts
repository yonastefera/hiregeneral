import { NextRequest, NextResponse } from "next/server";

import { normalizeAppRole, routeForRole, type AppRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RoleRow = {
  role: AppRole;
};

function cleanName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

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

  const [{ data: profile }, { data: roles }] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name, email, user_type")
      .eq("user_id", userId)
      .maybeSingle(),
    admin.from("user_roles").select("role").eq("user_id", userId),
  ]);

  const roleRows = (roles ?? []) as RoleRow[];
  const role =
    roleRows.find((row) => row.role === "admin")?.role ??
    roleRows.find((row) => row.role === "recruiter")?.role ??
    roleRows.find((row) => row.role === "job_seeker")?.role ??
    null;

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

  const payload = await resolveRole(user.id);

  return NextResponse.json(payload);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const selectedRole = normalizeAppRole(body.role);

  if (!selectedRole || selectedRole === "admin") {
    return NextResponse.json(
      { error: "Choose either job seeker or employer." },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  const fullName =
    cleanName(body.fullName) ||
    cleanName(user.user_metadata?.full_name) ||
    cleanName(user.user_metadata?.name) ||
    cleanName(user.email?.split("@")[0]);
  const email = user.email ?? null;

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      user_id: user.id,
      full_name: fullName || null,
      email,
      user_type: selectedRole,
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { error: deleteError } = await admin
    .from("user_roles")
    .delete()
    .eq("user_id", user.id)
    .neq("role", "admin");

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const { error: roleError } = await admin.from("user_roles").upsert(
    {
      user_id: user.id,
      role: selectedRole,
    },
    { onConflict: "user_id,role" },
  );

  if (roleError) {
    return NextResponse.json({ error: roleError.message }, { status: 500 });
  }

  return NextResponse.json({
    role: selectedRole,
    redirectTo: routeForRole(selectedRole),
  });
}

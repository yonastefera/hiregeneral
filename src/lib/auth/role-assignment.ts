import type { User } from "@supabase/supabase-js";

import type { AppRole } from "@/lib/auth/roles";
import type { PublicAppRole } from "@/lib/auth/security";
import type { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

export function primaryRole(rows: Array<{ role: AppRole }> | null | undefined) {
  return (
    rows?.find((row) => row.role === "admin")?.role ??
    rows?.find((row) => row.role === "recruiter")?.role ??
    rows?.find((row) => row.role === "job_seeker")?.role ??
    null
  );
}

function cleanName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export async function assignInitialRole(params: {
  admin: AdminClient;
  user: User;
  role: PublicAppRole;
  fullName?: unknown;
}) {
  const { admin, user, role } = params;
  const { data: currentRoles, error: readError } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (readError)
    throw new Error("Could not read account role.", { cause: readError });

  const existingRole = primaryRole(currentRoles);
  if (existingRole) return existingRole;

  const fullName =
    cleanName(params.fullName) ||
    cleanName(user.user_metadata?.full_name) ||
    cleanName(user.user_metadata?.name) ||
    cleanName(user.email?.split("@")[0]);

  // Write the profile first. If the role write fails, the account remains
  // unassigned and a retry can safely finish the operation.
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      user_id: user.id,
      full_name: fullName || null,
      email: user.email ?? null,
      user_type: role,
    },
    { onConflict: "user_id" },
  );
  if (profileError) {
    throw new Error("Could not prepare account profile.", {
      cause: profileError,
    });
  }

  const { error: roleError } = await admin
    .from("user_roles")
    .upsert({ user_id: user.id, role }, { onConflict: "user_id,role" });
  if (roleError)
    throw new Error("Could not assign account role.", { cause: roleError });

  return role;
}

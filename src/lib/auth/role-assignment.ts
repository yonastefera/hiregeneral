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
  source: "oauth_callback" | "role_selection";
}) {
  const { admin, user, role } = params;
  const fullName =
    cleanName(params.fullName) ||
    cleanName(user.user_metadata?.full_name) ||
    cleanName(user.user_metadata?.name) ||
    cleanName(user.email?.split("@")[0]);

  const { data, error } = await admin.rpc("assign_initial_role", {
    p_user_id: user.id,
    p_role: role,
    p_full_name: fullName,
    p_email: user.email ?? null,
    p_source: params.source,
  });

  if (error || !data)
    throw new Error("Could not assign account role.", { cause: error });

  return data as AppRole;
}

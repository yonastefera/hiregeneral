import { createClient } from "@/lib/supabase/server";

type RoleRow = {
  role: "admin" | "recruiter" | "job_seeker";
};

export async function requireEmployerUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { supabase, user: null, error: "Unauthorized", status: 401 };
  }

  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (rolesError) {
    return { supabase, user: null, error: rolesError.message, status: 500 };
  }

  const canManageEmployerTools = ((roles ?? []) as RoleRow[]).some(
    (row) => row.role === "recruiter" || row.role === "admin",
  );

  if (!canManageEmployerTools) {
    return {
      supabase,
      user: null,
      error: "Only employer accounts can manage employer tools.",
      status: 403,
    };
  }

  return { supabase, user, error: null, status: 200 };
}

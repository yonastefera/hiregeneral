export type AppRole = "admin" | "recruiter" | "job_seeker";

export const ROLE_ROUTES: Record<AppRole, string> = {
  admin: "/admin/dashboard",
  recruiter: "/employer/dashboard",
  job_seeker: "/job-seeker/dashboard",
};

export function routeForRole(role: AppRole | null | undefined) {
  if (!role) return "/auth/choose-role";

  return ROLE_ROUTES[role] ?? "/jobs";
}

export function isAppRole(value: string | null | undefined): value is AppRole {
  return value === "admin" || value === "recruiter" || value === "job_seeker";
}

export function normalizeAppRole(
  value: string | null | undefined,
): AppRole | null {
  if (value === "employer") return "recruiter";
  if (isAppRole(value)) return value;

  return null;
}

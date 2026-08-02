import type { AppRole } from "@/lib/auth/roles";

export type PublicAppRole = Extract<AppRole, "job_seeker" | "recruiter">;

export function normalizePublicRole(value: unknown): PublicAppRole | null {
  if (value === "employer") return "recruiter";
  if (value === "job_seeker" || value === "recruiter") return value;
  return null;
}

export function safeInternalPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return null;

  try {
    const url = new URL(value, "https://hiregeneral.invalid");
    if (url.origin !== "https://hiregeneral.invalid") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function safeNextForRole(value: string | null, role: AppRole) {
  const path = safeInternalPath(value);
  if (!path) return null;

  const pathname = path.split(/[?#]/, 1)[0];
  const isAdmin =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/admin-control-center" ||
    pathname.startsWith("/admin-control-center/");
  const isEmployer =
    pathname === "/employers/dashboard" ||
    pathname.startsWith("/employers/dashboard/");

  if (isAdmin && role !== "admin") return null;
  if (isEmployer && role !== "admin" && role !== "recruiter") return null;
  return path;
}

export function trustedOrigin(requestOrigin: string) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const candidate = configured?.trim().replace(/\/$/, "") || requestOrigin;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" && url.protocol !== "http:")
      throw new Error();
    return url.origin;
  } catch {
    return new URL(requestOrigin).origin;
  }
}

export function retryAfterSeconds(reset: number) {
  return String(Math.max(1, Math.ceil((reset - Date.now()) / 1000)));
}

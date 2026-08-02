import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";
import { assignInitialRole, primaryRole } from "@/lib/auth/role-assignment";
import {
  createRecoveryAuthorization,
  RECOVERY_COOKIE,
} from "@/lib/auth/recovery-authorization";
import {
  normalizePublicRole,
  safeInternalPath,
  safeNextForRole,
  trustedOrigin,
} from "@/lib/auth/security";
import { routeForRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAuthEvent } from "@/lib/auth/log";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const next = safeInternalPath(searchParams.get("next"));
  const origin = trustedOrigin(req.nextUrl.origin);

  try {
    if (code) {
      const cookieStore = await cookies();

      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            },
          },
        },
      );

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.redirect(`${origin}/signin?error=oauth`);
        }

        if (next === "/reset-password") {
          const response = NextResponse.redirect(`${origin}/reset-password`);
          response.cookies.set(
            RECOVERY_COOKIE,
            createRecoveryAuthorization(user.id),
            {
              httpOnly: true,
              maxAge: 15 * 60,
              path: "/api/auth/password-update",
              sameSite: "lax",
              secure: new URL(origin).protocol === "https:",
            },
          );
          return response;
        }

        const admin = createSupabaseAdminClient();
        const { data: roles, error: rolesError } = await admin
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (rolesError)
          throw new Error("Could not load account role.", {
            cause: rolesError,
          });

        const metadataRole = normalizePublicRole(user.user_metadata?.role);
        const existingRole = primaryRole(roles);
        let role = existingRole;

        if (metadataRole && !existingRole) {
          role = await assignInitialRole({
            admin,
            user,
            role: metadataRole,
            source: "oauth_callback",
          });
        }

        if (!role) {
          return NextResponse.redirect(
            `${origin}/auth/choose-role${next ? `?next=${encodeURIComponent(next)}` : ""}`,
          );
        }

        return NextResponse.redirect(
          `${origin}${safeNextForRole(next, role) ?? routeForRole(role)}`,
        );
      }
    }
  } catch (error) {
    logAuthEvent("error", "oauth_callback_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
  }

  // Something went wrong — send to sign in with an error flag
  return NextResponse.redirect(`${origin}/signin?error=oauth`);
}

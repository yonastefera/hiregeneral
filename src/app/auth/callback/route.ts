import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";
import { normalizeAppRole, routeForRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;

  return value;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const origin = req.nextUrl.origin;

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
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      const admin = createSupabaseAdminClient();
      const { data: roles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const metadataRole = normalizeAppRole(user.user_metadata?.role);
      const existingRole =
        roles?.find((row) => row.role === "admin")?.role ??
        roles?.find((row) => row.role === "recruiter")?.role ??
        roles?.find((row) => row.role === "job_seeker")?.role ??
        null;
      const role = existingRole ?? metadataRole;

      if (role && !existingRole) {
        await admin.from("profiles").upsert(
          {
            user_id: user.id,
            full_name:
              user.user_metadata?.full_name ??
              user.user_metadata?.name ??
              user.email?.split("@")[0] ??
              null,
            email: user.email ?? null,
            user_type: role,
          },
          { onConflict: "user_id" },
        );

        await admin.from("user_roles").upsert(
          {
            user_id: user.id,
            role,
          },
          { onConflict: "user_id,role" },
        );
      }

      if (!role) {
        return NextResponse.redirect(
          `${origin}/auth/choose-role${next ? `?next=${encodeURIComponent(next)}` : ""}`,
        );
      }

      return NextResponse.redirect(`${origin}${next ?? routeForRole(role)}`);
    }
  }

  // Something went wrong — send to sign in with an error flag
  return NextResponse.redirect(`${origin}/signin?error=oauth`);
}

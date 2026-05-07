import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Routes that require any authenticated user
const PROTECTED_ROUTES = ["/profile", "/saved", "/applications"];

// Routes that require the recruiter or admin role
const RECRUITER_ROUTES = ["/employers", "/dashboard"];

// Routes that require admin role only
const ADMIN_ROUTES = ["/admin-control-center"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Build a response we can attach cookies to
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            req.cookies.set(name, value);
          });

          response = NextResponse.next({ request: req });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Refresh session — required for Server Components to stay in sync
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  const isRecruiter = RECRUITER_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  // Not logged in — redirect to sign in
  if ((isProtected || isRecruiter || isAdminRoute) && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Logged in but check role for recruiter/admin routes
  if (user && (isRecruiter || isAdminRoute)) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const userRoles = roles?.map((role) => role.role) ?? [];

    if (isAdminRoute && !userRoles.includes("admin")) {
      const url = req.nextUrl.clone();
      url.pathname = "/jobs";
      return NextResponse.redirect(url);
    }

    if (
      isRecruiter &&
      !userRoles.includes("recruiter") &&
      !userRoles.includes("admin")
    ) {
      const url = req.nextUrl.clone();
      url.pathname = "/jobs";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon, public assets
     * - API routes
     */
    "/((?!_next/static|_next/image|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Routes that require any authenticated user
const PROTECTED_ROUTES = [
  "/profile",
  "/saved",
  "/saved-jobs",
  "/applications",
  "/messages",
  "/account",
  "/settings",
];

const JOB_SEEKER_ROUTES = [
  "/job-seeker",
  "/profile",
  "/saved",
  "/saved-jobs",
  "/applications",
  "/messages",
];

const EMPLOYER_ROUTES = [
  "/employers/dashboard",
  "/employers/dashboard/post-job",
];

const ADMIN_ROUTES = ["/admin/dashboard", "/admin-control-center"];

const AUTH_ROUTES = ["/signin", "/signup", "/forgot-password"];

function startsWithAny(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function redirect(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Build a response we can attach refreshed Supabase cookies to.
  let response = NextResponse.next({
    request: req,
  });

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

          response = NextResponse.next({
            request: req,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Refresh session — required for Server Components to stay in sync.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = startsWithAny(pathname, PROTECTED_ROUTES);
  const isJobSeekerRoute = startsWithAny(pathname, JOB_SEEKER_ROUTES);
  const isEmployerRoute = startsWithAny(pathname, EMPLOYER_ROUTES);
  const isAdminRoute = startsWithAny(pathname, ADMIN_ROUTES);
  const isAuthRoute = startsWithAny(pathname, AUTH_ROUTES);
  const isChooseRoleRoute = pathname.startsWith("/auth/choose-role");

  const requiresAuth =
    isProtected ||
    isJobSeekerRoute ||
    isEmployerRoute ||
    isAdminRoute ||
    isChooseRoleRoute;

  // Not logged in — redirect to sign in.
  if (requiresAuth && !user && pathname !== "/signin") {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const userRoles = roles?.map((role) => role.role) ?? [];
    const primaryRole = userRoles.includes("admin")
      ? "admin"
      : userRoles.includes("recruiter")
        ? "recruiter"
        : userRoles.includes("job_seeker")
          ? "job_seeker"
          : null;

    if (
      !primaryRole &&
      !isChooseRoleRoute &&
      !pathname.startsWith("/auth/callback")
    ) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/choose-role";
      url.search = "";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (isAuthRoute && primaryRole) {
      if (primaryRole === "admin") return redirect(req, "/admin/dashboard");
      if (primaryRole === "recruiter")
        return redirect(req, "/employers/dashboard");
      return redirect(req, "/job-seeker/dashboard");
    }

    if (isAdminRoute && primaryRole !== "admin") {
      return redirect(
        req,
        primaryRole === "recruiter" ? "/employers/dashboard" : "/jobs",
      );
    }

    if (
      isEmployerRoute &&
      primaryRole !== "recruiter" &&
      primaryRole !== "admin"
    ) {
      return redirect(req, primaryRole ? "/jobs" : "/auth/choose-role");
    }

    if (
      isJobSeekerRoute &&
      primaryRole !== "job_seeker" &&
      primaryRole !== "admin"
    ) {
      return redirect(
        req,
        primaryRole === "recruiter" ? "/employers/dashboard" : "/jobs",
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match app routes, excluding:
     * - API routes
     * - Next.js internals
     * - common metadata files
     * - anything with a file extension, such as .css, .js, .map, .txt, .ico, .woff2
     */
    "/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};

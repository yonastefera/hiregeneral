"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, LockKeyhole, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import { routeForRole, type AppRole } from "@/lib/auth/roles";
import type { UserFlow } from "@/data/jobPlatform";

const roles: { value: UserFlow; label: string }[] = [
  { value: "job_seeker", label: "Job seeker" },
  { value: "recruiter", label: "Recruiter" },
];

type AuthMode = "signin" | "signup" | "forgot";

export function AuthPage({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") ?? "/jobs";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserFlow>("job_seeker");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirectAfterAuth = async (fallback = nextUrl) => {
    const response = await fetch("/api/auth/role", { cache: "no-store" });

    if (response.status === 401) {
      router.push(`/signin?next=${encodeURIComponent(fallback)}`);
      return;
    }

    const body = (await response.json()) as {
      role?: AppRole | null;
      redirectTo?: string;
    };

    if (!body.role) {
      router.push(`/auth/choose-role?next=${encodeURIComponent(fallback)}`);
      return;
    }

    router.push(body.redirectTo ?? routeForRole(body.role));
  };

  const title =
    mode === "signup"
      ? "Create your account"
      : mode === "forgot"
        ? "Reset your password"
        : "Welcome back";

  const subtitle =
    mode === "signup"
      ? "Choose your flow and start building your hiring profile."
      : mode === "forgot"
        ? "We'll send a secure reset link to your email."
        : "Sign in to save jobs, post listings, and manage your profile.";

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
        queryParams: {
          // Request profile scope so we get full_name + avatar
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
    // On success Supabase redirects the browser — no further action needed
  };

  // ── Email / password ──────────────────────────────────────────────────────
  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
        },
      );
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password reset link sent.");
      return;
    }

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(routeForRole(role))}`,
          data: { full_name: fullName, role },
        },
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session) {
        await fetch("/api/auth/role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, fullName }),
        });
      }

      toast.success("Check your email to confirm your account.");
      router.push("/signin");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in successfully.");
    await redirectAfterAuth(nextUrl);
  };

  return (
    <main className="min-h-screen bg-hero-gradient px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
        {/* ── Left panel ── */}
        <section className="hidden lg:block">
          <Badge variant="soft">HireGeneral authentication</Badge>
          <h1 className="mt-5 max-w-xl text-5xl font-bold tracking-tight text-foreground text-balance">
            One account for every hiring workflow.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-muted-foreground">
            Search without signing in, then create an account when you want to
            save listings, post roles, or manage candidate details.
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-2 gap-3">
            {roles.map((item) => (
              <div
                key={item.value}
                className="rounded-lg border border-border bg-surface/80 p-4 shadow-soft backdrop-blur"
              >
                <p className="text-sm font-semibold">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Form panel ── */}
        <section className="rounded-lg border border-border bg-surface/90 p-6 shadow-lift backdrop-blur md:p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <Eye className="size-4" /> HireGeneral
          </Link>

          <h2 className="mt-6 text-3xl font-bold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {subtitle}
          </p>

          {/* ── Google button ── */}
          {mode !== "forgot" && (
            <Button
              type="button"
              variant="glass"
              size="xl"
              className="mt-6 w-full gap-3"
              onClick={handleGoogle}
              disabled={googleLoading}
            >
              {googleLoading ? (
                "Redirecting…"
              ) : (
                <>
                  {/* Google SVG icon */}
                  <svg
                    className="size-5"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
          )}

          {/* ── Divider ── */}
          {mode !== "forgot" && (
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">
                or continue with email
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}

          {/* ── Email / password form ── */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <label className="block text-sm font-medium">
                Full name
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-input bg-background px-3">
                  <UserRound className="size-4 text-muted-foreground" />
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Avery Morgan"
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </div>
              </label>
            )}

            <label className="block text-sm font-medium">
              Email
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-input bg-background px-3">
                <Mail className="size-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@email.com"
                  className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </label>

            {mode !== "forgot" && (
              <label className="block text-sm font-medium">
                Password
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-input bg-background px-3">
                  <LockKeyhole className="size-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </div>
              </label>
            )}

            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-2">
                {roles.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRole(item.value)}
                    className={`rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                      role === item.value
                        ? "border-primary bg-secondary text-secondary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            <Button
              type="submit"
              variant="hero"
              size="xl"
              className="w-full"
              disabled={loading}
            >
              {loading
                ? "Please wait…"
                : mode === "signup"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Send reset link"
                    : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
            {mode !== "signin" ? (
              <Link href="/signin" className="font-medium text-primary">
                Sign in
              </Link>
            ) : (
              <Link href="/signup" className="font-medium text-primary">
                Create account
              </Link>
            )}
            {mode !== "forgot" && (
              <Link
                href="/forgot-password"
                className="font-medium text-primary"
              >
                Forgot password?
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

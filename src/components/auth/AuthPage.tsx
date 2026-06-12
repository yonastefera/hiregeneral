"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { routeForRole, type AppRole } from "@/lib/auth/roles";
import type { UserFlow } from "@/data/jobPlatform";

const roles: { value: UserFlow; label: string; tag: string }[] = [
  { value: "job_seeker", label: "Job seeker", tag: "Save roles and apply" },
  { value: "recruiter", label: "Employer", tag: "Post jobs and hire" },
];

const proofPoints = [
  "Candidates can search jobs before signing in",
  "Save roles and return when you are ready",
  "Employers can post jobs and manage hiring tools",
];

type AuthMode = "signin" | "signup" | "forgot";

function isSafeInternalPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//");
}

function canUseEmployerPath(role: AppRole | null | undefined) {
  return role === "recruiter" || role === "admin";
}

export function AuthPage({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleHint = searchParams.get("role");
  const isEmployerIntent = roleHint === "employer" || roleHint === "recruiter";
  const fallbackNextUrl = isEmployerIntent ? "/employers/dashboard" : "/jobs";
  const requestedNextUrl = searchParams.get("next") ?? fallbackNextUrl;
  const nextUrl = isSafeInternalPath(requestedNextUrl)
    ? requestedNextUrl
    : fallbackNextUrl;
  const roleIntent = isEmployerIntent ? "&role=employer" : "";
  const authIntentQuery = `next=${encodeURIComponent(nextUrl)}${roleIntent}`;
  const signInHref = `/signin?${authIntentQuery}`;
  const signUpHref = `/signup?${authIntentQuery}`;
  const forgotPasswordHref = `/forgot-password?${authIntentQuery}`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserFlow>(
    isEmployerIntent ? "recruiter" : "job_seeker",
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const eyebrow =
    mode === "signup"
      ? isEmployerIntent
        ? "Employer account"
        : "Create account"
      : mode === "forgot"
        ? "Password reset"
        : isEmployerIntent
          ? "Employer sign in"
          : "Sign in";
  const heading =
    mode === "signup"
      ? isEmployerIntent
        ? "Create an employer account."
        : "Create your account."
      : mode === "forgot"
        ? "Reset your password."
        : isEmployerIntent
          ? "Sign in to post and manage jobs."
          : "Sign in to keep your search moving.";
  const subtitle =
    mode === "signup"
      ? isEmployerIntent
        ? "Create a recruiter account to post roles, review applicants, and manage your employer dashboard."
        : "Create a free candidate account to save jobs, track applications, and come back to roles you care about."
      : mode === "forgot"
        ? "Enter the email on your account and we will send a secure reset link."
        : isEmployerIntent
          ? "Use your employer account to post openings, manage listings, and continue hiring work."
          : "Use your account to save jobs, revisit applications, and keep your job search organized.";

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

    const roleRoute = body.redirectTo || routeForRole(body.role);
    const target =
      fallback.startsWith("/employers") && !canUseEmployerPath(body.role)
        ? roleRoute
        : fallback || roleRoute;

    router.push(target);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (mode === "forgot") {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setLoading(false);

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast.error(body?.error ?? "Could not send reset link.");
        return;
      }

      toast.success("Password reset link sent.");
      return;
    }

    if (mode === "signup") {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role,
        }),
      });
      setLoading(false);

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast.error(body?.error ?? "Could not create account.");
        return;
      }

      toast.success("Check your email to confirm your account.");
      router.push(signInHref);
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
    <main className="h-[calc(100svh-4rem)] w-full overflow-hidden bg-[hsl(40_38%_98%)] lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside
        className="relative hidden h-[calc(100svh-4rem)] overflow-hidden lg:flex lg:flex-col lg:justify-between lg:py-6 lg:pl-32 lg:pr-10 xl:pl-40 xl:pr-12"
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, hsl(174 60% 22%) 0%, hsl(180 40% 8%) 55%, hsl(180 40% 5%) 100%)",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/3 size-[520px] -translate-x-1/2 rounded-full bg-primary/25 blur-[160px]"
        />

        <div aria-hidden="true" className="relative z-10 h-1" />

        <div className="relative z-10 max-w-xl text-[hsl(40_38%_98%)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(40_38%_98%)]/15 bg-[hsl(40_38%_98%)]/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(40_38%_98%)]/70 backdrop-blur">
            <Sparkles
              className="size-3"
              style={{ color: "hsl(174 70% 70%)" }}
            />
            <span>Candidate sign in · employer tools</span>
          </div>
          <h1 className="font-display mt-5 text-[44px] font-normal leading-[1.02] tracking-[-0.04em] xl:text-[56px]">
            Search smarter.{" "}
            <span style={{ color: "hsl(174 70% 75%)" }}>Hire faster.</span> Keep
            your work organized.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[hsl(40_38%_98%)]/65">
            Candidates can save roles and return to applications. Employers can
            post openings and manage hiring from protected tools.
          </p>

          <ul className="mt-5 space-y-2.5">
            {proofPoints.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 text-xs text-[hsl(40_38%_98%)]/80 xl:text-sm"
              >
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: "hsl(174 70% 70%)" }}
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-[hsl(40_38%_98%)]/10 pt-5 text-[hsl(40_38%_98%)]">
          {[
            { k: "Free", v: "For candidates" },
            { k: "Fast", v: "Job posting" },
            { k: "Clear", v: "Hiring tools" },
          ].map((stat) => (
            <div key={stat.v}>
              <p className="font-display text-2xl font-semibold tracking-tight">
                {stat.k}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[hsl(40_38%_98%)]/50">
                {stat.v}
              </p>
            </div>
          ))}
        </div>
      </aside>

      <section className="relative flex h-[calc(100svh-4rem)] items-center justify-center overflow-hidden px-5 py-4 sm:px-8 lg:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 0% 0%, hsl(174 60% 90% / 0.5), transparent 45%), radial-gradient(circle at 100% 100%, hsl(20 90% 88% / 0.45), transparent 45%)",
          }}
        />

        <div className="w-full max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-primary" />
            {eyebrow}
          </div>

          <h2 className="font-display mt-3 text-[34px] font-semibold leading-[1.04] tracking-[-0.035em] text-foreground sm:text-[42px]">
            {heading}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>

          {mode !== "forgot" && (
            <>
              <Button
                type="button"
                onClick={handleGoogle}
                className="mt-4 h-11 w-full rounded-xl border border-border bg-background text-sm font-medium text-foreground shadow-xs hover:bg-muted"
                disabled={googleLoading}
              >
                {googleLoading ? (
                  "Redirecting..."
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>

              <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or with email
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form className="space-y-3" onSubmit={handleSubmit}>
            <Field icon={<Mail className="size-4" />} label="Email">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@email.com"
                className="h-11 rounded-xl border-border bg-background pl-10 text-sm"
              />
            </Field>

            {mode !== "forgot" && (
              <Field
                icon={<LockKeyhole className="size-4" />}
                label="Password"
                trailing={
                  mode === "signin" ? (
                    <Link
                      href={forgotPasswordHref}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot?
                    </Link>
                  ) : null
                }
              >
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  placeholder="Password"
                  className="h-11 rounded-xl border-border bg-background pl-10 text-sm"
                />
              </Field>
            )}

            {mode === "signup" && (
              <div>
                <p className="mb-1.5 text-sm font-medium text-foreground">
                  I&apos;m here to...
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((item) => {
                    const active = role === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setRole(item.value)}
                        className={`group relative overflow-hidden rounded-xl border p-3 text-left transition ${
                          active
                            ? "border-primary bg-primary/5 text-foreground shadow-soft"
                            : "border-border bg-background text-foreground hover:border-foreground/30"
                        }`}
                      >
                        <Briefcase
                          className={`size-4 ${
                            active ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <p className="mt-1.5 text-sm font-semibold">
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.tag}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="group mt-1 h-11 w-full rounded-xl bg-primary text-sm font-medium text-primary-foreground shadow-pop transition hover:brightness-110"
            >
              {loading
                ? "Please wait..."
                : mode === "signup"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Send reset link"
                    : isEmployerIntent
                      ? "Sign in to employer tools"
                      : "Sign in"}
              <ArrowRight className="ml-1 size-4 transition group-hover:translate-x-0.5" />
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "signin" && (
              <>
                New here?{" "}
                <Link
                  href={signUpHref}
                  className="font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  Create an account
                </Link>
              </>
            )}
            {mode === "signup" && (
              <>
                Already on HireGeneral?{" "}
                <Link
                  href={signInHref}
                  className="font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </>
            )}
            {mode === "forgot" && (
              <>
                Remembered it?{" "}
                <Link
                  href={signInHref}
                  className="font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  Back to sign in
                </Link>
              </>
            )}
          </p>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/80">
            By continuing you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Privacy
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}

function Field({
  icon,
  label,
  trailing,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {trailing}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        {children}
      </div>
    </label>
  );
}

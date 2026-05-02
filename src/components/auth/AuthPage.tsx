"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, LockKeyhole, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { UserFlow } from "@/data/jobPlatform";

const roles: { value: UserFlow; label: string }[] = [
  { value: "job_seeker", label: "Job seeker" },
  { value: "recruiter", label: "Recruiter" },
];

type AuthMode = "signin" | "signup" | "forgot";

export function AuthPage({ mode }: { mode: AuthMode }) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserFlow>("job_seeker");
  const [loading, setLoading] = useState(false);

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
        ? "We’ll send a secure reset link to your email."
        : "Sign in to save jobs, post listings, and manage your profile.";

  // const handleGoogle = async () => {
  //
  //   if (result.error) toast.error("Google sign-in could not start.");
  //   if (!result.redirected && !result.error) router.push("/jobs");
  // };

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      setLoading(false);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Password reset link sent.");
      return;
    }

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      setLoading(false);

      if (error) {
        toast.error(error.message);
        return;
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
    router.push("/jobs");
  };

  return (
    <main className="min-h-screen bg-hero-gradient px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
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

        <section className="rounded-lg border border-border bg-surface/90 p-6 shadow-lift backdrop-blur md:p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <Eye className="size-4" />
            HireGeneral
          </Link>

          <h2 className="mt-6 text-3xl font-bold tracking-tight">{title}</h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {subtitle}
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <label className="block text-sm font-medium">
                Full name
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-input bg-background px-3">
                  <UserRound className="size-4 text-muted-foreground" />
                  <Input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
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
                  onChange={(event) => setEmail(event.target.value)}
                  required
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
                    onChange={(event) => setPassword(event.target.value)}
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

          {/* {mode !== "forgot" && (
            <Button
              type="button"
              variant="glass"
              size="xl"
              className="mt-3 w-full"
              onClick={handleGoogle}
            >
              Continue with Gmail
            </Button>
          )} */}

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
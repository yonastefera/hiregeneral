"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";

export default function ResetPassword() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasRecoveryToken, setHasRecoveryToken] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      setHasRecoveryToken(
        Boolean(data.session) ||
          window.location.hash.includes("type=recovery") ||
          window.location.search.includes("type=recovery"),
      );
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasRecoveryToken(Boolean(session));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated.");
    router.push("/signin");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, hsl(174 60% 90% / 0.5), transparent 45%), radial-gradient(circle at 100% 100%, hsl(20 90% 88% / 0.45), transparent 45%)",
        }}
      />
      <section className="relative w-full max-w-md rounded-3xl border border-border bg-background/90 p-8 shadow-lift backdrop-blur">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight"
        >
          Hire<span className="text-primary">General</span>
        </Link>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          <ShieldCheck className="size-3.5 text-primary" />
          Secure reset
        </div>
        <h1 className="font-display mt-4 text-3xl font-semibold tracking-[-0.02em]">
          Set a new password
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {hasRecoveryToken
            ? "Create a secure password to regain access."
            : "Open this page from the secure reset link in your email."}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            New password
            <div className="relative mt-1.5">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="h-12 rounded-xl border-border bg-background pl-10 text-[15px]"
              />
            </div>
          </label>

          <Button
            className="group h-12 w-full rounded-2xl bg-foreground text-[15px] font-medium text-background shadow-lift hover:bg-foreground/90"
            disabled={loading || !hasRecoveryToken}
          >
            {loading ? "Updating..." : "Update password"}
            <ArrowRight className="ml-1 size-4 transition group-hover:translate-x-0.5" />
          </Button>
        </form>
      </section>
    </main>
  );
}

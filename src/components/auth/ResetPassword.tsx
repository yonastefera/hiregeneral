"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
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
    setHasRecoveryToken(
      window.location.hash.includes("type=recovery") ||
        window.location.search.includes("type=recovery"),
    );
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
    <main className="flex min-h-screen items-center justify-center bg-hero-gradient px-4">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface/90 p-7 shadow-lift backdrop-blur">
        <Link href="/" className="text-sm font-semibold text-primary">
          HireGeneral
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">
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
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-input bg-background px-3">
              <LockKeyhole className="size-4 text-muted-foreground" />

              <Input
                type="password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </label>

          <Button
            variant="hero"
            size="xl"
            className="w-full"
            disabled={loading || !hasRecoveryToken}
          >
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>
      </section>
    </main>
  );
}

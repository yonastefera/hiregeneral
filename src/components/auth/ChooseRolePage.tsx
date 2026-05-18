"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { routeForRole, type AppRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

const roleOptions: Array<{
  role: Extract<AppRole, "job_seeker" | "recruiter">;
  title: string;
  description: string;
  icon: typeof BriefcaseBusiness;
  bullets: string[];
}> = [
  {
    role: "job_seeker",
    title: "Job seeker",
    description:
      "Find roles, save jobs, manage applications, and build your profile.",
    icon: BriefcaseBusiness,
    bullets: ["Save jobs", "Track applications", "Build a profile"],
  },
  {
    role: "recruiter",
    title: "Employer",
    description:
      "Post jobs, manage applicants, and keep your hiring pipeline moving.",
    icon: Building2,
    bullets: ["Post jobs", "Review candidates", "Manage hiring"],
  },
];

type RolePayload = {
  role?: AppRole | null;
  redirectTo?: string;
  error?: string;
};

export default function ChooseRolePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");

  const [selectedRole, setSelectedRole] =
    useState<Extract<AppRole, "job_seeker" | "recruiter">>("job_seeker");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const nextUrl = useMemo(() => {
    if (!requestedNext || !requestedNext.startsWith("/")) return null;
    if (requestedNext.startsWith("//")) return null;

    return requestedNext;
  }, [requestedNext]);

  useEffect(() => {
    let mounted = true;

    fetch("/api/auth/role", { cache: "no-store" })
      .then(async (response) => {
        if (!mounted) return;

        if (response.status === 401) {
          router.replace(
            `/signin?next=${encodeURIComponent("/auth/choose-role")}`,
          );
          return;
        }

        const body = (await response.json()) as RolePayload;

        if (body.role) {
          router.replace(nextUrl ?? routeForRole(body.role));
          return;
        }

        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [nextUrl, router]);

  async function saveRole() {
    setSaving(true);

    try {
      const response = await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole, fullName }),
      });
      const body = (await response.json()) as RolePayload;

      if (!response.ok) {
        throw new Error(body.error ?? "Could not save role.");
      }

      toast.success("Your workspace is ready.");
      router.replace(nextUrl ?? body.redirectTo ?? routeForRole(selectedRole));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save role.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-hero-gradient px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-soft">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Checking your account
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-hero-gradient px-4 py-10">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1fr]">
        <div>
          <Badge variant="soft" className="gap-1.5">
            <ShieldCheck className="size-3.5" />
            Final step
          </Badge>
          <h1 className="mt-5 max-w-xl text-balance text-5xl font-bold tracking-tight">
            Choose the workspace you want to use.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-muted-foreground">
            Google sign-in gives us your identity. This step tells HireGeneral
            whether to open the candidate tools or the employer hiring console.
          </p>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-lift md:p-8">
          <label className="block text-sm font-medium">
            Name
            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Avery Morgan"
              className="mt-2 h-12 rounded-xl"
            />
          </label>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {roleOptions.map((option) => (
              <button
                key={option.role}
                type="button"
                onClick={() => setSelectedRole(option.role)}
                className={cn(
                  "rounded-2xl border p-5 text-left transition-all",
                  selectedRole === option.role
                    ? "border-primary bg-secondary shadow-soft"
                    : "border-border bg-background hover:border-primary/40",
                )}
              >
                <option.icon className="size-6 text-primary" />
                <h2 className="mt-4 text-xl font-bold tracking-tight">
                  {option.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {option.description}
                </p>
                <div className="mt-4 space-y-2">
                  {option.bullets.map((bullet) => (
                    <p
                      key={bullet}
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
                    >
                      <CheckCircle2 className="size-3.5 text-primary" />
                      {bullet}
                    </p>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <Button
            type="button"
            size="xl"
            className="mt-6 w-full"
            onClick={saveRole}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </section>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BriefcaseBusiness, Clock3, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isSupportedLogoUrl } from "@/lib/logos";
import { supabase } from "@/lib/supabase/client";

type ApplicationStatus =
  | "submitted"
  | "reviewing"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

interface Application {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  cover_note: string | null;
  jobs: {
    id: string;
    title: string;
    company_name: string;
    company_logo_url: string | null;
    location: string;
    employment_type: string;
    work_mode: string;
    slug: string;
  } | null;
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; color: string }
> = {
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-700" },
  reviewing: { label: "Reviewing", color: "bg-amber-100 text-amber-700" },
  interview: { label: "Interview", color: "bg-purple-100 text-purple-700" },
  offer: { label: "Offer", color: "bg-green-100 text-green-700" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700" },
  withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-600" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg =
    STATUS_CONFIG[status as ApplicationStatus] ?? STATUS_CONFIG.submitted;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

export default function ApplicationsPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const loggedIn = Boolean(data.user);

      setIsLoggedIn(loggedIn);
      setAuthChecked(true);

      if (loggedIn) {
        fetch("/api/applications")
          .then((response) => response.json())
          .then((res) => setApplications(res.data ?? []))
          .catch(() => toast.error("Could not load applications."))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-hero-gradient px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <Badge variant="soft">Your activity</Badge>

          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            My applications
          </h1>

          <p className="mt-3 text-muted-foreground">
            Track every role you&apos;ve applied to through HireGeneral.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}

        {!loading && authChecked && !isLoggedIn && (
          <div className="rounded-lg border border-border bg-surface p-16 text-center">
            <BriefcaseBusiness className="mx-auto size-10 text-muted-foreground/40" />

            <p className="mt-4 font-medium text-foreground">
              Sign in to see your applications
            </p>

            <Button variant="hero" className="mt-6" asChild>
              <Link href="/signin?next=/applications">Sign in</Link>
            </Button>
          </div>
        )}

        {!loading && isLoggedIn && applications.length === 0 && (
          <div className="rounded-lg border border-border bg-surface p-16 text-center">
            <BriefcaseBusiness className="mx-auto size-10 text-muted-foreground/40" />

            <p className="mt-4 font-medium text-foreground">
              No applications yet
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              When you apply to jobs they&apos;ll appear here so you can track
              your progress.
            </p>

            <Button variant="hero" className="mt-6" asChild>
              <Link href="/jobs">Browse jobs</Link>
            </Button>
          </div>
        )}

        {!loading && isLoggedIn && applications.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {applications.length} application
              {applications.length !== 1 ? "s" : ""}
            </p>

            {applications.map((app) => {
              const job = app.jobs;

              if (!job) return null;

              const logoInitials = job.company_name.slice(0, 2).toUpperCase();
              const logoUrl =
                job.company_logo_url && isSupportedLogoUrl(job.company_logo_url)
                  ? job.company_logo_url
                  : null;

              const daysAgo = Math.floor(
                (Date.now() - new Date(app.created_at).getTime()) / 86_400_000,
              );

              return (
                <article
                  key={app.id}
                  className="rounded-2xl border border-border bg-surface p-5 shadow-soft"
                >
                  <div className="flex items-start gap-4">
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt={job.company_name}
                        width={48}
                        height={48}
                        className="size-12 shrink-0 rounded-xl object-contain"
                      />
                    ) : (
                      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-gradient text-sm font-bold text-primary-foreground">
                        {logoInitials}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {job.company_name}
                          </p>

                          <Link
                            href={`/jobs/${job.slug}`}
                            className="mt-0.5 block text-lg font-semibold text-foreground transition-colors hover:text-primary"
                          >
                            {job.title}
                          </Link>
                        </div>

                        <StatusBadge status={app.status} />
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-3.5" />
                          {job.location}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <BriefcaseBusiness className="size-3.5" />
                          {job.employment_type}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="size-3.5" />
                          Applied {daysAgo === 0 ? "today" : `${daysAgo}d ago`}
                        </span>
                      </div>

                      {app.cover_note && (
                        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                          {app.cover_note}
                        </p>
                      )}

                      <div className="mt-4 flex gap-2">
                        <Button variant="glass" size="sm" asChild>
                          <Link href={`/jobs/${job.slug}`}>View listing</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

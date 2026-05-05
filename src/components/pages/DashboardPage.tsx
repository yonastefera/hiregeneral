"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { flowCards } from "@/data/jobPlatform";

interface Stats {
  totalJobs: number;
  totalUsers: number;
  totalApplications: number;
  totalCompanies: number;
}

type FlowCard = (typeof flowCards)[number];

export default function DashboardPage() {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/admin-control-center";

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const visibleFlows: FlowCard[] = isAdminRoute
    ? flowCards
    : flowCards.filter((flow: FlowCard) => flow.role !== "admin");

  const statCards = [
    {
      label: "Active listings",
      value: stats?.totalJobs ?? 0,
      icon: BriefcaseBusiness,
    },
    {
      label: "Registered users",
      value: stats?.totalUsers ?? 0,
      icon: UsersRound,
    },
    {
      label: "Applications",
      value: stats?.totalApplications ?? 0,
      icon: BarChart3,
    },
    {
      label: "Companies",
      value: stats?.totalCompanies ?? 0,
      icon: Building2,
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <Badge variant="soft">Role-aware command center</Badge>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance">
          {isAdminRoute
            ? "Manage marketplace quality across job seekers, recruiters, and admins."
            : "Manage job postings, applicants, and employer hiring activity."}
        </h1>

        {/* ── Stats ── */}
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-surface p-5 shadow-soft"
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                <stat.icon className="size-5 text-primary" />
              )}

              <p className="mt-4 text-3xl font-bold">
                {loading ? "—" : stat.value.toLocaleString()}
              </p>

              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Flow cards ── */}
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {visibleFlows.map((flow: FlowCard) => (
            <article
              key={flow.role}
              className="rounded-lg border border-border bg-surface p-6 shadow-soft"
            >
              <flow.icon className="size-7 text-primary" />

              <h2 className="mt-5 text-xl font-bold tracking-tight">
                {flow.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {flow.description}
              </p>

              <Button variant="glass" className="mt-5">
                Open workspace
              </Button>
            </article>
          ))}
        </div>

        {/* ── Recruiter posting checklist ── */}
        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-lg border border-border bg-surface p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className="size-5 text-primary" />

              <h2 className="text-xl font-bold tracking-tight">
                Recruiter posting flow
              </h2>
            </div>

            {[
              "Company profile and logo",
              "Job title, location, work mode, salary range",
              "Required skills and job description",
              "Publish status and applicant review queue",
            ].map((item) => (
              <p
                key={item}
                className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="size-4 text-success" />
                {item}
              </p>
            ))}
          </section>

          {isAdminRoute && (
            <section className="rounded-lg border border-border bg-surface p-6 shadow-soft">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />

                <h2 className="text-xl font-bold tracking-tight">
                  Admin controls
                </h2>
              </div>

              <div className="mt-5 space-y-3">
                {[BarChart3, UsersRound, ShieldCheck].map((Icon, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg bg-background p-4"
                  >
                    <Icon className="size-5 text-primary" />

                    <span className="text-sm font-medium">
                      {
                        [
                          "Marketplace quality",
                          "User and role management",
                          "Listing moderation",
                        ][index]
                      }
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

"use client";

import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { flowCards, platformStats } from "@/data/jobPlatform";

export default function DashboardPage() {
  const pathname = usePathname();

  const isAdminRoute = pathname === "/admin-control-center";
  const visibleFlows = isAdminRoute
    ? flowCards
    : flowCards.filter((flow) => flow.role !== "admin");

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <Badge variant="soft">Role-aware command center</Badge>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance">
          {isAdminRoute
            ? "Manage marketplace quality across job seekers, recruiters, and admins."
            : "Manage job postings, applicants, and employer hiring activity."}
        </h1>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {platformStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-surface p-5 shadow-soft"
            >
              <stat.icon className="size-5 text-primary" />

              <p className="mt-4 text-3xl font-bold">{stat.value}</p>

              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {visibleFlows.map((flow) => (
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

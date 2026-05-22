import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  DatabaseZap,
  FileSearch,
  HeartHandshake,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About HireGeneral | A Calmer Job Marketplace",
  description:
    "Learn how HireGeneral helps technology professionals and hiring teams search, post, and hire with fresher jobs, clearer context, and less noise.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About HireGeneral",
    description:
      "A modern job marketplace built for technology professionals and hiring teams who want clearer signals and less noise.",
    url: "/about",
    siteName: "HireGeneral",
    type: "website",
  },
};

const metrics = [
  { label: "Fresh roles indexed", value: "Daily", icon: DatabaseZap },
  { label: "Hiring-side tools", value: "Built in", icon: BriefcaseBusiness },
  { label: "Candidate control", value: "First", icon: ShieldCheck },
];

const principles = [
  {
    title: "Freshness over volume",
    description:
      "We focus on current, useful jobs instead of letting stale listings crowd the page.",
    icon: BadgeCheck,
  },
  {
    title: "Readable by default",
    description:
      "Listings are normalized into clear titles, locations, work modes, salary signals, and apply links.",
    icon: FileSearch,
  },
  {
    title: "Built for both sides",
    description:
      "Candidates get a cleaner search experience. Employers get a focused hiring workspace.",
    icon: HeartHandshake,
  },
];

const operatingModel = [
  {
    title: "Source",
    description:
      "We connect to employer career systems and public boards where roles are first posted.",
    icon: Search,
  },
  {
    title: "Normalize",
    description:
      "Different ATS formats are shaped into one consistent job marketplace experience.",
    icon: Sparkles,
  },
  {
    title: "Match",
    description:
      "Search, filters, locations, and salary context help people find the roles worth opening.",
    icon: UsersRound,
  },
  {
    title: "Apply",
    description:
      "Candidates can save, compare, and apply directly while employers manage their pipeline.",
    icon: CheckCircle2,
  },
];

const audiences = [
  {
    title: "For job seekers",
    description:
      "A focused search surface for technology, data, product, security, and platform roles across trusted employers.",
    points: [
      "Search public roles without account friction",
      "Save jobs and manage applications when signed in",
      "Use salary and location context to compare opportunities",
    ],
  },
  {
    title: "For employers",
    description:
      "A modern employer workspace for posting roles, managing candidates, and building a higher-signal hiring funnel.",
    points: [
      "Create and manage job posts from one dashboard",
      "Review applicants, resume profiles, and invites",
      "Use billing, company profile, and hiring tools as the team grows",
    ],
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="bg-hero-gradient">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.82fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <Badge variant="soft" className="mb-5 gap-1.5">
              <Sparkles className="size-3.5 text-accent" />
              About HireGeneral
            </Badge>
            <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-foreground text-balance md:text-7xl">
              A calmer way to search, post, and hire.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              HireGeneral is a modern job marketplace for technology
              professionals and hiring teams. We bring fresh job sources,
              cleaner presentation, and employer workflows into one focused
              experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="xl" asChild>
                <Link href="/jobs">
                  Browse jobs
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link href="/employers">For employers</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/70 bg-background/75 p-6 shadow-lift backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Marketplace pulse
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  Built for fresh signal
                </h2>
              </div>
              <div className="grid size-11 place-items-center rounded-2xl bg-primary-gradient text-primary-foreground shadow-pop">
                <Building2 className="size-5" />
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary">
                      <metric.icon className="size-4" />
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              The goal is simple: less hunting, less duplicate noise, and more
              confidence before anyone clicks apply.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1fr] lg:items-end">
          <div>
            <Badge variant="soft">Our point of view</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
              The best job board feels edited, not endless.
            </h2>
          </div>
          <p className="text-base leading-8 text-muted-foreground md:text-lg">
            Hiring is full of fragmented systems, stale posts, unclear
            locations, and repetitive applications. HireGeneral is being built
            as the calm layer above that complexity, a place where candidates
            can move quickly and employers can show up clearly.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {principles.map((principle) => (
            <article
              key={principle.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft"
            >
              <div className="grid size-11 place-items-center rounded-2xl bg-secondary text-primary">
                <principle.icon className="size-5" />
              </div>
              <h3 className="mt-5 text-xl font-bold tracking-tight">
                {principle.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {principle.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border/70 bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <Badge variant="soft">How it works</Badge>
              <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight md:text-5xl">
                One clean flow from source to application.
              </h2>
            </div>
            <Button variant="outline" asChild>
              <Link href="/contact">Talk to us</Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {operatingModel.map((step, index) => (
              <article
                key={step.title}
                className="rounded-2xl border border-border bg-background p-5 shadow-xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary-gradient text-primary-foreground shadow-pop">
                    <step.icon className="size-4" />
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          {audiences.map((audience) => (
            <article
              key={audience.title}
              className="rounded-[1.75rem] border border-border bg-card p-7 shadow-soft"
            >
              <h2 className="text-2xl font-bold tracking-tight">
                {audience.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {audience.description}
              </p>
              <div className="mt-6 space-y-3">
                {audience.points.map((point) => (
                  <p
                    key={point}
                    className="flex items-start gap-3 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    <span>{point}</span>
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-[2rem] bg-primary-gradient p-8 text-primary-foreground shadow-pop md:p-10">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                We are building the job board we wanted to use.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/80">
                Better sourcing, better presentation, and better employer tools,
                without turning the search into a maze.
              </p>
            </div>
            <Button variant="warm" size="xl" asChild>
              <Link href="/jobs">
                Start searching
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

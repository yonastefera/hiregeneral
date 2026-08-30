import Link from "next/link";
import { BookOpenCheck, CalendarRange, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CareerInsightsData } from "./career-insights-data";
import { CareerSalaryInsight } from "./CareerSalaryInsight";

export function CareerInsightsPage({ data }: { data: CareerInsightsData }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div>
        <p className="text-sm font-semibold text-primary">
          Your career evidence
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">
          Career insights
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Explore your recorded work timeline, adjacent skills, and sourced
          salary context. These insights are informational and remain private to
          you.
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <CalendarRange className="size-5 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-bold tracking-tight">
              Recorded timeline
            </h2>
          </div>
          <p className="mt-4 text-3xl font-bold">{data.history.roleCount}</p>
          <p className="text-sm text-muted-foreground">
            roles with valid dates
          </p>
          <div className="mt-5 rounded-xl bg-muted/50 p-4">
            {data.history.gaps.length ? (
              <p className="text-sm leading-6">
                {data.history.gaps.length} period
                {data.history.gaps.length === 1 ? "" : "s"} of at least two
                months between recorded roles. The longest is approximately{" "}
                {data.history.longestGapMonths} months.
              </p>
            ) : (
              <p className="text-sm leading-6">
                No periods of two months or more were found between your
                recorded roles.
              </p>
            )}
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            This only checks dates you entered. It does not infer why time
            between roles occurred or treat it as negative.
          </p>
        </section>

        <CareerSalaryInsight career={data.career} location={data.location} />
      </div>

      <section className="mt-5 rounded-2xl border border-border bg-surface p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-bold tracking-tight">
            Skills to explore
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Reviewed skills connected to your canonical role that are not
          currently listed on your profile.
        </p>
        {data.skillOpportunities.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.skillOpportunities.map((skill) => (
              <article
                key={skill.skillId}
                className="rounded-xl bg-muted/50 p-4"
              >
                <BookOpenCheck
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
                <h3 className="mt-3 font-semibold">{skill.name}</h3>
                <p className="mt-1 text-xs capitalize text-muted-foreground">
                  {skill.category.replaceAll("-", " ")}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Listed by {skill.activeJobs} active mapped job
                  {skill.activeJobs === 1 ? "" : "s"}.
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
            Add a recognized role headline and skills to your profile to see
            adjacent learning opportunities.
          </p>
        )}
        <Button variant="outline" className="mt-5" asChild>
          <Link href="/profile">Update profile evidence</Link>
        </Button>
      </section>
    </main>
  );
}

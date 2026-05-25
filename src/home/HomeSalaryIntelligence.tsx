import Link from "next/link";
import { ArrowRight, LineChart, TrendingUp } from "lucide-react";

import type { HomeSalaryBand } from "./home-insights";

type HomeSalaryIntelligenceProps = {
  salaryBands: HomeSalaryBand[];
};

export default function HomeSalaryIntelligence({
  salaryBands,
}: HomeSalaryIntelligenceProps) {
  return (
    <section
      id="salaries"
      className="bg-neutral-950 text-neutral-100"
      aria-labelledby="home-salary-heading"
    >
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-teal-300 ring-1 ring-teal-400/20">
              <LineChart className="h-3 w-3" aria-hidden="true" />
              Salary intelligence
            </div>

            <h2
              id="home-salary-heading"
              className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl"
            >
              Negotiate from
              <br />
              <span className="italic text-teal-300">knowledge</span>, not
              assumptions.
            </h2>

            <p className="mt-5 max-w-md text-neutral-400">
              Real compensation data from roles in the marketplace. Updated as
              new salary ranges are published.
            </p>

            <Link
              href="/salaries"
              className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-teal-400 px-6 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              Explore salaries{" "}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/2 backdrop-blur">
              {salaryBands.map((salaryBand, index) => {
                const max = Math.max(...salaryBand.spark);

                return (
                  <article
                    key={salaryBand.role}
                    className={`grid grid-cols-12 items-center gap-4 px-6 py-5 ${
                      index < salaryBands.length - 1
                        ? "border-b border-white/5"
                        : ""
                    }`}
                  >
                    <div className="col-span-12 sm:col-span-5">
                      <h3 className="text-sm font-semibold text-white">
                        {salaryBand.role}
                      </h3>
                      <p className="text-[12px] text-neutral-400">
                        Median 90-day range
                      </p>
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <p className="text-[15px] font-semibold tracking-tight text-white">
                        {salaryBand.range}
                      </p>
                    </div>

                    <div className="col-span-3 sm:col-span-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 ring-1 ring-emerald-400/20">
                        <TrendingUp className="h-3 w-3" aria-hidden="true" />
                        {salaryBand.trend}
                      </span>
                    </div>

                    <div
                      className="col-span-3 flex h-8 items-end justify-end gap-0.5 sm:col-span-2"
                      aria-label={`${salaryBand.role} salary trend`}
                    >
                      {salaryBand.spark.map((value, sparkIndex) => (
                        <span
                          key={sparkIndex}
                          className="w-1.5 rounded-sm bg-linear-to-t from-teal-500 to-teal-300"
                          style={{ height: `${(value / max) * 100}%` }}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

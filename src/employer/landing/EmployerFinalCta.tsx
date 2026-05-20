import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function EmployerFinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="relative overflow-hidden rounded-t-4xl bg-[linear-gradient(135deg,oklch(0.96_0.05_180)_0%,oklch(0.94_0.07_30)_100%)] p-12 sm:p-16">
        <div className="relative grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h3 className="max-w-md text-4xl font-semibold tracking-tight sm:text-5xl">
              Your next hire is one post away.
            </h3>

            <p className="mt-4 max-w-md text-neutral-700">
              Join companies that hire calmly on HireGeneral.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/employers/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Post your first job
              <ArrowUpRight className="size-4" />
            </Link>

            <Link
              href="/contact?topic=employer_sales"
              className="inline-flex items-center rounded-full border border-white bg-white/70 px-6 py-3.5 text-sm font-medium text-neutral-900 backdrop-blur transition hover:bg-white"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

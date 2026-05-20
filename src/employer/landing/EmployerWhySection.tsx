import Link from "next/link";

import { whyHireGeneral } from "./employer-landing-content";

export function EmployerWhySection() {
  return (
    <section id="why" className="bg-neutral-950 text-neutral-100">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="text-xs uppercase tracking-[0.18em] text-teal-400">
            Why employers choose us
          </div>

          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            A modern hiring stack, in one calm surface.
          </h2>

          <p className="mt-4 max-w-md text-neutral-400">
            No clutter, no spam, no resume drowning. Just the tools
            high-performing teams actually use.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <Link
              href="/employers/dashboard"
              className="rounded-full bg-teal-400 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-teal-300"
            >
              Start hiring
            </Link>

            <Link
              href="/contact?topic=employer_sales"
              className="rounded-full border border-white/10 px-5 py-3 text-sm text-neutral-300 hover:text-white"
            >
              Book a demo
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          {whyHireGeneral.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/2 p-6 transition hover:bg-white/[0.05]"
            >
              <feature.icon className="size-5 text-teal-400" />
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-1 text-sm text-neutral-400">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

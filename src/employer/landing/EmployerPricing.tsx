import Link from "next/link";

import { employerLandingIcons, plans } from "./employer-landing-content";

const { CheckCircle2 } = employerLandingIcons;

export function EmployerPricing() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 pb-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-xs uppercase tracking-[0.18em] text-teal-700">
          Pricing
        </div>

        <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Pay for outcomes, not impressions.
        </h2>

        <p className="mt-3 text-neutral-600">
          Flat, predictable pricing. Cancel anytime.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`relative rounded-3xl border p-8 transition ${
              plan.highlight
                ? "border-neutral-950 bg-neutral-950 text-white shadow-[0_30px_80px_-30px_rgba(20,30,50,0.4)]"
                : "border-black/5 bg-white"
            }`}
          >
            {plan.highlight && (
              <span className="absolute right-5 top-5 rounded-full bg-teal-400 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-950">
                Popular
              </span>
            )}

            <h3 className="text-xl font-semibold">{plan.name}</h3>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">
                {plan.price}
              </span>
              <span
                className={`text-sm ${
                  plan.highlight ? "text-neutral-400" : "text-neutral-500"
                }`}
              >
                {plan.cadence}
              </span>
            </div>

            <p
              className={`mt-3 text-sm ${
                plan.highlight ? "text-neutral-400" : "text-neutral-600"
              }`}
            >
              {plan.desc}
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <CheckCircle2
                    className={`size-4 ${
                      plan.highlight ? "text-teal-400" : "text-teal-600"
                    }`}
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={
                plan.name === "Scale"
                  ? "/contact?topic=employer_sales"
                  : "/employers/dashboard"
              }
              className={`mt-8 inline-flex w-full items-center justify-center rounded-full py-3 text-sm font-medium transition ${
                plan.highlight
                  ? "bg-teal-400 text-neutral-950 hover:bg-teal-300"
                  : "bg-neutral-900 text-white hover:bg-neutral-800"
              }`}
            >
              {plan.name === "Scale" ? "Talk to sales" : "Get started"}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

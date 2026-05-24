"use client";

import Link from "next/link";
import { ArrowRight, Minus, Plus } from "lucide-react";
import { useState } from "react";

const principles = [
  {
    n: "01",
    title: "Craft over clutter",
    body: "Every screen is hand-drawn. We obsess over the small things — the kerning of a job title, the hush of a hover state, the rhythm of a list — because those are the things you&apos;ll feel for the next eight hours of your day.",
  },
  {
    n: "02",
    title: "Signal, not noise",
    body: "A predictive ranking model surfaces the candidates worth your time and quietly archives the rest. No inbox to triage. No spam to sift. Your morning starts with a shortlist, not a flood.",
  },
  {
    n: "03",
    title: "Honest economics",
    body: "Flat, predictable pricing. No per-applicant fees, no surge pricing, no upsells dressed as optimizations. You pay for outcomes — closed offers, accepted handshakes — and nothing else.",
  },
  {
    n: "04",
    title: "Built for the long arc",
    body: "Hiring isn&apos;t a sprint. We measure ourselves on a decade — on the engineer who joins your team this Tuesday and is still there at the IPO. Every product decision is graded against that horizon.",
  },
];

const metrics = [
  {
    k: "2.4M",
    v: "Vetted candidates",
    note: "Every profile is human-reviewed before it appears in search.",
  },
  {
    k: "14d",
    v: "Average time-to-hire",
    note: "From open role to signed offer. The industry average is 44 days.",
  },
  {
    k: "92%",
    v: "Offer acceptance",
    note: "When you find the right person, they almost always say yes.",
  },
  {
    k: "−38%",
    v: "Cost per hire",
    note: "Versus equivalent campaigns on legacy boards.",
  },
];

const comparison = [
  { cap: "Curated, vetted candidates", us: true, them: false },
  { cap: "Predictive ranking, no triage", us: true, them: false },
  { cap: "AI co-pilot for outreach", us: true, them: false },
  { cap: "Flat, predictable pricing", us: true, them: false },
  { cap: "Per-applicant fees", us: false, them: true, invert: true },
  { cap: "Endless template spam", us: false, them: true, invert: true },
];

const voices = [
  {
    quote:
      "The first hiring product that feels designed by someone who has actually hired. We closed three senior roles in a month without writing a single sourcing message.",
    who: "Anna Liu",
    role: "Head of People, Linear",
  },
  {
    quote:
      "We replaced three tools and a contractor with HireGeneral. The pipeline is calmer and the candidates are better.",
    who: "Marcus Bell",
    role: "Founder, Stratos Inc",
  },
  {
    quote:
      "It&apos;s the calmest piece of software in our stack. Recruiters fight to use it.",
    who: "Priya Shah",
    role: "VP Talent, Halcyon Health",
  },
];

const faqs = [
  {
    q: "How is HireGeneral different from LinkedIn or Indeed?",
    a: "We&apos;re a curated marketplace, not a database. Every candidate is vetted, every role is hand-published, and the ranking is opinionated. You won&apos;t get a thousand half-fit applicants. You&apos;ll get a shortlist.",
  },
  {
    q: "Do you charge per applicant?",
    a: "Never. Pricing is flat per active job post or per month, depending on your plan. You can talk to as many candidates as you like.",
  },
  {
    q: "What categories of roles work best?",
    a: "We excel at hiring for engineering, design, product, marketing, sales, operations, and customer success — across remote-first teams and modern companies of any size.",
  },
  {
    q: "Can I integrate with my ATS?",
    a: "Yes. We have native integrations with Ashby, Greenhouse, Lever, and Workday, plus an open API on the Scale plan.",
  },
];

export default function WhyUsPage() {
  return (
    <div className="min-h-screen bg-[#0B0F0E] text-neutral-100 antialiased selection:bg-teal-300/40">
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-170 w-275 -translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(45,212,191,0.45), rgba(16,185,129,0.2) 40%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-32 h-105 w-105 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(251,146,60,0.4), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse at center top, black 30%, transparent 75%)",
          }}
        />

        <div className="mx-auto max-w-7xl px-8 pb-28 pt-24 md:pt-36">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-2"></div>

            <div className="col-span-12 md:col-span-10">
              <h1 className="font-serif text-[clamp(3rem,8vw,7.5rem)] font-normal leading-[0.96] tracking-[-0.025em] text-white">
                A calmer
                <br />
                way to{" "}
                <span className="bg-linear-to-br from-teal-300 via-emerald-300 to-orange-300 bg-clip-text italic text-transparent">
                  hire.
                </span>
              </h1>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-5 md:col-start-3">
              <p className="text-[17px] leading-[1.7] text-neutral-300">
                We built HireGeneral for the teams who care how a company is
                made — who believe that the people you hire shape every decision
                that comes after. It is opinionated software, made slowly, with
                taste.
              </p>
            </div>

            <div className="col-span-12 md:col-span-4 md:col-start-9">
              <p className="text-[15px] leading-[1.75] text-neutral-500">
                These pages are an attempt to explain how we think about the
                craft of hiring, and why thousands of modern teams have chosen
                to put their next ten years of growth in our hands.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-linear-to-b from-[#FFF8EF] via-[#FAF5EE] to-[#F4ECDF] text-neutral-950">
        <div className="mx-auto max-w-7xl px-8 py-28">
          <div className="mb-16 flex items-end justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-orange-700">
                The essay · Four principles
              </div>
              <h2 className="mt-5 font-serif text-5xl font-normal leading-[1.05] tracking-tight md:text-6xl">
                Built on convictions,
                <br />
                <span className="italic text-orange-600">not on trends.</span>
              </h2>
            </div>
          </div>

          <div className="space-y-20">
            {principles.map((p, i) => (
              <article key={p.n} className="grid grid-cols-12 gap-8">
                <div className="col-span-12 md:col-span-2">
                  <div className="font-serif text-7xl font-normal leading-none tracking-tight text-orange-500/90">
                    {p.n}
                  </div>
                </div>

                <div className="col-span-12 md:col-span-5">
                  <h3 className="font-serif text-4xl font-normal leading-[1.1] tracking-tight md:text-5xl">
                    {p.title}
                  </h3>
                </div>

                <div className="col-span-12 md:col-span-5">
                  <div className="h-px w-12 bg-orange-500" />
                  <p className="mt-5 text-[16px] leading-[1.75] text-neutral-700">
                    {p.body}
                  </p>
                </div>

                {i < principles.length - 1 && (
                  <div className="col-span-12 mt-8 border-b border-neutral-900/10" />
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-linear-to-br from-emerald-950 via-teal-900 to-emerald-900 text-neutral-100">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-20 h-125 w-125 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, #2dd4bf, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-8 py-28">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-300/15 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-teal-200 ring-1 ring-teal-300/20">
                ◆ Measured outcomes
              </div>

              <h2 className="mt-5 font-serif text-5xl font-normal leading-[1.05] tracking-tight text-white md:text-6xl">
                Slow software,
                <br />
                <span className="italic text-teal-300">fast results.</span>
              </h2>

              <p className="mt-5 max-w-sm text-[14px] leading-[1.7] text-teal-100/70">
                Every number below is a rolling 90-day average across our active
                customer base. We update them each Monday.
              </p>
            </div>

            <div className="col-span-12 grid grid-cols-1 gap-x-10 gap-y-12 md:col-span-8 md:grid-cols-2">
              {metrics.map((m) => (
                <div key={m.v} className="border-t border-teal-300/20 pt-6">
                  <div className="bg-linear-to-br from-white via-teal-100 to-teal-300 bg-clip-text font-serif text-[72px] font-normal leading-none tracking-[-0.02em] text-transparent">
                    {m.k}
                  </div>
                  <div className="mt-4 text-[13px] font-medium uppercase tracking-[0.14em] text-teal-200">
                    {m.v}
                  </div>
                  <p className="mt-2 text-[13px] leading-[1.65] text-teal-100/60">
                    {m.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F5EFE3] text-neutral-950">
        <div className="mx-auto max-w-7xl px-8 py-28">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-2">
              <div className="text-[10px] uppercase tracking-[0.22em] text-orange-700">
                Plate I
              </div>
            </div>

            <div className="col-span-12 md:col-span-10">
              <blockquote className="font-serif text-[clamp(2rem,4.4vw,4rem)] font-normal leading-[1.15] tracking-tight">
                <span className="text-orange-500">“</span>
                Hiring is the most consequential thing a company does. We treat
                the tools for it with the same{" "}
                <span className="italic text-orange-600">reverence</span> as the
                people they help find.
                <span className="text-orange-500">”</span>
              </blockquote>

              <div className="mt-8 flex items-center gap-3 text-[12px] text-neutral-600">
                <span className="h-px w-10 bg-orange-500" />
                <span className="uppercase tracking-[0.18em]">
                  The HireGeneral team
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0B0F0E]">
        <div className="mx-auto max-w-7xl px-8 py-28">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-teal-300 ring-1 ring-teal-400/20">
                The comparison
              </div>
              <h2 className="mt-5 font-serif text-5xl font-normal leading-[1.05] tracking-tight text-white md:text-6xl">
                The new way,
                <br />
                <span className="italic text-teal-300">and the old.</span>
              </h2>
            </div>

            <div className="col-span-12 md:col-span-8">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-white/4 to-white/1">
                <div className="grid grid-cols-12 gap-4 border-b border-white/10 bg-white/3 px-6 py-4 text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                  <div className="col-span-7">Capability</div>
                  <div className="col-span-2 text-center text-teal-300">
                    HireGeneral
                  </div>
                  <div className="col-span-3 text-center">Legacy boards</div>
                </div>

                {comparison.map((row) => (
                  <div
                    key={row.cap}
                    className="grid grid-cols-12 items-center gap-4 border-b border-white/5 px-6 py-5 last:border-b-0"
                  >
                    <div className="col-span-7 text-[15px] text-neutral-200">
                      {row.cap}
                    </div>

                    <div className="col-span-2 flex justify-center">
                      {row.us ? (
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-400/15 ring-1 ring-teal-400/40">
                          <Plus
                            className="h-3.5 w-3.5 text-teal-300"
                            strokeWidth={2.8}
                          />
                        </span>
                      ) : (
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/5">
                          <Minus className="h-3.5 w-3.5 text-neutral-600" />
                        </span>
                      )}
                    </div>

                    <div className="col-span-3 flex justify-center">
                      {row.them ? (
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-orange-500/10 ring-1 ring-orange-500/30">
                          <Plus
                            className="h-3.5 w-3.5 text-orange-400"
                            strokeWidth={2.8}
                          />
                        </span>
                      ) : (
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/5">
                          <Minus className="h-3.5 w-3.5 text-neutral-600" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0B0F0E]">
        <div className="mx-auto max-w-7xl px-8 py-28">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-teal-300">
                The voices
              </div>
              <h2 className="mt-5 font-serif text-4xl font-normal leading-[1.1] tracking-tight text-white md:text-5xl">
                In their <span className="italic text-teal-300">words.</span>
              </h2>
            </div>

            <div className="col-span-12 grid grid-cols-1 gap-5 md:col-span-9 md:grid-cols-3">
              {voices.map((v, i) => {
                const accents = [
                  "from-teal-500/20 to-emerald-500/10 ring-teal-400/20",
                  "from-orange-500/15 to-amber-400/5 ring-orange-400/20",
                  "from-emerald-500/15 to-teal-500/5 ring-emerald-400/20",
                ];

                return (
                  <figure
                    key={v.who}
                    className={`group relative overflow-hidden rounded-2xl bg-linear-to-br ${accents[i]} p-7 ring-1 backdrop-blur transition-transform hover:-translate-y-1`}
                  >
                    <div className="font-serif text-5xl leading-none text-teal-300/70">
                      “
                    </div>
                    <blockquote className="mt-2 font-serif text-[18px] leading-normal text-white">
                      {v.quote}
                    </blockquote>
                    <figcaption className="mt-6 text-[12px]">
                      <div className="font-medium text-white">{v.who}</div>
                      <div className="text-neutral-400">{v.role}</div>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0B0F0E]">
        <div className="mx-auto max-w-7xl px-8 py-28">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-orange-400">
                The fine print
              </div>
              <h2 className="mt-5 font-serif text-5xl font-normal leading-[1.05] tracking-tight text-white md:text-6xl">
                Questions,
                <br />
                <span className="italic text-orange-400">answered.</span>
              </h2>
            </div>

            <div className="col-span-12 md:col-span-8">
              <Faq items={faqs} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-8 pb-32 pt-12">
        <div className="relative overflow-hidden rounded-4xl bg-linear-to-br from-teal-500 via-emerald-600 to-teal-800 p-12 text-white md:p-20">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 -top-40 h-125 w-125 rounded-full bg-orange-400/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />

          <div className="relative">
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 md:col-span-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white ring-1 ring-white/25 backdrop-blur">
                  ◆ One last thing
                </div>

                <h2 className="mt-6 font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-normal leading-[1.05] tracking-tight text-white">
                  Hire calmly.
                  <br />
                  <span className="italic text-orange-200">Build slowly.</span>
                </h2>

                <p className="mt-6 max-w-md text-[15px] leading-[1.75] text-teal-50/90">
                  Post your first role in under ten minutes. We&apos;ll surface
                  a shortlist by Friday.
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-3">
                  <Link
                    href="/employers"
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-6 py-3.5 text-[13px] font-semibold text-emerald-900 shadow-xl shadow-emerald-950/30 transition-transform hover:scale-[1.02]"
                  >
                    Post your first job <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/"
                    className="inline-flex items-center rounded-full px-6 py-3.5 text-[13px] font-medium text-white ring-1 ring-white/30 hover:bg-white/10"
                  >
                    Back to the marketplace
                  </Link>
                </div>
              </div>

              <div className="col-span-12 md:col-span-4">
                <div className="border-l border-white/20 pl-6 text-[12px] leading-[1.7] text-teal-50/80 md:mt-12">
                  <p>
                    Signed,
                    <br />
                    <span className="font-serif text-2xl italic text-orange-200">
                      The HireGeneral team
                    </span>
                  </p>
                  <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-white/60">
                    San Francisco · New York · Atlanta
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/2">
      {items.map((it, i) => {
        const isOpen = open === i;

        return (
          <div key={it.q} className="border-b border-white/5 last:border-b-0">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-6 px-6 py-6 text-left transition-colors hover:bg-white/2"
            >
              <span className="font-serif text-[22px] leading-tight text-white">
                {it.q}
              </span>

              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${
                  isOpen
                    ? "bg-orange-500 text-white"
                    : "bg-white/5 text-white ring-1 ring-white/15"
                }`}
              >
                {isOpen ? (
                  <Minus className="h-3.5 w-3.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </span>
            </button>

            {isOpen && (
              <div className="px-6 pb-7 pr-12 text-[15px] leading-[1.75] text-neutral-300">
                {it.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

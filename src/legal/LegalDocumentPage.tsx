import Link from "next/link";
import { ArrowLeft, CalendarDays, FileText, ShieldCheck } from "lucide-react";

import type { LegalDocument } from "./legal-content";

type LegalDocumentPageProps = {
  document: LegalDocument;
};

export default function LegalDocumentPage({
  document,
}: LegalDocumentPageProps) {
  return (
    <main className="min-h-screen bg-white text-foreground">
      <section className="relative overflow-hidden px-6 pb-14 pt-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-full max-w-5xl -translate-x-1/2 rounded-b-[4rem] bg-[radial-gradient(55%_45%_at_14%_12%,oklch(0.95_0.08_190)_0%,transparent_62%),radial-gradient(42%_36%_at_86%_8%,oklch(0.94_0.08_30)_0%,transparent_60%),linear-gradient(180deg,oklch(0.99_0.01_180)_0%,white_100%)]"
        />

        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to HireGeneral
          </Link>

          <div className="mt-12 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-neutral-950 text-white shadow-lg">
              {document.eyebrow === "Privacy" ? (
                <ShieldCheck className="size-6" />
              ) : (
                <FileText className="size-6" />
              )}
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
              HireGeneral {document.eyebrow}
            </p>

            <h1 className="mt-3 text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
              {document.title}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {document.description}
            </p>

            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm">
              <CalendarDays className="size-4 text-teal-600" />
              Effective date: {document.effectiveDate}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <article className="mx-auto max-w-5xl rounded-4xl border border-black/5 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] sm:p-10 lg:p-14">
          <div className="prose prose-neutral max-w-none prose-headings:tracking-tight prose-h2:mt-12 prose-h2:text-2xl prose-h2:font-semibold prose-p:text-[15px] prose-p:leading-7 prose-p:text-muted-foreground prose-li:text-[15px] prose-li:leading-7 prose-li:text-muted-foreground">
            {document.sections.map((section) => (
              <section key={section.title}>
                <h2 className="flex items-baseline gap-2 my-2">
                  <span className="font-black text-foreground">
                    {section.title.match(/^\d+\./)?.[0]}
                  </span>
                  <span className="font-black text-foreground">
                    {section.title.replace(/^\d+\.\s*/, "")}
                  </span>
                </h2>

                {section.body.map((paragraph) => (
                  <p className="font-thin prose-p:text-[26px]" key={paragraph}>
                    {paragraph}
                  </p>
                ))}

                {section.bullets && (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

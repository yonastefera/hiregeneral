import Link from "next/link";

import { BrandLogo } from "@/components/BrandLogo";
import { footerSections, legalLinks } from "@/data/footerNavigation";

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-[hsl(220_25%_8%)] text-surface-strong-foreground">
      <div className="h-px w-full bg-white/10" />

      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <Link
              href="/"
              aria-label="HireGeneral home"
              className="inline-flex"
            >
              <BrandLogo wordClassName="text-surface-strong-foreground" />
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-surface-strong-foreground/60">
              A modern job marketplace connecting technology professionals with
              hiring teams that move quickly and clearly.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {footerSections.map((section) => (
              <section
                key={section.title}
                aria-labelledby={`${section.title}-footer`}
              >
                <div className="flex items-center gap-2">
                  <section.icon className="size-4 text-surface-strong-foreground/70" />

                  <h2
                    id={`${section.title}-footer`}
                    className="text-xs font-semibold uppercase tracking-wider text-surface-strong-foreground"
                  >
                    {section.title}
                  </h2>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.to}
                        className="-mx-2 inline-block rounded-lg px-2 py-1 text-sm text-surface-strong-foreground/60 transition-colors hover:bg-white/5 hover:text-surface-strong-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm md:flex-row md:items-center md:justify-between">
          <p className="text-xs tracking-wide text-surface-strong-foreground/55">
            © {year} HireGeneral. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.to}
                className="rounded-md px-1.5 py-0.5 text-xs text-surface-strong-foreground/55 transition-colors hover:text-surface-strong-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

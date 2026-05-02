import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { footerSections, legalLinks } from "@/data/footerNavigation";

export const Footer = () => {
  return (
    <footer className="border-t border-primary/20 bg-surface-strong text-surface-strong-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <Link href="/" aria-label="HireGeneral home" className="inline-flex">
              <BrandLogo wordClassName="text-surface-strong-foreground" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-surface-strong-foreground/70">
              A modern job marketplace connecting technology professionals with hiring teams that move quickly and clearly.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {footerSections.map((section) => (
              <section key={section.title} aria-labelledby={`${section.title}-footer`}>
                <div className="flex items-center gap-2">
                  <section.icon className="size-4 text-accent" />
                  <h2 id={`${section.title}-footer`} className="text-sm font-semibold text-surface-strong-foreground">{section.title}</h2>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-surface-strong-foreground/70">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.to} className="transition hover:text-accent">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-surface-strong-foreground/15 pt-6 text-sm text-surface-strong-foreground/70 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} HireGeneral. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <Link key={link.label} href={link.to} className="transition hover:text-accent">{link.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
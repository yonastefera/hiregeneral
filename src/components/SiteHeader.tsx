"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Find jobs", href: "/jobs" },
  { label: "Saved", href: "/saved-jobs" },
  { label: "Salary guide", href: "/salary-guide" },
  { label: "Career advice", href: "/career-advice" },
  { label: "For employers", href: "/employers/dashboard" },
];

type SiteHeaderProps = {
  variant?: "default" | "transparent";
};

export function SiteHeader({ variant = "default" }: SiteHeaderProps) {
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const elevated = variant === "default" || scrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        elevated
          ? "border-b border-border/70 bg-surface/85 shadow-soft backdrop-blur-md supports-[backdrop-filter]:bg-surface/70"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:py-4">
        <Link
          href="/"
          aria-label="HireGeneral home"
          className="flex items-center"
        >
          <BrandLogo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/signin">Sign in</Link>
          </Button>

          <Button variant="hero" asChild>
            <Link href="/signup">Post a job</Link>
          </Button>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="group relative grid size-11 place-items-center rounded-xl border border-border bg-surface/80 text-foreground shadow-soft backdrop-blur transition-all hover:border-primary/40 hover:shadow-lift active:scale-95 md:hidden"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>

          <span className="relative block h-4 w-5">
            <span
              className={cn(
                "absolute left-0 block h-0.5 w-5 rounded-full bg-foreground transition-all duration-300",
                open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
              )}
            />

            <span
              className={cn(
                "absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-1/2 rounded-full bg-foreground transition-all duration-200",
                open ? "opacity-0" : "opacity-100"
              )}
            />

            <span
              className={cn(
                "absolute left-0 block h-0.5 w-5 rounded-full bg-foreground transition-all duration-300",
                open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
              )}
            />
          </span>
        </button>
      </nav>

      {open && (
        <div className="border-t border-border bg-surface md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="glass" asChild>
                <Link href="/signin">Sign in</Link>
              </Button>

              <Button variant="hero" asChild>
                <Link href="/signup">Post a job</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
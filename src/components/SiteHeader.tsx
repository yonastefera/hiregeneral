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
    const onScroll = () => setScrolled(window.scrollY > 4);

    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const elevated = variant === "default" || scrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-200",
        elevated
          ? "border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 md:px-6">
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
                  "relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}

                {active && (
                  <span className="absolute inset-x-3 -bottom-[21px] h-px bg-primary" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/signin">Sign in</Link>
          </Button>

          <Button variant="default" size="sm" asChild>
            <Link href="/signup">Post a job</Link>
          </Button>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="relative grid size-10 place-items-center rounded-md text-foreground transition-colors hover:bg-secondary md:hidden"
        >
          <span className="sr-only">Toggle menu</span>

          <span className="relative block h-3.5 w-5">
            <span
              className={cn(
                "absolute left-0 block h-[1.5px] w-5 rounded-full bg-foreground transition-all duration-300",
                open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
              )}
            />

            <span
              className={cn(
                "absolute left-0 top-1/2 block h-[1.5px] w-5 -translate-y-1/2 rounded-full bg-foreground transition-all duration-200",
                open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"
              )}
            />

            <span
              className={cn(
                "absolute left-0 block h-[1.5px] w-5 rounded-full bg-foreground transition-all duration-300",
                open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
              )}
            />
          </span>
        </button>
      </nav>

      <div
        className={cn(
          "fixed inset-x-0 top-16 z-30 origin-top overflow-hidden border-b border-border bg-background transition-all duration-300 md:hidden",
          open
            ? "max-h-[calc(100vh-4rem)] opacity-100"
            : "pointer-events-none max-h-0 opacity-0"
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
          {navLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ transitionDelay: open ? `${index * 30}ms` : "0ms" }}
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-3 text-base font-medium text-foreground transition-all hover:bg-secondary",
                open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
              )}
            >
              <span>{link.label}</span>
              <span className="text-muted-foreground">→</span>
            </Link>
          ))}

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-4">
            <Button variant="outline" asChild>
              <Link href="/signin">Sign in</Link>
            </Button>

            <Button asChild>
              <Link href="/signup">Post a job</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
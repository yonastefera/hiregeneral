"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bookmark,
  BriefcaseBusiness,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

const HeaderSignOutButton = dynamic(
  () => import("./HeaderSignOutButton").then((mod) => mod.HeaderSignOutButton),
  {
    ssr: false,
  },
);

type SiteHeaderClientProps = {
  user: HeaderUser | null;
  profile: UserProfile | null;
  unreadCount: number;
};

type HeaderUser = {
  id: string;
  email?: string;
};

type UserProfile = {
  full_name: string | null;
  email: string | null;
  user_type: string;
};

type HeaderNavLink = {
  label: string;
  href: string;
  exact?: boolean;
};

const publicNavLinks: HeaderNavLink[] = [
  { label: "Find jobs", href: "/jobs" },
  { label: "Salaries", href: "/salaries" },
  { label: "For employers", href: "/employers", exact: true },
  { label: "Why us", href: "/why-us" },
];

const jobSeekerNavLinks: HeaderNavLink[] = [
  { label: "Saved", href: "/saved" },
  { label: "Messages", href: "/messages" },
  { label: "Profile", href: "/profile" },
];

const recruiterNavLinks: HeaderNavLink[] = [
  { label: "Dashboard", href: "/employers/dashboard" },
];

function isHeaderNavLinkActive(pathname: string, link: HeaderNavLink) {
  if (link.exact) {
    return pathname === link.href;
  }

  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export function SiteHeaderClient({
  user,
  profile,
  unreadCount,
}: SiteHeaderClientProps) {
  const pathname = usePathname();

  const isTransparentHeaderRoute = pathname === "/";
  const shouldTrackScroll = isTransparentHeaderRoute;

  const [scrolled, setScrolled] = useState(pathname !== "/");
  const [open, setOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    if (!shouldTrackScroll) {
      setScrolled(true);
      return;
    }

    let currentScrolled = window.scrollY > 4;
    let ticking = false;

    setScrolled(currentScrolled);

    const updateScrolled = () => {
      const nextScrolled = window.scrollY > 4;

      if (nextScrolled !== currentScrolled) {
        currentScrolled = nextScrolled;
        setScrolled(nextScrolled);
      }

      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(updateScrolled);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [shouldTrackScroll]);

  useEffect(() => {
    setOpen(false);
    setAccountMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "Account";

  const initials = (profile?.full_name || user?.email || "U")
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isJobSeeker = profile?.user_type === "job_seeker";

  const isRecruiter =
    profile?.user_type === "recruiter" || profile?.user_type === "admin";

  const isAuthenticated = Boolean(user && profile);

  const navLinks = useMemo(() => {
    if (!isAuthenticated) return publicNavLinks;

    if (isJobSeeker) {
      return [...publicNavLinks, ...jobSeekerNavLinks];
    }

    if (isRecruiter) {
      return [...publicNavLinks, ...recruiterNavLinks];
    }

    return publicNavLinks;
  }, [isAuthenticated, isJobSeeker, isRecruiter]);

  const elevated = !isTransparentHeaderRoute || scrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        elevated
          ? "border-b border-border/40 bg-background shadow-xs"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto grid h-16 max-w-360 grid-cols-[auto_auto] items-center justify-between gap-4 px-4 md:relative md:grid-cols-[1fr_auto_1fr] md:px-6">
        <Link
          href="/"
          aria-label="HireGeneral home"
          className="flex shrink-0 items-center md:justify-self-start"
        >
          <BrandLogo />
        </Link>

        <div className="hidden items-center gap-0.5 justify-self-center rounded-full border border-border/50 bg-background/40 p-1 backdrop-blur-xl md:flex">
          {navLinks.map((link) => {
            const active = isHeaderNavLinkActive(pathname, link);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 text-sm font-medium tracking-tight transition-colors",
                  active
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center justify-end gap-1 justify-self-end md:absolute md:right-6 md:flex">
          {user ? (
            <>
              {isRecruiter && (
                <Button variant="default" size="sm" asChild>
                  <Link href="/employers/dashboard/post-job">Post a job</Link>
                </Button>
              )}

              {isJobSeeker && (
                <>
                  <IconLink href="/messages" label="Messages">
                    <MessageSquare className="size-4.5" />
                  </IconLink>

                  <IconLink
                    href="/notifications"
                    label="Notifications"
                    badge={unreadCount}
                  >
                    <Bell className="size-4.5" />
                  </IconLink>
                </>
              )}

              <div className="relative">
                <button
                  type="button"
                  aria-label="Profile menu"
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  onClick={() => setAccountMenuOpen((value) => !value)}
                  className="ml-1 grid size-9 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/70"
                >
                  {initials}
                </button>

                {accountMenuOpen && (
                  <button
                    type="button"
                    aria-label="Close account menu"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setAccountMenuOpen(false)}
                  />
                )}

                <div
                  role="menu"
                  className={cn(
                    "absolute right-0 top-full z-20 mt-3 w-60 origin-top-right rounded-xl border border-border/70 bg-background shadow-lift transition-all duration-150",
                    accountMenuOpen
                      ? "translate-y-0 scale-100 opacity-100"
                      : "pointer-events-none -translate-y-1 scale-95 opacity-0",
                  )}
                >
                  <div className="border-b border-border/60 px-4 py-3">
                    <p className="truncate text-sm font-medium text-foreground">
                      {displayName}
                    </p>

                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>

                    <Badge variant="soft" className="mt-1 text-xs capitalize">
                      {profile?.user_type?.replace("_", " ") ?? "account"}
                    </Badge>
                  </div>

                  <div className="p-1">
                    {isJobSeeker && (
                      <>
                        <AccountMenuLink
                          href="/profile"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <UserRound className="size-4 text-muted-foreground" />
                          Profile
                        </AccountMenuLink>

                        <AccountMenuLink
                          href="/saved"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <Bookmark className="size-4 text-muted-foreground" />
                          Saved & applied
                        </AccountMenuLink>

                        <AccountMenuLink
                          href="/messages"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <MessageSquare className="size-4 text-muted-foreground" />
                          Messages
                        </AccountMenuLink>

                        <AccountMenuLink
                          href="/applications"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <BriefcaseBusiness className="size-4 text-muted-foreground" />
                          My applications
                        </AccountMenuLink>
                      </>
                    )}

                    {isRecruiter && (
                      <AccountMenuLink
                        href="/employers/dashboard"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <LayoutDashboard className="size-4 text-muted-foreground" />
                        Dashboard
                      </AccountMenuLink>
                    )}
                  </div>

                  <div className="border-t border-border/60 p-1">
                    <AccountMenuLink
                      href="/account/settings"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <Settings className="size-4 text-muted-foreground" />
                      Account settings
                    </AccountMenuLink>

                    {isJobSeeker && (
                      <>
                        <AccountMenuLink
                          href="/settings/notifications"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <Bell className="size-4 text-muted-foreground" />
                          Notification settings
                        </AccountMenuLink>

                        <AccountMenuLink
                          href="/privacy"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <ShieldCheck className="size-4 text-muted-foreground" />
                          Privacy
                        </AccountMenuLink>
                      </>
                    )}
                  </div>

                  <div className="border-t border-border/60 p-1">
                    <HeaderSignOutButton />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/signin">Sign in</Link>
              </Button>

              <Button variant="default" size="sm" asChild>
                <Link href="/employers">Post a job</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 justify-self-end md:hidden">
          {isJobSeeker && (
            <IconLink
              href="/notifications"
              label="Notifications"
              badge={unreadCount}
            >
              <Bell className="size-4.5" />
            </IconLink>
          )}

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="relative grid size-10 place-items-center rounded-full border border-border/60 bg-background/60 text-foreground backdrop-blur-xl transition-colors hover:bg-secondary"
          >
            <span className="sr-only">Toggle menu</span>

            <span className="relative block h-3.5 w-5">
              <span
                className={cn(
                  "absolute left-0 block h-[1.5px] w-5 rounded-full bg-foreground transition-all duration-300",
                  open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0",
                )}
              />

              <span
                className={cn(
                  "absolute left-0 top-1/2 block h-[1.5px] w-5 -translate-y-1/2 rounded-full bg-foreground transition-all duration-200",
                  open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100",
                )}
              />

              <span
                className={cn(
                  "absolute left-0 block h-[1.5px] w-5 rounded-full bg-foreground transition-all duration-300",
                  open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0",
                )}
              />
            </span>
          </button>
        </div>
      </nav>

      <div
        className={cn(
          "fixed inset-x-0 top-16 z-30 origin-top overflow-hidden border-b border-border bg-background transition-all duration-300 md:hidden",
          open
            ? "max-h-[calc(100vh-4rem)] opacity-100"
            : "pointer-events-none max-h-0 opacity-0",
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
                open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
              )}
            >
              <span>{link.label}</span>
              <span className="text-muted-foreground">→</span>
            </Link>
          ))}

          {isJobSeeker && (
            <>
              <MobileMenuLink href="/messages">
                <span className="inline-flex items-center gap-2">
                  <MessageSquare className="size-4" />
                  Messages
                </span>
              </MobileMenuLink>

              <MobileMenuLink href="/settings/notifications">
                <span className="inline-flex items-center gap-2">
                  <Bell className="size-4" />
                  Notification settings
                </span>
              </MobileMenuLink>

              <MobileMenuLink href="/settings/privacy">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  Privacy
                </span>
              </MobileMenuLink>
            </>
          )}

          {user && (
            <MobileMenuLink href="/account/settings">
              <span className="inline-flex items-center gap-2">
                <Settings className="size-4" />
                Account settings
              </span>
            </MobileMenuLink>
          )}

          <div className="mt-3 border-t border-border pt-4">
            {user ? (
              <div className="flex flex-col gap-2">
                <div className="rounded-md border border-border px-3 py-3">
                  <p className="truncate text-sm font-medium text-foreground">
                    {displayName}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>

                  <Badge variant="soft" className="mt-2 text-xs capitalize">
                    {profile?.user_type?.replace("_", " ") ?? "account"}
                  </Badge>
                </div>

                {isJobSeeker && (
                  <>
                    <Button variant="outline" asChild>
                      <Link href="/profile">Profile</Link>
                    </Button>

                    <Button variant="outline" asChild>
                      <Link href="/saved">Saved & applied</Link>
                    </Button>

                    <Button variant="outline" asChild>
                      <Link href="/applications">My applications</Link>
                    </Button>
                  </>
                )}

                {isRecruiter && (
                  <>
                    <Button variant="outline" asChild>
                      <Link href="/employers/dashboard">Dashboard</Link>
                    </Button>

                    <Button asChild>
                      <Link href="/employers/dashboard/post-job">
                        Post a job
                      </Link>
                    </Button>
                  </>
                )}

                <HeaderSignOutButton />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" asChild>
                  <Link href="/signin">Sign in</Link>
                </Button>

                <Button asChild>
                  <Link href="/employers">Post a job</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function IconLink({
  href,
  label,
  badge,
  children,
}: {
  href: string;
  label: string;
  badge?: number;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {children}

      {badge && badge > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-accent-foreground ring-2 ring-background">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

function AccountMenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
    >
      {children}
    </Link>
  );
}

function MobileMenuLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-secondary"
    >
      {children}
      <span className="text-muted-foreground">→</span>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type NavLinkCompatProps = Omit<
  React.ComponentPropsWithoutRef<typeof Link>,
  "className" | "href"
> & {
  href: string;
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  exact?: boolean;
};

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  (
    {
      className,
      activeClassName,
      pendingClassName,
      href,
      exact = false,
      ...props
    },
    ref
  ) => {
    const pathname = usePathname();

    const isActive = exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(className, isActive && activeClassName)}
        {...props}
      />
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };
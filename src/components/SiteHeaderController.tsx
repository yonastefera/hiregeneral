"use client";

import { usePathname } from "next/navigation";

import { SiteHeader } from "@/components/SiteHeader";

export function SiteHeaderController() {
  const pathname = usePathname();

  const transparentHeaderRoutes = ["/"];

  const variant = transparentHeaderRoutes.includes(pathname)
    ? "transparent"
    : "default";

  return <SiteHeader variant={variant} />;
}

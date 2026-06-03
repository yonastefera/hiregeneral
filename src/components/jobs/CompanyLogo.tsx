"use client";

import Image from "next/image";
import { useState } from "react";

import { logoSrcFromUrl } from "@/lib/logos";
import { cn } from "@/lib/utils";

type CompanyLogoProps = {
  src?: string | null;
  companyName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

function companyInitials(name: string) {
  const words = name
    .replace(/&/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

export default function CompanyLogo({
  src,
  companyName,
  size = "md",
  className,
}: CompanyLogoProps) {
  const [failed, setFailed] = useState(false);

  const proxiedSrc = logoSrcFromUrl(src, size === "lg" ? 128 : 64);

  const sizeClass = {
    sm: "size-10 rounded-xl text-[11px]",
    md: "size-12 rounded-2xl text-xs",
    lg: "size-24 rounded-3xl text-xl",
  }[size];

  const fallback = (
    <div
      className={cn(
        "grid shrink-0 place-items-center bg-teal-50 font-semibold text-teal-800 ring-1 ring-teal-100",
        sizeClass,
        className,
      )}
      aria-label={`${companyName} logo`}
    >
      {companyInitials(companyName)}
    </div>
  );

  if (!proxiedSrc || failed) {
    return fallback;
  }

  return (
    <Image
      src={proxiedSrc}
      alt={`${companyName} logo`}
      width={size === "lg" ? 96 : size === "md" ? 48 : 40}
      height={size === "lg" ? 96 : size === "md" ? 48 : 40}
      className={cn(
        "shrink-0 bg-white object-contain ring-1 ring-black/5",
        sizeClass,
        className,
      )}
      onError={() => setFailed(true)}
    />
  );
}

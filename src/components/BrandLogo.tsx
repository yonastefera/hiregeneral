import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  variant?: "full" | "mark";
  wordClassName?: string;
};

/**
 * HireGeneral brand mark. Pure SVG so it scales crisply and themes via tokens.
 */
export function BrandLogo({
  className,
  variant = "full",
  wordClassName,
}: BrandLogoProps) {
  if (variant === "mark") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        className={cn("size-8", className)}
        role="img"
        aria-label="HireGeneral"
      >
        <defs>
          <linearGradient id="hg-mark-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="11"
          fill="url(#hg-mark-grad)"
        />
        <path
          d="M15 14 V34 M15 24 H27 M27 14 V34"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M33 18 a5.5 5.5 0 1 1 -0.001 0 Z M30 34 q3 -4 6 0"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandLogo variant="mark" className="size-8 shrink-0" />
      <span
        className={cn(
          "text-lg font-bold tracking-tight text-foreground",
          wordClassName,
        )}
      >
        Hire<span className="text-primary">General</span>
      </span>
    </span>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export function JobCardSkeleton() {
  return (
    <article className="rounded-xl border border-border/80 bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <Skeleton className="size-11 rounded-lg" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="size-9 rounded-lg" />
      </div>

      <Skeleton className="mt-4 h-6 w-3/4" />
      <div className="mt-3 flex flex-wrap gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>
    </article>
  );
}

export function FeaturedJobRowSkeleton() {
  return (
    <article className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-5 w-3/4" />
          <div className="mt-3 flex flex-wrap gap-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="mt-3 h-3 w-24" />
        </div>
        <Skeleton className="size-9 rounded-md" />
      </div>
    </article>
  );
}

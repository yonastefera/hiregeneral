import Link from "next/link";

import { PublicJobCard } from "@/components/jobs/PublicJobCard";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toJobCardShape } from "@/lib/jobs/card-shape";
import { cn } from "@/lib/utils";

import {
  buildJobsUrlParams,
  DEFAULT_DISTANCE,
  DEFAULT_POSTED,
  PAGE_SIZE,
  type JobsPageData,
  type JobsSearchState,
} from "./search-options";

type JobsResultsListProps = {
  state: JobsSearchState;
  data: JobsPageData;
};

function getJobsHref(state: JobsSearchState, targetPage?: number) {
  const params = buildJobsUrlParams({
    ...state,
    page: targetPage ?? state.page,
  });

  const queryString = params.toString();

  return queryString ? `/jobs?${queryString}` : "/jobs";
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const nums: (number | "ellipsis")[] = [];
  const windowSize = 1;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      Math.abs(i - currentPage) <= windowSize
    ) {
      nums.push(i);
    } else if (nums[nums.length - 1] !== "ellipsis") {
      nums.push("ellipsis");
    }
  }

  return nums;
}

export function JobsResultsList({ state, data }: JobsResultsListProps) {
  const jobs = data.jobs.map(toJobCardShape);
  const totalJobs = data.totalJobs;
  const newJobs = data.newJobs;
  const totalPages = data.totalPages;
  const currentPage = Math.min(state.page, totalPages);

  const resultStart = totalJobs > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const resultEnd = Math.min(currentPage * PAGE_SIZE, totalJobs);

  const hasActiveFilters =
    Boolean(state.query || state.location) ||
    state.dateFilter !== DEFAULT_POSTED ||
    state.distance !== DEFAULT_DISTANCE;

  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const currentHref = getJobsHref(state);
  const saveHref = `/signin?next=${encodeURIComponent(currentHref)}`;

  return (
    <section
      className="min-w-0 space-y-5"
      aria-labelledby="job-results-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="text-sm text-muted-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            {totalJobs} {totalJobs === 1 ? "job" : "jobs"} found
            {totalJobs > 0 && (
              <>
                {newJobs > 0 && <> ({newJobs} new)</>} · showing{" "}
                <span className="font-medium text-foreground">
                  {resultStart}–{resultEnd}
                </span>
              </>
            )}
          </p>

          <h2
            id="job-results-heading"
            className="text-2xl font-bold tracking-tight"
          >
            Recommended listings
          </h2>
        </div>

        <Button variant="glass" asChild>
          <Link href="/signin" prefetch={false}>
            Save search
          </Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <h3 className="text-lg font-semibold">No matches in your filters</h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Try widening the date range or distance, or clear filters.
          </p>

          {hasActiveFilters && (
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/jobs">Clear filters</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <ul className="min-w-0 space-y-4" aria-label="Job listings">
            {jobs.map((job) => (
              <li key={job.id}>
                <PublicJobCard job={job} saveHref={saveHref} />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav
              className="flex flex-col items-center gap-3 pt-2"
              aria-label="Job results pagination"
            >
              <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-border/70 bg-surface p-2 shadow-xs sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  className="justify-self-start"
                  asChild={currentPage !== 1}
                >
                  {currentPage === 1 ? (
                    <span>Previous</span>
                  ) : (
                    <Link href={getJobsHref(state, currentPage - 1)}>
                      Previous
                    </Link>
                  )}
                </Button>

                <p className="text-xs font-medium text-muted-foreground">
                  Page <span className="text-foreground">{currentPage}</span> of{" "}
                  <span className="text-foreground">{totalPages}</span>
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  className="justify-self-end"
                  asChild={currentPage !== totalPages}
                >
                  {currentPage === totalPages ? (
                    <span>Next</span>
                  ) : (
                    <Link href={getJobsHref(state, currentPage + 1)}>Next</Link>
                  )}
                </Button>
              </div>

              <Pagination className="hidden sm:flex">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={
                        currentPage === 1
                          ? getJobsHref(state, 1)
                          : getJobsHref(state, currentPage - 1)
                      }
                      aria-disabled={currentPage === 1}
                      tabIndex={currentPage === 1 ? -1 : undefined}
                      className={cn(
                        currentPage === 1 && "pointer-events-none opacity-50",
                      )}
                    />
                  </PaginationItem>

                  {pageNumbers.map((pageNumber, index) => (
                    <PaginationItem key={`${pageNumber}-${index}`}>
                      {pageNumber === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href={getJobsHref(state, pageNumber)}
                          isActive={pageNumber === currentPage}
                          aria-current={
                            pageNumber === currentPage ? "page" : undefined
                          }
                        >
                          {pageNumber}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href={
                        currentPage === totalPages
                          ? getJobsHref(state, totalPages)
                          : getJobsHref(state, currentPage + 1)
                      }
                      aria-disabled={currentPage === totalPages}
                      tabIndex={currentPage === totalPages ? -1 : undefined}
                      className={cn(
                        currentPage === totalPages &&
                          "pointer-events-none opacity-50",
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <p className="hidden text-xs text-muted-foreground sm:block">
                Page {currentPage} of {totalPages}
              </p>
            </nav>
          )}
        </>
      )}
    </section>
  );
}

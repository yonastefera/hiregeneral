"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { EmployerJobsPageData } from "./employer-jobs-data";
import { JobsTable } from "./JobsTable";
import { JobsToolbar } from "./JobsToolbar";
import { type JobTab } from "./jobs-content";

type JobsPageProps = {
  initialData: EmployerJobsPageData;
};

export function JobsPage({ initialData }: JobsPageProps) {
  const [activeTab, setActiveTab] = useState<JobTab>("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(initialData.pagination.page || 1);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstLoadRef = useRef(true);

  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(
      async () => {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(data.pagination.pageSize),
          status: activeTab,
        });

        if (query.trim()) {
          params.set("query", query.trim());
        }

        try {
          const response = await fetch(`/api/employers/jobs?${params}`, {
            signal: controller.signal,
          });

          const payload = (await response.json()) as
            | EmployerJobsPageData
            | { error?: string };

          if (!response.ok) {
            throw new Error(
              "error" in payload && payload.error
                ? payload.error
                : "Could not load jobs.",
            );
          }

          setData(payload as EmployerJobsPageData);
        } catch (fetchError) {
          if (
            fetchError instanceof DOMException &&
            fetchError.name === "AbortError"
          ) {
            return;
          }

          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Could not load jobs.",
          );
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      },
      query.trim() ? 250 : 0,
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activeTab, data.pagination.pageSize, page, query]);

  const setTab = (tab: JobTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const setSearchQuery = (nextQuery: string) => {
    setQuery(nextQuery);
    setPage(1);
  };

  const showingStart =
    data.pagination.total === 0
      ? 0
      : (data.pagination.page - 1) * data.pagination.pageSize + 1;
  const showingEnd = Math.min(
    data.pagination.total,
    data.pagination.page * data.pagination.pageSize,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Jobs</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            All your posted, drafted and closed roles.
          </p>
        </div>

        <Link
          href="/employers/dashboard/post-job"
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-teal-500 to-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition-transform hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          Post another job
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white">
        <JobsToolbar
          activeTab={activeTab}
          query={query}
          totals={data.totals}
          onActiveTabChange={setTab}
          onQueryChange={setSearchQuery}
        />

        {error ? (
          <div className="border-t border-neutral-100 px-5 py-3 text-sm text-rose-600">
            {error}
          </div>
        ) : null}

        <div className={loading ? "opacity-60 transition-opacity" : undefined}>
          <JobsTable jobs={data.jobs} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-5 py-3 text-[12px] text-neutral-500">
          <span>
            {data.pagination.total > 0
              ? `Showing ${showingStart}-${showingEnd} of ${data.pagination.total}`
              : "No jobs found"}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || data.pagination.page <= 1}
              onClick={() =>
                setPage((currentPage) => Math.max(1, currentPage - 1))
              }
              className="rounded-lg border border-neutral-200 px-3 py-1.5 font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Previous
            </button>
            <span>
              Page {data.pagination.page} of{" "}
              {Math.max(1, data.pagination.totalPages)}
            </span>
            <button
              type="button"
              disabled={
                loading ||
                data.pagination.totalPages === 0 ||
                data.pagination.page >= data.pagination.totalPages
              }
              onClick={() =>
                setPage((currentPage) =>
                  Math.min(data.pagination.totalPages, currentPage + 1),
                )
              }
              className="rounded-lg border border-neutral-200 px-3 py-1.5 font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

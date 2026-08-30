"use client";

import { useState } from "react";
import { Braces, Download, FileSpreadsheet, ShieldCheck } from "lucide-react";

import type { CandidateJobFilter } from "@/employer/dashboard/candidates/candidates-content";

type IntegrationsPageProps = {
  canExport: boolean;
  jobFilters: CandidateJobFilter[];
};

export function IntegrationsPage({
  canExport,
  jobFilters,
}: IntegrationsPageProps) {
  const [jobId, setJobId] = useState("all");

  function exportHref(format: "csv" | "json") {
    return `/api/employers/exports/applications?${new URLSearchParams({ format, jobId })}`;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">
          Integrations & exports
        </h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Move your hiring data into an ATS or your internal reporting tools.
        </p>
      </div>

      {!canExport ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Company owner or administrator access is required to export candidate
          data.
        </div>
      ) : null}

      <section
        className={`rounded-2xl bg-white p-5 ${canExport ? "" : "pointer-events-none opacity-50"}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Application export</h2>
            <p className="mt-1 max-w-2xl text-sm text-neutral-500">
              Download a portable, versioned dataset. CSV works with spreadsheet
              imports; JSON provides a stable boundary for custom ATS
              connectors.
            </p>
          </div>

          <select
            value={jobId}
            onChange={(event) => setJobId(event.target.value)}
            className="h-10 min-w-56 rounded-lg bg-neutral-50 px-3 text-[13px] outline-none transition focus:bg-white focus:ring-2 focus:ring-emerald-400/40"
            aria-label="Choose jobs to export"
          >
            {jobFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <a
            href={exportHref("csv")}
            tabIndex={canExport ? undefined : -1}
            className="group rounded-xl border border-neutral-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40"
          >
            <div className="flex items-start justify-between gap-4">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              <Download className="h-4 w-4 text-neutral-400 group-hover:text-emerald-600" />
            </div>
            <h3 className="mt-5 text-sm font-semibold">CSV interchange</h3>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              UTF-8 CSV with protected spreadsheet cells and consistent columns.
            </p>
          </a>

          <a
            href={exportHref("json")}
            tabIndex={canExport ? undefined : -1}
            className="group rounded-xl border border-neutral-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40"
          >
            <div className="flex items-start justify-between gap-4">
              <Braces className="h-5 w-5 text-emerald-600" />
              <Download className="h-4 w-4 text-neutral-400 group-hover:text-emerald-600" />
            </div>
            <h3 className="mt-5 text-sm font-semibold">JSON interchange</h3>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Versioned structured data for internal tools and connector
              scripts.
            </p>
          </a>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div>
            <h2 className="text-sm font-semibold text-emerald-950">
              Secure by default
            </h2>
            <p className="mt-1 text-xs leading-5 text-emerald-900/70">
              Only company owners and administrators can export. Downloads are
              rate-limited, never cached, capped at 5,000 applications, and
              recorded in the security audit log. Resume files and demographic
              data are excluded.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

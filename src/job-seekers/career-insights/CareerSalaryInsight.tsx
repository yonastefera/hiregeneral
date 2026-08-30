"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeDollarSign, ExternalLink } from "lucide-react";

type SalaryPayload = {
  source?: "bls_oews" | "hiregeneral" | "benchmark";
  dataSource?: string;
  confidence?: string;
  range?: {
    formattedLow?: string | null;
    formattedMedian?: string | null;
    formattedHigh?: string | null;
  };
  bls?: { sourceUrl?: string } | null;
};

export function CareerSalaryInsight({
  career,
  location,
}: {
  career: string;
  location: string;
}) {
  const [data, setData] = useState<SalaryPayload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!career) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ career, location });
    void fetch(`/api/salaries?${params}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Salary insight unavailable");
        setData((await response.json()) as SalaryPayload);
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setFailed(true);
        }
      });
    return () => controller.abort();
  }, [career, location]);

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-soft">
      <div className="flex items-center gap-2">
        <BadgeDollarSign className="size-5 text-primary" aria-hidden="true" />
        <h2 className="text-xl font-bold tracking-tight">Salary context</h2>
      </div>

      {!career ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Add a profile headline to receive occupation-specific salary context.{" "}
          <Link href="/profile" className="font-medium text-primary underline">
            Update profile
          </Link>
        </p>
      ) : failed ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Salary context is temporarily unavailable. You can still use the{" "}
          <Link href="/salaries" className="font-medium text-primary underline">
            salary explorer
          </Link>
          .
        </p>
      ) : data?.source === "benchmark" ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          There is not enough sourced salary evidence for this profile yet. Use
          the{" "}
          <Link href="/salaries" className="font-medium text-primary underline">
            salary explorer
          </Link>{" "}
          to try a broader occupation or location.
        </p>
      ) : data?.range ? (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            {career}
            {location ? ` · ${location}` : ""}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight">
            {data.range.formattedMedian ?? "Not available"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.range.formattedLow ?? "—"}–{data.range.formattedHigh ?? "—"}
          </p>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Source: {data.dataSource ?? "available benchmark data"}. This is
            market context, not a compensation promise.
          </p>
          {data.bls?.sourceUrl ? (
            <a
              href={data.bls.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary underline"
            >
              View source <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Loading salary context…
        </p>
      )}
    </section>
  );
}

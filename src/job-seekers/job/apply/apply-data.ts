import "server-only";

import { headers } from "next/headers";

import type { Job } from "@/lib/db/types";
import { cleanJob } from "./apply-utils";

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host");

  if (!host) return null;

  const protocol =
    headersList.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "development" ? "http" : "https");

  return `${protocol}://${host}`;
}

export async function getApplyJobData(jobId: string) {
  const baseUrl = await getBaseUrl();

  if (!baseUrl) return null;

  try {
    const response = await fetch(`${baseUrl}/api/jobs/${jobId}`, {
      next: {
        revalidate: 60,
        tags: [`job:${jobId}`],
      },
    });

    if (!response.ok) return null;

    const job = (await response.json()) as Job;

    return cleanJob(job);
  } catch {
    return null;
  }
}

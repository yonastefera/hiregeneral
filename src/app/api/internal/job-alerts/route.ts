import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { sendJobAlertEmail } from "@/lib/email/send";
import { logServerError } from "@/lib/http/api-security";
import {
  matchesSavedSearch,
  type AlertJob,
  type AlertSearch,
} from "@/lib/saved-searches/matching";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEARCH_BATCH_SIZE = 20;
const JOB_CANDIDATE_LIMIT = 100;
const EMAIL_JOB_LIMIT = 6;

type SavedSearchRow = AlertSearch & {
  alert_frequency: "daily" | "weekly";
  id: string;
  last_alerted_at: string | null;
  name: string;
  posted_days: number;
  user_id: string;
};

type AlertJobRow = AlertJob & {
  id: string;
  posted_at: string;
  salary_currency: string | null;
  salary_max: number | null;
  salary_min: number | null;
  slug: string;
};

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || !authorization?.startsWith("Bearer ")) return false;

  const provided = Buffer.from(authorization.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}

function due(search: SavedSearchRow, now: number) {
  if (!search.last_alerted_at) return true;
  const elapsed = now - new Date(search.last_alerted_at).getTime();
  const interval =
    search.alert_frequency === "daily" ? 86_400_000 : 604_800_000;
  return elapsed >= interval;
}

function salaryLabel(job: AlertJobRow) {
  if (job.salary_min === null && job.salary_max === null) return null;
  const currency = job.salary_currency || "USD";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  if (job.salary_min !== null && job.salary_max !== null) {
    return `${formatter.format(job.salary_min)}–${formatter.format(job.salary_max)}`;
  }
  return formatter.format(job.salary_min ?? job.salary_max ?? 0);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const now = Date.now();
  const { data: searchRows, error: searchesError } = await admin
    .from("saved_searches")
    .select(
      "id, user_id, name, query, location, posted_days, work_mode, easy_apply, alert_frequency, last_alerted_at",
    )
    .neq("alert_frequency", "off")
    .order("last_alerted_at", { ascending: true, nullsFirst: true })
    .limit(SEARCH_BATCH_SIZE);

  if (searchesError) {
    logServerError("job_alert_searches_load_failed", searchesError);
    return NextResponse.json(
      { error: "Could not process job alerts." },
      { status: 500 },
    );
  }

  let sent = 0;
  let failed = 0;
  for (const search of (searchRows ?? []) as SavedSearchRow[]) {
    if (!due(search, now)) continue;

    try {
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("email, full_name, notification_preferences")
        .eq("user_id", search.user_id)
        .maybeSingle();
      if (profileError) throw profileError;

      const preferences = profile?.notification_preferences as {
        jobAlerts?: boolean;
      } | null;
      if (!profile?.email || preferences?.jobAlerts === false) continue;

      const earliest = Math.max(
        now - search.posted_days * 86_400_000,
        search.last_alerted_at ? new Date(search.last_alerted_at).getTime() : 0,
      );
      const { data: jobRows, error: jobsError } = await admin
        .from("jobs")
        .select(
          "id, slug, title, company_name, description, location, work_mode, category, skills, apply_url, posted_at, salary_min, salary_max, salary_currency",
        )
        .eq("status", "published")
        .gte("posted_at", new Date(earliest).toISOString())
        .order("posted_at", { ascending: false })
        .limit(JOB_CANDIDATE_LIMIT);
      if (jobsError) throw jobsError;

      const matches = ((jobRows ?? []) as AlertJobRow[]).filter((job) =>
        matchesSavedSearch(search, job),
      );
      if (!matches.length) {
        await admin
          .from("saved_searches")
          .update({ last_alerted_at: new Date(now).toISOString() })
          .eq("id", search.id);
        continue;
      }

      const ids = matches.map((job) => job.id);
      const { data: deliveredRows, error: deliveredError } = await admin
        .from("saved_search_alert_jobs")
        .select("job_id")
        .eq("saved_search_id", search.id)
        .in("job_id", ids);
      if (deliveredError) throw deliveredError;
      const delivered = new Set((deliveredRows ?? []).map((row) => row.job_id));
      const newMatches = matches
        .filter((job) => !delivered.has(job.id))
        .slice(0, EMAIL_JOB_LIMIT);

      if (newMatches.length) {
        const appUrl = (
          process.env.NEXT_PUBLIC_APP_URL ?? "https://www.hiregeneral.com"
        ).replace(/\/$/, "");
        await sendJobAlertEmail({
          to: profile.email,
          fullName: profile.full_name ?? undefined,
          alertTitle: `${newMatches.length} new ${newMatches.length === 1 ? "role" : "roles"} for ${search.name}`,
          searchLabel: search.query || search.name,
          locationLabel: search.location || undefined,
          jobsUrl: `${appUrl}/jobs`,
          manageAlertsUrl: `${appUrl}/settings/notifications`,
          jobs: newMatches.map((job) => ({
            title: job.title,
            companyName: job.company_name,
            location: job.location,
            workMode: job.work_mode,
            salaryLabel: salaryLabel(job),
            url: `${appUrl}/jobs/${job.slug}`,
          })),
        });
        const { error: historyError } = await admin
          .from("saved_search_alert_jobs")
          .upsert(
            newMatches.map((job) => ({
              saved_search_id: search.id,
              job_id: job.id,
            })),
            { onConflict: "saved_search_id,job_id", ignoreDuplicates: true },
          );
        if (historyError) throw historyError;
        sent += 1;
      }

      const { error: updateError } = await admin
        .from("saved_searches")
        .update({ last_alerted_at: new Date(now).toISOString() })
        .eq("id", search.id);
      if (updateError) throw updateError;
    } catch (error) {
      failed += 1;
      logServerError("job_alert_delivery_failed", error);
    }
  }

  return NextResponse.json({
    processed: searchRows?.length ?? 0,
    sent,
    failed,
  });
}

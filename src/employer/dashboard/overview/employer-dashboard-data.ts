import { Briefcase, Clock3, FileText, Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { loadEmployerEntitlements } from "@/lib/billing/entitlements";

import {
  getEmployerJobsPage,
  type EmployerJobsPageData,
} from "../jobs/employer-jobs-data";
import type { RecentActivity } from "./dashboard-overview-content";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type EmployerActivityRow = {
  id: string;
  applicant_full_name: string | null;
  applicant_email: string | null;
  created_at: string;
  jobs:
    | {
        title: string;
        recruiter_id: string;
      }
    | {
        title: string;
        recruiter_id: string;
      }[]
    | null;
};

export type EmployerDashboardData = {
  premiumAnalytics: boolean;
  jobs: EmployerJobsPageData["jobs"];
  stats: {
    label: string;
    value: string;
    change?: string;
    changeTone?: "positive" | "negative";
    icon: typeof Briefcase;
  }[];
  recentActivity: RecentActivity[];
  analytics: EmployerHiringAnalytics;
};

export type EmployerHiringAnalytics = {
  days: number;
  applications: number;
  previousApplications: number;
  averageFirstResponseHours: number | null;
  funnel: {
    applied: number;
    reviewed: number;
    interviewed: number;
    offered: number;
    rejected: number;
  };
  dailyApplications: { date: string; applications: number }[];
  jobPerformance: {
    jobId: string;
    title: string;
    applications: number;
    interviews: number;
    offers: number;
  }[];
};

const emptyAnalytics: EmployerHiringAnalytics = {
  days: 30,
  applications: 0,
  previousApplications: 0,
  averageFirstResponseHours: null,
  funnel: { applied: 0, reviewed: 0, interviewed: 0, offered: 0, rejected: 0 },
  dailyApplications: [],
  jobPerformance: [],
};

async function loadHiringAnalytics(supabase: SupabaseServerClient) {
  const { data, error } = await supabase.rpc("employer_hiring_analytics", {
    p_days: 30,
  });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    if (error) console.error("[loadEmployerHiringAnalytics]", error);
    return emptyAnalytics;
  }
  return { ...emptyAnalytics, ...(data as unknown as EmployerHiringAnalytics) };
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function relativeTime(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) return "Recently";

  const diff = Date.now() - timestamp;
  const minutes = Math.max(1, Math.floor(diff / 60_000));

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";

  return `${days}d ago`;
}

async function loadRecentActivity(
  supabase: SupabaseServerClient,
  recruiterId: string,
) {
  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      id,
      applicant_full_name,
      applicant_email,
      created_at,
      jobs!inner(title, recruiter_id)
    `,
    )
    .eq("jobs.recruiter_id", recruiterId)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("[loadRecentActivity]", error);
    return [];
  }

  return ((data ?? []) as EmployerActivityRow[]).map((activity) => {
    const job = Array.isArray(activity.jobs) ? activity.jobs[0] : activity.jobs;
    const candidate =
      activity.applicant_full_name || activity.applicant_email || "A candidate";

    return {
      premiumAnalytics: false,
      name: candidate,
      description: `applied to ${job?.title ?? "a role"}`,
      time: relativeTime(activity.created_at),
    };
  });
}

export async function getEmployerDashboardData(): Promise<EmployerDashboardData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      premiumAnalytics: false,
      jobs: [],
      stats: [
        { label: "Published jobs", value: "0", icon: Briefcase },
        { label: "Draft jobs", value: "0", icon: FileText },
        { label: "Applications", value: "0", icon: Users },
        { label: "Avg. first response", value: "—", icon: Clock3 },
      ],
      recentActivity: [],
      analytics: emptyAnalytics,
    };
  }

  const [jobsResult, activity, entitlements, analytics] = await Promise.all([
    getEmployerJobsPage({
      supabase,
      recruiterId: user.id,
      page: 1,
      pageSize: 4,
      status: "All",
    }),
    loadRecentActivity(supabase, user.id),
    loadEmployerEntitlements(supabase),
    loadHiringAnalytics(supabase),
  ]);
  const totals = jobsResult.data.totals;
  const applicationChange = analytics.previousApplications
    ? Math.round(
        ((analytics.applications - analytics.previousApplications) /
          analytics.previousApplications) *
          100,
      )
    : null;

  return {
    premiumAnalytics: entitlements.premiumAnalytics,
    jobs: jobsResult.data.jobs,
    stats: [
      {
        label: "Published jobs",
        value: compactNumber(totals.active),
        icon: Briefcase,
      },
      {
        label: "Draft jobs",
        value: compactNumber(totals.draft),
        icon: FileText,
      },
      {
        label: "Applications",
        value: compactNumber(analytics.applications),
        change:
          applicationChange === null
            ? undefined
            : `${applicationChange >= 0 ? "+" : ""}${applicationChange}%`,
        changeTone:
          applicationChange !== null && applicationChange < 0
            ? "negative"
            : "positive",
        icon: Users,
      },
      {
        label: "Avg. first response",
        value:
          analytics.averageFirstResponseHours === null
            ? "—"
            : `${analytics.averageFirstResponseHours}h`,
        icon: Clock3,
      },
    ],
    recentActivity: activity,
    analytics,
  };
}

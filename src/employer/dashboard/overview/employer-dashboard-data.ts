import { Briefcase, Eye, FileText, Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

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
  jobs: EmployerJobsPageData["jobs"];
  stats: {
    label: string;
    value: string;
    change?: string;
    changeTone?: "positive" | "negative";
    icon: typeof Briefcase;
  }[];
  recentActivity: RecentActivity[];
};

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
      name: candidate,
      description: `applied to ${job?.title ?? "a role"}`,
      time: relativeTime(activity.created_at),
    };
  });
}

async function countApplications(
  supabase: SupabaseServerClient,
  recruiterId: string,
) {
  const { count, error } = await supabase
    .from("applications")
    .select("id, jobs!inner(recruiter_id)", {
      count: "exact",
      head: true,
    })
    .eq("jobs.recruiter_id", recruiterId);

  if (error) {
    console.error("[countApplications]", error);
    return 0;
  }

  return count ?? 0;
}

export async function getEmployerDashboardData(): Promise<EmployerDashboardData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      jobs: [],
      stats: [
        { label: "Published jobs", value: "0", icon: Briefcase },
        { label: "Draft jobs", value: "0", icon: FileText },
        { label: "Applications", value: "0", icon: Users },
        { label: "Job views", value: "0", icon: Eye },
      ],
      recentActivity: [],
    };
  }

  const [jobsResult, activity, applicationCount] = await Promise.all([
    getEmployerJobsPage({
      supabase,
      recruiterId: user.id,
      page: 1,
      pageSize: 4,
      status: "All",
    }),
    loadRecentActivity(supabase, user.id),
    countApplications(supabase, user.id),
  ]);
  const totals = jobsResult.data.totals;

  return {
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
        value: compactNumber(applicationCount),
        icon: Users,
      },
      {
        label: "Job views",
        value: "0",
        icon: Eye,
      },
    ],
    recentActivity: activity,
  };
}

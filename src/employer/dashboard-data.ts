// import { createClient } from "@/lib/supabase/server";

// export type EmployerDashboardStats = {
//   activeJobs: number;
//   draftJobs: number;
//   applications: number;
//   companies: number;
// };

// export type EmployerDashboardJob = {
//   id: string;
//   title: string;
//   companyName: string;
//   location: string;
//   status: string;
//   postedAt: string;
//   applications: number;
// };

// export type EmployerDashboardData = {
//   displayName: string;
//   stats: EmployerDashboardStats;
//   jobs: EmployerDashboardJob[];
//   error: string | null;
// };

// type JobRow = {
//   id: string;
//   title: string;
//   company_name: string;
//   location: string;
//   status: string;
//   posted_at: string;
// };

// type ApplicationRow = {
//   job_id: string | null;
// };

// export async function getEmployerDashboardData(): Promise<EmployerDashboardData> {
//   const supabase = await createClient();
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) {
//     return {
//       displayName: "Employer",
//       stats: { activeJobs: 0, draftJobs: 0, applications: 0, companies: 0 },
//       jobs: [],
//       error: null,
//     };
//   }

//   const [profileResult, companiesResult, jobsResult, applicationsResult] =
//     await Promise.all([
//       supabase
//         .from("profiles")
//         .select("full_name, email")
//         .eq("user_id", user.id)
//         .maybeSingle(),
//       supabase
//         .from("companies")
//         .select("id", { count: "exact", head: true })
//         .eq("owner_id", user.id),
//       supabase
//         .from("jobs")
//         .select("id, title, company_name, location, status, posted_at")
//         .eq("recruiter_id", user.id)
//         .order("posted_at", { ascending: false })
//         .limit(6),
//       supabase
//         .from("applications")
//         .select("job_id, jobs!inner(recruiter_id)")
//         .eq("jobs.recruiter_id", user.id),
//     ]);

//   const jobs = ((jobsResult.data ?? []) as JobRow[]).map((job) => ({
//     id: job.id,
//     title: job.title,
//     companyName: job.company_name,
//     location: job.location,
//     status: job.status,
//     postedAt: job.posted_at,
//     applications: 0,
//   }));

//   const applications = (applicationsResult.data ?? []) as ApplicationRow[];
//   const applicationCounts = applications.reduce<Record<string, number>>(
//     (counts, application) => {
//       if (!application.job_id) return counts;
//       counts[application.job_id] = (counts[application.job_id] ?? 0) + 1;
//       return counts;
//     },
//     {},
//   );

//   const jobsWithApplications = jobs.map((job) => ({
//     ...job,
//     applications: applicationCounts[job.id] ?? 0,
//   }));

//   const activeJobs = jobsWithApplications.filter(
//     (job) => job.status === "published",
//   ).length;
//   const draftJobs = jobsWithApplications.filter(
//     (job) => job.status !== "published",
//   ).length;
//   const profile = profileResult.data;

//   return {
//     displayName:
//       profile?.full_name ||
//       profile?.email ||
//       user.email?.split("@")[0] ||
//       "Employer",
//     stats: {
//       activeJobs,
//       draftJobs,
//       applications: applications.length,
//       companies: companiesResult.count ?? 0,
//     },
//     jobs: jobsWithApplications,
//     error:
//       jobsResult.error?.message ??
//       applicationsResult.error?.message ??
//       companiesResult.error?.message ??
//       null,
//   };
// }

import JobSeekerDashboard from "@/job-seekers/dashboard/JobSeekerDashboard";
import { getJobSeekerDashboardData } from "@/job-seekers/dashboard/job-seeker-dashboard-data";
import {
  getJobSeekerDashboardPageSchema,
  jobSeekerDashboardMetadata,
} from "@/job-seekers/dashboard/job-seeker-dashboard-metadata";

export const metadata = jobSeekerDashboardMetadata;

export default async function JobSeekerDashboardRoute() {
  const { stats, jobs, statsError, jobsError, initialLocation } =
    await getJobSeekerDashboardData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getJobSeekerDashboardPageSchema(stats)),
        }}
      />

      <JobSeekerDashboard
        initialStats={stats}
        initialJobs={jobs}
        initialStatsError={statsError}
        initialJobsError={jobsError}
        initialLocation={initialLocation}
      />
    </>
  );
}

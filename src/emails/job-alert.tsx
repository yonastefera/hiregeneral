import {
  Divider,
  EmailEyebrow,
  EmailHeading,
  EmailShell,
  EmailSmallText,
  EmailText,
  JobAlertCard,
  PrimaryButton,
  SoftPanel,
} from "./shared";

export type JobAlertEmailJob = {
  companyName: string;
  location?: string | null;
  salaryLabel?: string | null;
  title: string;
  url?: string | null;
  workMode?: string | null;
};

interface JobAlertEmailProps {
  alertTitle?: string;
  fullName?: string;
  jobs: JobAlertEmailJob[];
  jobsUrl?: string;
  locationLabel?: string;
  manageAlertsUrl?: string;
  searchLabel?: string;
}

export default function JobAlertEmail({
  alertTitle = "New roles for you",
  fullName,
  jobs,
  jobsUrl = "https://hiregeneral.com/jobs",
  locationLabel,
  manageAlertsUrl = "https://hiregeneral.com/job-seeker/settings/notifications",
  searchLabel,
}: JobAlertEmailProps) {
  const visibleJobs = jobs.slice(0, 6);

  return (
    <EmailShell preview={`${visibleJobs.length} new roles from HireGeneral`}>
      <EmailEyebrow>Job alert</EmailEyebrow>
      <EmailHeading>{alertTitle}</EmailHeading>

      <EmailText>Hi {fullName ?? "there"},</EmailText>
      <EmailText>
        We found fresh roles that match your signal
        {searchLabel ? ` for ${searchLabel}` : ""}
        {locationLabel ? ` near ${locationLabel}` : ""}.
      </EmailText>

      <SoftPanel>
        <EmailSmallText>
          Showing the strongest matches first. You can tune or pause alerts
          anytime from notification settings.
        </EmailSmallText>
      </SoftPanel>

      {visibleJobs.map((job) => (
        <JobAlertCard
          key={`${job.companyName}-${job.title}-${job.url ?? ""}`}
          companyName={job.companyName}
          href={job.url}
          location={job.location}
          salaryLabel={job.salaryLabel}
          title={job.title}
          workMode={job.workMode}
        />
      ))}

      <PrimaryButton href={jobsUrl}>See all matching jobs</PrimaryButton>

      <Divider />

      <EmailSmallText>
        This alert was sent by HireGeneral because job alerts are enabled for
        your account. Manage alerts here: {manageAlertsUrl}
      </EmailSmallText>
    </EmailShell>
  );
}

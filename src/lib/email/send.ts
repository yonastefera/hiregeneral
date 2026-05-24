import { Resend } from "resend";
import { render } from "@react-email/components";
import ConfirmEmail from "@/emails/confirm-email";
import ResetPassword from "@/emails/reset-password";
import ApplicationConfirmation from "@/emails/application-confirmation";
import JobAlertEmail, { type JobAlertEmailJob } from "@/emails/job-alert";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "HireGeneral <no-reply@hiregeneral.com>";

export async function sendConfirmationEmail(params: {
  to: string;
  confirmUrl: string;
  fullName?: string;
}) {
  const html = await render(
    ConfirmEmail({ confirmUrl: params.confirmUrl, fullName: params.fullName }),
  );
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: "Confirm your HireGeneral account",
    html,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
  fullName?: string;
}) {
  const html = await render(
    ResetPassword({ resetUrl: params.resetUrl, fullName: params.fullName }),
  );
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: "Reset your HireGeneral password",
    html,
  });
}

export async function sendApplicationConfirmationEmail(params: {
  to: string;
  applicantName: string;
  jobTitle: string;
  companyName: string;
}) {
  const html = await render(
    ApplicationConfirmation({
      applicantName: params.applicantName,
      jobTitle: params.jobTitle,
      companyName: params.companyName,
      applicantEmail: params.to,
    }),
  );
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Application received — ${params.jobTitle} at ${params.companyName}`,
    html,
  });
}

export async function sendJobAlertEmail(params: {
  to: string;
  alertTitle?: string;
  fullName?: string;
  jobs: JobAlertEmailJob[];
  jobsUrl?: string;
  locationLabel?: string;
  manageAlertsUrl?: string;
  searchLabel?: string;
}) {
  const html = await render(
    JobAlertEmail({
      alertTitle: params.alertTitle,
      fullName: params.fullName,
      jobs: params.jobs,
      jobsUrl: params.jobsUrl,
      locationLabel: params.locationLabel,
      manageAlertsUrl: params.manageAlertsUrl,
      searchLabel: params.searchLabel,
    }),
  );

  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: params.alertTitle ?? "New roles matched your HireGeneral alert",
    html,
  });
}

import { Resend } from "resend";
import { render } from "react-email";
import ConfirmEmail from "@/emails/confirm-email";
import ResetPassword from "@/emails/reset-password";
import ApplicationConfirmation from "@/emails/application-confirmation";
import JobAlertEmail, { type JobAlertEmailJob } from "@/emails/job-alert";
import { writeRedactedLog } from "@/lib/logging/redact";

const FROM = process.env.EMAIL_FROM ?? "HireGeneral <no-reply@hiregeneral.com>";

let resend: Resend | undefined;

function getResendClient() {
  if (resend) return resend;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  resend = new Resend(apiKey);
  return resend;
}

async function observedEmailSend<T>(operation: string, send: () => Promise<T>) {
  const startedAt = performance.now();
  try {
    const result = await send();
    writeRedactedLog("info", "external_operation_completed", {
      operation,
      externalProvider: "resend",
      durationMs: Math.round(performance.now() - startedAt),
    });
    return result;
  } catch (error) {
    writeRedactedLog("error", "external_operation_failed", {
      operation,
      externalProvider: "resend",
      errorCategory: "external_provider",
      durationMs: Math.round(performance.now() - startedAt),
      error,
    });
    throw error;
  }
}

export async function sendConfirmationEmail(params: {
  to: string;
  confirmUrl: string;
  fullName?: string;
}) {
  const html = await render(
    ConfirmEmail({ confirmUrl: params.confirmUrl, fullName: params.fullName }),
  );
  return observedEmailSend("send_confirmation_email", () =>
    getResendClient().emails.send({
      from: FROM,
      to: params.to,
      subject: "Confirm your HireGeneral account",
      html,
    }),
  );
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
  fullName?: string;
}) {
  const html = await render(
    ResetPassword({ resetUrl: params.resetUrl, fullName: params.fullName }),
  );
  return observedEmailSend("send_password_reset_email", () =>
    getResendClient().emails.send({
      from: FROM,
      to: params.to,
      subject: "Reset your HireGeneral password",
      html,
    }),
  );
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
  return observedEmailSend("send_application_confirmation_email", () =>
    getResendClient().emails.send({
      from: FROM,
      to: params.to,
      subject: `Application received — ${params.jobTitle} at ${params.companyName}`,
      html,
    }),
  );
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

  return observedEmailSend("send_job_alert_email", () =>
    getResendClient().emails.send({
      from: FROM,
      to: params.to,
      subject: params.alertTitle ?? "New roles matched your HireGeneral alert",
      html,
    }),
  );
}

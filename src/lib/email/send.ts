// lib/email/send.ts
// Central email helper — uses Resend + React Email templates
// Install: npm install @react-email/components react-email resend

import { Resend } from "resend";
import { render } from "@react-email/components";
import ConfirmEmail from "@/emails/confirm-email";
import ResetPassword from "@/emails/reset-password";
import ApplicationConfirmation from "@/emails/application-confirmation";

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

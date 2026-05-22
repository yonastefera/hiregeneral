import { Section } from "@react-email/components";
import {
  DetailRow,
  Divider,
  EmailEyebrow,
  EmailHeading,
  EmailShell,
  EmailSmallText,
  EmailText,
  PrimaryButton,
  SoftPanel,
} from "./shared";

interface ApplicationConfirmationProps {
  applicantName: string;
  jobTitle: string;
  companyName: string;
  applicantEmail: string;
  jobsUrl?: string;
}

export default function ApplicationConfirmation({
  applicantName,
  jobTitle,
  companyName,
  applicantEmail,
  jobsUrl = "https://hiregeneral.com/jobs",
}: ApplicationConfirmationProps) {
  return (
    <EmailShell preview={`Your application to ${companyName} was received`}>
      <EmailEyebrow>Application received</EmailEyebrow>
      <EmailHeading>Your application is in.</EmailHeading>

      <EmailText>Hi {applicantName},</EmailText>
      <EmailText>
        Your application has been sent to {companyName}. We will keep the
        details tidy here in case you want to revisit the role.
      </EmailText>

      <SoftPanel>
        <Section>
          <table
            role="presentation"
            width="100%"
            cellPadding="0"
            cellSpacing="0"
          >
            <tbody>
              <DetailRow label="Role" value={jobTitle} />
              <DetailRow label="Company" value={companyName} />
              <DetailRow label="Contact" value={applicantEmail} />
            </tbody>
          </table>
        </Section>
      </SoftPanel>

      <PrimaryButton href={jobsUrl}>Browse similar roles</PrimaryButton>

      <Divider />

      <EmailSmallText>
        You are receiving this because you applied through HireGeneral. Keep
        your profile current so matching teams can understand your work quickly.
      </EmailSmallText>
    </EmailShell>
  );
}

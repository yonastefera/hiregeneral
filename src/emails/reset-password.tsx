import {
  EmailEyebrow,
  EmailHeading,
  EmailShell,
  EmailSmallText,
  EmailText,
  FallbackLink,
  PrimaryButton,
  SoftPanel,
} from "./shared";

interface ResetPasswordProps {
  resetUrl: string;
  fullName?: string;
}

export default function ResetPassword({
  resetUrl,
  fullName,
}: ResetPasswordProps) {
  return (
    <EmailShell preview="Reset your HireGeneral password">
      <EmailEyebrow>Account security</EmailEyebrow>
      <EmailHeading>Choose a fresh password.</EmailHeading>

      <EmailText>Hi {fullName ?? "there"},</EmailText>
      <EmailText>
        We received a request to reset your HireGeneral password. Use the secure
        link below to set a new one.
      </EmailText>

      <PrimaryButton href={resetUrl}>Reset password</PrimaryButton>

      <SoftPanel>
        <EmailSmallText>
          If this was not you, no action is needed. Your password will stay the
          same unless this secure reset link is used.
        </EmailSmallText>
      </SoftPanel>

      <FallbackLink href={resetUrl} />
    </EmailShell>
  );
}

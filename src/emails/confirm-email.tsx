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

interface ConfirmEmailProps {
  confirmUrl: string;
  fullName?: string;
}

export default function ConfirmEmail({
  confirmUrl,
  fullName,
}: ConfirmEmailProps) {
  return (
    <EmailShell preview="Confirm your HireGeneral account">
      <EmailEyebrow>One last step</EmailEyebrow>
      <EmailHeading>Confirm your email and step inside.</EmailHeading>

      <EmailText>Hi {fullName ?? "there"},</EmailText>
      <EmailText>
        Welcome to HireGeneral. Confirm your email so we can keep your account
        secure and help you pick up right where you left off.
      </EmailText>

      <PrimaryButton href={confirmUrl}>Confirm email address</PrimaryButton>

      <SoftPanel>
        <EmailSmallText>
          This confirmation link expires soon. If you did not create a
          HireGeneral account, you can safely ignore this email.
        </EmailSmallText>
      </SoftPanel>

      <FallbackLink href={confirmUrl} />
    </EmailShell>
  );
}

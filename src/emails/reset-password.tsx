import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

interface ResetPasswordProps {
  resetUrl: string;
  fullName?: string;
}

export default function ResetPassword({
  resetUrl,
  fullName,
}: ResetPasswordProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your HireGeneral password</Preview>
      <Tailwind>
        <Body className="bg-[#f6f6f1] font-sans">
          <Container className="mx-auto max-w-xl px-4 py-10">
            <Section className="mb-8 text-center">
              <Text className="text-2xl font-bold text-[#1D9E75]">
                HireGeneral
              </Text>
            </Section>

            <Section className="rounded-2xl bg-white px-10 py-10 shadow-sm">
              <Heading className="text-2xl font-bold text-gray-900">
                Reset your password
              </Heading>

              <Text className="mt-4 text-base leading-7 text-gray-600">
                Hi {fullName ?? "there"},
              </Text>

              <Text className="text-base leading-7 text-gray-600">
                We received a request to reset the password for your HireGeneral
                account. Click the button below to choose a new password.
              </Text>

              <Section className="mt-8 text-center">
                <Button
                  href={resetUrl}
                  className="rounded-lg bg-[#1D9E75] px-6 py-3 text-sm font-semibold text-white"
                >
                  Reset password
                </Button>
              </Section>

              <Text className="mt-8 text-sm text-gray-500">
                Or copy and paste this link into your browser:
              </Text>
              <Link
                href={resetUrl}
                className="text-sm text-[#1D9E75] break-all"
              >
                {resetUrl}
              </Link>

              <Text className="mt-8 text-xs text-gray-400">
                This link expires in 1 hour. If you didn&apos;t request a
                password reset, you can safely ignore this email — your password
                will not be changed.
              </Text>
            </Section>

            <Text className="mt-6 text-center text-xs text-gray-400">
              © {new Date().getFullYear()} HireGeneral. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

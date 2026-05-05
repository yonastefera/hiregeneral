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

interface ConfirmEmailProps {
  confirmUrl: string;
  fullName?: string;
}

export default function ConfirmEmail({
  confirmUrl,
  fullName,
}: ConfirmEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your HireGeneral account</Preview>
      <Tailwind>
        <Body className="bg-[#f6f6f1] font-sans">
          <Container className="mx-auto max-w-xl px-4 py-10">
            {/* Logo */}
            <Section className="mb-8 text-center">
              <Text className="text-2xl font-bold text-[#1D9E75]">
                HireGeneral
              </Text>
            </Section>

            {/* Card */}
            <Section className="rounded-2xl bg-white px-10 py-10 shadow-sm">
              <Heading className="text-2xl font-bold text-gray-900">
                Confirm your email
              </Heading>

              <Text className="mt-4 text-base leading-7 text-gray-600">
                Hi {fullName ?? "there"},
              </Text>

              <Text className="text-base leading-7 text-gray-600">
                Thanks for signing up for HireGeneral. Click the button below to
                confirm your email address and activate your account.
              </Text>

              <Section className="mt-8 text-center">
                <Button
                  href={confirmUrl}
                  className="rounded-lg bg-[#1D9E75] px-6 py-3 text-sm font-semibold text-white"
                >
                  Confirm email address
                </Button>
              </Section>

              <Text className="mt-8 text-sm text-gray-500">
                Or copy and paste this link into your browser:
              </Text>
              <Link
                href={confirmUrl}
                className="text-sm text-[#1D9E75] break-all"
              >
                {confirmUrl}
              </Link>

              <Text className="mt-8 text-xs text-gray-400">
                If you didn&apos;t create a HireGeneral account, you can safely
                ignore this email. This link expires in 24 hours.
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

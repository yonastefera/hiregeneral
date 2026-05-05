import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

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
    <Html>
      <Head />
      <Preview>Your application to {companyName} was received</Preview>
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
                Application received ✓
              </Heading>

              <Text className="mt-4 text-base leading-7 text-gray-600">
                Hi {applicantName},
              </Text>

              <Text className="text-base leading-7 text-gray-600">
                Your application for <strong>{jobTitle}</strong> at{" "}
                <strong>{companyName}</strong> has been successfully submitted.
                The hiring team will review your application and reach out to{" "}
                <strong>{applicantEmail}</strong> if there&apos;s a fit.
              </Text>

              {/* Tips */}
              <Section className="mt-6 rounded-xl bg-[#f0faf6] px-6 py-5">
                <Text className="text-sm font-semibold text-[#1D9E75]">
                  While you wait
                </Text>
                <Text className="mt-2 text-sm leading-6 text-gray-600">
                  • Keep your profile updated so recruiters can find you
                  <br />
                  • Browse similar roles that match your skills
                  <br />• Set up job alerts to never miss an opportunity
                </Text>
              </Section>

              <Section className="mt-8 text-center">
                <Button
                  href={jobsUrl}
                  className="rounded-lg bg-[#1D9E75] px-6 py-3 text-sm font-semibold text-white"
                >
                  Browse more jobs
                </Button>
              </Section>

              <Text className="mt-8 text-xs text-gray-400">
                You&apos;re receiving this because you applied through
                HireGeneral.
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

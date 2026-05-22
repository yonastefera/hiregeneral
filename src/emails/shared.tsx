import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

const colors = {
  background: "#f6fbfa",
  card: "#ffffff",
  ink: "#111827",
  muted: "#667085",
  soft: "#eef7f6",
  border: "#dfe8e7",
  teal: "#45b8b2",
  tealDark: "#1f7f87",
  coral: "#f47c48",
};

const fontStack =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif';

const shellStyles = {
  body: {
    margin: 0,
    backgroundColor: colors.background,
    fontFamily: fontStack,
  },
  container: {
    width: "100%",
    maxWidth: "640px",
    margin: "0 auto",
    padding: "40px 20px",
  },
  card: {
    backgroundColor: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: "28px",
    padding: "38px",
    boxShadow: "0 18px 60px rgba(31, 127, 135, 0.10)",
  },
  eyebrow: {
    margin: "0 0 14px",
    color: colors.tealDark,
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
  },
  heading: {
    margin: "0",
    color: colors.ink,
    fontSize: "34px",
    lineHeight: "40px",
    fontWeight: 760,
    letterSpacing: "-0.02em",
  },
  text: {
    margin: "20px 0 0",
    color: colors.muted,
    fontSize: "16px",
    lineHeight: "26px",
  },
  smallText: {
    margin: "18px 0 0",
    color: "#8a94a6",
    fontSize: "13px",
    lineHeight: "20px",
  },
  footer: {
    margin: "26px 0 0",
    color: "#98a2b3",
    fontSize: "12px",
    lineHeight: "18px",
    textAlign: "center" as const,
  },
};

export function BrandHeader() {
  return (
    <Section style={{ marginBottom: "24px" }}>
      <table role="presentation" cellPadding="0" cellSpacing="0">
        <tbody>
          <tr>
            <td
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "12px",
                background:
                  "linear-gradient(135deg, #456f75 0%, #45b8b2 48%, #f47c48 100%)",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 760,
                textAlign: "center",
                verticalAlign: "middle",
              }}
            >
              Hg
            </td>
            <td
              style={{
                paddingLeft: "12px",
                color: colors.ink,
                fontSize: "20px",
                fontWeight: 760,
                letterSpacing: "-0.02em",
              }}
            >
              Hire<span style={{ color: colors.tealDark }}>General</span>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

export function EmailShell({
  children,
  preview,
}: {
  children: ReactNode;
  preview: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={shellStyles.body}>
        <Container style={shellStyles.container}>
          <BrandHeader />
          <Section style={shellStyles.card}>{children}</Section>
          <Text style={shellStyles.footer}>
            HireGeneral helps candidates and teams move with better signal.
            <br />© {new Date().getFullYear()} HireGeneral. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailEyebrow({ children }: { children: ReactNode }) {
  return <Text style={shellStyles.eyebrow}>{children}</Text>;
}

export function EmailHeading({ children }: { children: ReactNode }) {
  return <Heading style={shellStyles.heading}>{children}</Heading>;
}

export function EmailText({ children }: { children: ReactNode }) {
  return <Text style={shellStyles.text}>{children}</Text>;
}

export function EmailSmallText({ children }: { children: ReactNode }) {
  return <Text style={shellStyles.smallText}>{children}</Text>;
}

export function PrimaryButton({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <Button
      href={href}
      style={{
        marginTop: "28px",
        borderRadius: "999px",
        backgroundColor: colors.ink,
        color: "#ffffff",
        display: "inline-block",
        fontSize: "15px",
        fontWeight: 700,
        padding: "15px 24px",
        textDecoration: "none",
      }}
    >
      {children}
    </Button>
  );
}

export function SoftPanel({ children }: { children: ReactNode }) {
  return (
    <Section
      style={{
        marginTop: "28px",
        borderRadius: "20px",
        backgroundColor: colors.soft,
        border: `1px solid ${colors.border}`,
        padding: "22px",
      }}
    >
      {children}
    </Section>
  );
}

export function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <tr>
      <td
        style={{
          padding: "10px 0",
          color: colors.muted,
          fontSize: "13px",
          width: "120px",
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: "10px 0",
          color: colors.ink,
          fontSize: "14px",
          fontWeight: 650,
        }}
      >
        {value}
      </td>
    </tr>
  );
}

export function FallbackLink({
  href,
  label = "Secure link",
}: {
  href: string;
  label?: string;
}) {
  return (
    <>
      <EmailSmallText>
        If the button does not open, copy and paste this link into your browser.
      </EmailSmallText>
      <Link
        href={href}
        style={{
          color: colors.tealDark,
          fontSize: "13px",
          lineHeight: "20px",
          wordBreak: "break-all" as CSSProperties["wordBreak"],
        }}
      >
        {label}: {href}
      </Link>
    </>
  );
}

export function Divider() {
  return <Hr style={{ borderColor: colors.border, margin: "28px 0" }} />;
}

export function JobAlertCard({
  companyName,
  href,
  location,
  salaryLabel,
  title,
  workMode,
}: {
  companyName: string;
  href?: string | null;
  location?: string | null;
  salaryLabel?: string | null;
  title: string;
  workMode?: string | null;
}) {
  return (
    <Section
      style={{
        border: `1px solid ${colors.border}`,
        borderRadius: "18px",
        marginTop: "14px",
        padding: "18px",
      }}
    >
      <Text
        style={{
          margin: 0,
          color: colors.tealDark,
          fontSize: "12px",
          fontWeight: 760,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {companyName}
      </Text>
      <Text
        style={{
          margin: "8px 0 0",
          color: colors.ink,
          fontSize: "18px",
          lineHeight: "24px",
          fontWeight: 760,
        }}
      >
        {title}
      </Text>
      <Text style={{ ...shellStyles.smallText, marginTop: "8px" }}>
        {[location, workMode, salaryLabel].filter(Boolean).join(" | ")}
      </Text>
      {href ? (
        <Link
          href={href}
          style={{
            color: colors.coral,
            display: "inline-block",
            fontSize: "14px",
            fontWeight: 700,
            marginTop: "12px",
            textDecoration: "none",
          }}
        >
          View role
        </Link>
      ) : null}
    </Section>
  );
}

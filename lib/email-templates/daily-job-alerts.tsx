import React from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

const SITE_NAME = "HireGeneral";
const SITE_URL = "https://hiregeneral.com";

export interface JobAlert {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type?: string; // Full-time, Remote, Hybrid
  postedAgo?: string;
  matchScore?: number; // 0-100
  url: string;
  tags?: string[];
}

export interface DailyJobAlertsProps {
  firstName?: string;
  searchName?: string; // "Senior Product Designer · Remote"
  jobs?: JobAlert[];
  totalNewToday?: number;
  date?: string; // "Friday, May 22"
}

const sampleJobs: JobAlert[] = [
  {
    id: "1",
    title: "Senior Product Designer",
    company: "Linear",
    location: "Remote · US",
    salary: "$160k – $210k",
    type: "Full-time",
    postedAgo: "2h ago",
    matchScore: 97,
    url: "https://hiregeneral.com/jobs/1",
    tags: ["Figma", "Design Systems", "Mobile"],
  },
  {
    id: "2",
    title: "Staff Backend Engineer",
    company: "Stripe",
    location: "New York, NY · Hybrid",
    salary: "$220k – $280k",
    type: "Full-time",
    postedAgo: "5h ago",
    matchScore: 94,
    url: "https://hiregeneral.com/jobs/2",
    tags: ["Go", "Postgres", "Kafka"],
  },
  {
    id: "3",
    title: "Growth Marketing Lead",
    company: "Notion",
    location: "San Francisco, CA",
    salary: "$150k – $190k",
    type: "Full-time",
    postedAgo: "8h ago",
    matchScore: 89,
    url: "https://hiregeneral.com/jobs/3",
    tags: ["SEO", "Lifecycle", "Paid"],
  },
];

export const DailyJobAlertsEmail = ({
  firstName = "there",
  searchName = "Senior Product Designer · Remote",
  jobs = sampleJobs,
  totalNewToday = 12,
  date = "Friday, May 22",
}: DailyJobAlertsProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {`${jobs.length} new ${searchName} jobs on ${SITE_NAME} today`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Brand */}
        <Section style={brandRow}>
          <Row>
            <Column>
              <Text style={brand}>
                Hire<span style={brandAccent}>General</span>
              </Text>
            </Column>
            <Column align="right">
              <Text style={dateLabel}>{date}</Text>
            </Column>
          </Row>
        </Section>

        {/* Headline */}
        <Section style={headerSection}>
          <Text style={eyebrow}>Your daily job alert</Text>
          <Heading style={h1}>
            {jobs.length} fresh roles for {firstName}
          </Heading>
          <Text style={subline}>
            Matching <span style={searchPill}>{searchName}</span>
            <span style={dot}>·</span>
            <span style={subtle}>
              {totalNewToday} new across the marketplace today
            </span>
          </Text>
        </Section>

        {/* Featured job (first) */}
        {jobs[0] && (
          <Section style={featuredCard}>
            <Row>
              <Column>
                <Text style={featuredEyebrow}>★ Top match</Text>
              </Column>
              <Column align="right">
                {jobs[0].matchScore !== undefined && (
                  <Text style={matchPill}>{jobs[0].matchScore}% match</Text>
                )}
              </Column>
            </Row>
            <Heading as="h2" style={featuredTitle}>
              {jobs[0].title}
            </Heading>
            <Text style={featuredMeta}>
              {jobs[0].company} · {jobs[0].location}
              {jobs[0].salary ? ` · ${jobs[0].salary}` : ""}
            </Text>
            {jobs[0].tags && jobs[0].tags.length > 0 && (
              <Text style={tagRow}>
                {jobs[0].tags.map((t) => (
                  <span key={t} style={tag}>
                    {t}
                  </span>
                ))}
              </Text>
            )}
            <Button href={jobs[0].url} style={primaryButton}>
              View this role →
            </Button>
          </Section>
        )}

        {/* Section heading */}
        {jobs.length > 1 && (
          <Section style={listHeaderSection}>
            <Text style={listHeader}>More roles you&apos;ll like</Text>
          </Section>
        )}

        {/* Remaining jobs */}
        {jobs.slice(1).map((job, i) => (
          <Section
            key={job.id}
            style={i === jobs.length - 2 ? jobRowLast : jobRow}
          >
            <Row>
              <Column>
                <Text style={jobTitle}>{job.title}</Text>
                <Text style={jobMeta}>
                  {job.company} · {job.location}
                </Text>
                <Text style={jobSubMeta}>
                  {job.salary ? `${job.salary}` : ""}
                  {job.salary && job.postedAgo ? "  ·  " : ""}
                  {job.postedAgo ? `${job.postedAgo}` : ""}
                </Text>
              </Column>
              <Column align="right" style={jobActionCol}>
                {job.matchScore !== undefined && (
                  <Text style={inlineMatch}>{job.matchScore}%</Text>
                )}
                <Link href={job.url} style={inlineLink}>
                  View →
                </Link>
              </Column>
            </Row>
          </Section>
        ))}

        {/* CTA to browse all */}
        <Section style={ctaSection}>
          <Button href={`${SITE_URL}/jobs`} style={secondaryButton}>
            Browse all {totalNewToday} new jobs
          </Button>
          <Text style={ctaCaption}>
            We surface roles based on your saved search. Adjust your preferences
            anytime.
          </Text>
        </Section>

        <Hr style={divider} />

        {/* Tips / pro line */}
        <Section style={tipSection}>
          <Text style={tipEyebrow}>Tip of the day</Text>
          <Text style={tipBody}>
            Roles posted in the last 24 hours get 4× more responses. Apply early
            to land at the top of the recruiter&apos;s pile.
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footerSection}>
          <Text style={footerBrand}>
            Hire<span style={brandAccent}>General</span>
          </Text>
          <Text style={footerText}>
            A calmer way to find work. Curated daily, delivered to your inbox.
          </Text>
          <Text style={footerLinks}>
            <Link href={`${SITE_URL}/settings/alerts`} style={footerLink}>
              Manage alerts
            </Link>
            <span style={footerSep}>·</span>
            <Link href={`${SITE_URL}/jobs`} style={footerLink}>
              Browse jobs
            </Link>
            <span style={footerSep}>·</span>
            <Link href={`${SITE_URL}/help`} style={footerLink}>
              Help
            </Link>
          </Text>
          <Text style={footerLegal}>
            © 2026 {SITE_NAME}, Inc. · 1 Market Street, San Francisco, CA
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export const subject = (data: DailyJobAlertsProps = {}) => {
  const count = data.jobs?.length ?? 0;
  const search = data.searchName ?? "your saved search";
  return `${count} new ${search} jobs on ${SITE_NAME}`;
};

export default DailyJobAlertsEmail;

/* ---------- Styles (inline, email-safe) ---------- */

const main: React.CSSProperties = {
  backgroundColor: "#ffffff",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  margin: 0,
  padding: "32px 16px",
  color: "#0a0a0a",
};

const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
};

const brandRow: React.CSSProperties = { padding: "0 4px 16px" };
const brand: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  letterSpacing: "-0.01em",
  color: "#0a0a0a",
  margin: 0,
};
const brandAccent: React.CSSProperties = { color: "#0d9488" };
const dateLabel: React.CSSProperties = {
  fontSize: "12px",
  color: "#737373",
  margin: 0,
  textAlign: "right",
};

const headerSection: React.CSSProperties = { padding: "8px 4px 28px" };
const eyebrow: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#0d9488",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  margin: "0 0 12px",
};
const h1: React.CSSProperties = {
  fontSize: "28px",
  lineHeight: "1.18",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  color: "#0a0a0a",
  margin: "0 0 12px",
};
const subline: React.CSSProperties = {
  fontSize: "13px",
  color: "#525252",
  margin: 0,
  lineHeight: "1.6",
};
const searchPill: React.CSSProperties = {
  backgroundColor: "#f0fdfa",
  color: "#0f766e",
  padding: "2px 8px",
  borderRadius: "6px",
  fontWeight: 500,
  fontSize: "12px",
};
const dot: React.CSSProperties = { margin: "0 8px", color: "#d4d4d4" };
const subtle: React.CSSProperties = { color: "#737373" };

const featuredCard: React.CSSProperties = {
  backgroundColor: "#fafaf9",
  borderRadius: "16px",
  padding: "20px 22px",
  margin: "0 0 28px",
};
const featuredEyebrow: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#0d9488",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  margin: 0,
};
const matchPill: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#0d9488",
  color: "#ffffff",
  fontSize: "11px",
  fontWeight: 600,
  padding: "3px 9px",
  borderRadius: "999px",
  margin: 0,
};
const featuredTitle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 600,
  letterSpacing: "-0.015em",
  color: "#0a0a0a",
  margin: "12px 0 6px",
  lineHeight: "1.25",
};
const featuredMeta: React.CSSProperties = {
  fontSize: "13px",
  color: "#525252",
  margin: "0 0 12px",
};
const tagRow: React.CSSProperties = { margin: "0 0 16px", lineHeight: "1.9" };
const tag: React.CSSProperties = {
  display: "inline-block",
  fontSize: "11px",
  color: "#404040",
  backgroundColor: "#ffffff",
  padding: "3px 9px",
  borderRadius: "6px",
  marginRight: "6px",
};
const primaryButton: React.CSSProperties = {
  backgroundColor: "#0a0a0a",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 600,
  padding: "11px 18px",
  borderRadius: "10px",
  textDecoration: "none",
  display: "inline-block",
};

const listHeaderSection: React.CSSProperties = { padding: "0 4px 12px" };
const listHeader: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#737373",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  margin: 0,
};

const jobRow: React.CSSProperties = {
  padding: "16px 4px",
  borderBottom: "1px solid #f5f5f4",
};
const jobRowLast: React.CSSProperties = { padding: "16px 4px" };
const jobTitle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#0a0a0a",
  margin: "0 0 3px",
  letterSpacing: "-0.01em",
};
const jobMeta: React.CSSProperties = {
  fontSize: "12.5px",
  color: "#525252",
  margin: "0 0 2px",
};
const jobSubMeta: React.CSSProperties = {
  fontSize: "11.5px",
  color: "#a3a3a3",
  margin: 0,
};
const jobActionCol: React.CSSProperties = {
  verticalAlign: "middle",
  width: "90px",
};
const inlineMatch: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#0d9488",
  margin: "0 0 4px",
  textAlign: "right",
};
const inlineLink: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#0a0a0a",
  textDecoration: "none",
};

const ctaSection: React.CSSProperties = {
  textAlign: "center",
  padding: "32px 4px 8px",
};
const secondaryButton: React.CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#0a0a0a",
  fontSize: "13px",
  fontWeight: 600,
  padding: "11px 22px",
  borderRadius: "10px",
  textDecoration: "none",
  display: "inline-block",
  border: "1px solid #e7e5e4",
};
const ctaCaption: React.CSSProperties = {
  fontSize: "12px",
  color: "#a3a3a3",
  margin: "12px 0 0",
};

const divider: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #f5f5f4",
  margin: "36px 0 28px",
};

const tipSection: React.CSSProperties = { padding: "0 4px" };
const tipEyebrow: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#0d9488",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  margin: "0 0 8px",
};
const tipBody: React.CSSProperties = {
  fontSize: "13.5px",
  lineHeight: "1.65",
  color: "#404040",
  margin: 0,
  fontStyle: "italic",
};

const footerSection: React.CSSProperties = {
  padding: "40px 4px 0",
  textAlign: "center",
};
const footerBrand: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#0a0a0a",
  margin: "0 0 6px",
};
const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#737373",
  margin: "0 0 16px",
};
const footerLinks: React.CSSProperties = {
  fontSize: "12px",
  color: "#737373",
  margin: "0 0 12px",
};
const footerLink: React.CSSProperties = {
  color: "#525252",
  textDecoration: "none",
  fontWeight: 500,
};
const footerSep: React.CSSProperties = { margin: "0 8px", color: "#d4d4d4" };
const footerLegal: React.CSSProperties = {
  fontSize: "11px",
  color: "#a3a3a3",
  margin: 0,
};

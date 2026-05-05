"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FooterInfoPageProps = {
  type:
    | "saved-jobs"
    | "salary-guide"
    | "career-advice"
    | "profile-visibility"
    | "post-job"
    | "candidates"
    | "recruiter-dashboard"
    | "hiring-resources"
    | "branding"
    | "about"
    | "contact"
    | "privacy"
    | "terms"
    | "accessibility"
    | "cookies"
    | "privacy-choices";
};

const pageContent = {
  "saved-jobs": {
    label: "Candidate workspace",
    title: "Saved jobs",
    description:
      "Keep a focused shortlist of roles you want to revisit and apply to when you are ready.",
    action: "Sign in to view saved jobs",
    to: "/signin",
    points: [
      "Sync favorites across devices",
      "Compare salary, location, and skills",
      "Track application readiness",
    ],
  },
  "salary-guide": {
    label: "Market insight",
    title: "Technology salary guide",
    description:
      "Research current compensation ranges across engineering, data, design, product, security, and marketing roles.",
    action: "Search roles with salary",
    to: "/jobs",
    points: [
      "Filter roles with salary ranges",
      "Compare remote and local markets",
      "Plan your next negotiation",
    ],
  },
  "career-advice": {
    label: "Career growth",
    title: "Career advice",
    description:
      "Practical guidance for resumes, interviews, offer evaluation, and building a stronger professional profile.",
    action: "Build your profile",
    to: "/profile",
    points: [
      "Resume and skills positioning",
      "Interview preparation",
      "Offer and career move checklists",
    ],
  },
  "profile-visibility": {
    label: "Privacy controls",
    title: "Profile visibility",
    description:
      "Control whether recruiters can discover your profile, resume, skills, and contact information.",
    action: "Manage visibility",
    to: "/profile",
    points: [
      "Public or private profile setting",
      "Resume and contact controls",
      "Demographic information stays optional",
    ],
  },
  "post-job": {
    label: "Recruiting",
    title: "Post a job",
    description:
      "Create clear, searchable listings with title, location, work mode, salary range, skills, and applicant review flow.",
    action: "Start posting",
    to: "/employers/dashboard",
    points: [
      "Company profile and logo",
      "Structured salary and skill fields",
      "Applicant queue after publishing",
    ],
  },
  candidates: {
    label: "Talent search",
    title: "Search candidates",
    description:
      "Find qualified technology professionals by skill, location preference, experience area, and profile visibility.",
    action: "Open recruiter tools",
    to: "/employers/dashboard",
    points: [
      "Skill-based candidate discovery",
      "Location and work-mode matching",
      "Private profiles remain hidden",
    ],
  },
  "recruiter-dashboard": {
    label: "Employer workspace",
    title: "Recruiter dashboard",
    description:
      "Manage company information, active jobs, applicants, and hiring team workflows in one place.",
    action: "Go to dashboard",
    to: "/employers/dashboard",
    points: [
      "Job posting workflow",
      "Applicant review queue",
      "Company branding controls",
    ],
  },
  "hiring-resources": {
    label: "Hiring playbooks",
    title: "Hiring resources",
    description:
      "Use structured hiring guides for role scoping, interview plans, compensation clarity, and candidate communication.",
    action: "Post a job",
    to: "/employers/post-job",
    points: [
      "Role kickoff checklist",
      "Interview plan templates",
      "Candidate communication standards",
    ],
  },
  branding: {
    label: "Company presence",
    title: "Employer branding",
    description:
      "Show candidates what your team builds, how you work, and why strong professionals should choose you.",
    action: "Manage brand",
    to: "/employers/dashboard",
    points: [
      "Company summary and logo",
      "Work mode and benefits signals",
      "Consistent listing presentation",
    ],
  },
  about: {
    label: "Company",
    title: "About HireGeneral",
    description:
      "HireGeneral is a focused job marketplace built for technology professionals and hiring teams that value clarity.",
    action: "Browse jobs",
    to: "/jobs",
    points: [
      "Modern job search",
      "Recruiter posting tools",
      "Secure candidate profiles",
    ],
  },
  contact: {
    label: "Support",
    title: "Contact HireGeneral",
    description:
      "Send a message to our team about candidate support, employer accounts, privacy, or accessibility.",
    action: "Send message",
    to: "/contact",
    points: [
      "Candidate support",
      "Employer account help",
      "Privacy and accessibility requests",
    ],
  },
  privacy: {
    label: "Legal",
    title: "Privacy policy",
    description:
      "Review how HireGeneral presents profile, resume, saved-job, application, and account privacy controls.",
    action: "Manage profile privacy",
    to: "/profile",
    points: [
      "Profile visibility choices",
      "Optional demographic fields",
      "Saved jobs require sign in",
    ],
  },
  terms: {
    label: "Legal",
    title: "Terms of use",
    description:
      "Understand the rules for using HireGeneral as a job seeker, recruiter, or employer.",
    action: "Return home",
    to: "/",
    points: [
      "Responsible listing activity",
      "Accurate candidate information",
      "Respectful marketplace conduct",
    ],
  },
  accessibility: {
    label: "Company",
    title: "Accessibility",
    description:
      "HireGeneral is designed with readable layouts, keyboard-friendly navigation, and clear content hierarchy.",
    action: "Contact support",
    to: "/contact",
    points: [
      "Semantic pages and headings",
      "Accessible form labels",
      "Contrast-aware design tokens",
    ],
  },
  cookies: {
    label: "Legal",
    title: "Cookie policy",
    description:
      "Learn how product preferences and basic experience settings may be used to keep HireGeneral useful.",
    action: "Privacy choices",
    to: "/privacy-choices",
    points: [
      "Essential experience settings",
      "Preference management",
      "Privacy-first product decisions",
    ],
  },
  "privacy-choices": {
    label: "Privacy",
    title: "Privacy choices",
    description:
      "Control public profile visibility and review how optional information is presented in your account.",
    action: "Open profile settings",
    to: "/profile",
    points: [
      "Make profile private",
      "Review contact information",
      "Manage resume and skills",
    ],
  },
};

export default function FooterInfoPage({ type }: FooterInfoPageProps) {
  const content = pageContent[type];
  const isContact = type === "contact";

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-hero-gradient px-4 py-14">
        <div className="mx-auto max-w-7xl">
          <Badge variant="soft">{content.label}</Badge>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-balance md:text-6xl">
            {content.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            {content.description}
          </p>
          <Button variant="hero" size="lg" className="mt-7" asChild>
            <Link href={content.to}>
              {content.action}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-border bg-surface p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">
              What you can do here
            </h2>
          </div>
          <div className="mt-6 space-y-4">
            {content.points.map((point) => (
              <p
                key={point}
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="size-4 text-success" />
                {point}
              </p>
            ))}
          </div>
        </div>

        {isContact ? (
          <form
            className="rounded-lg border border-border bg-surface p-6 shadow-soft"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="flex items-center gap-3">
              <Mail className="size-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">
                Send a message
              </h2>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input placeholder="Name" aria-label="Name" />
              <Input placeholder="Email" aria-label="Email" type="email" />
            </div>
            <Textarea
              className="mt-4 min-h-36"
              placeholder="How can we help?"
              aria-label="Message"
            />
            <Button variant="hero" className="mt-4">
              Submit request
            </Button>
          </form>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <UsersRound className="size-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">
                Next best step
              </h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Use this page as a practical entry point into the HireGeneral
              workflow. Public pages explain the feature, while account actions
              continue through secure sign-in and profile tools.
            </p>
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-background p-3">
              <Search className="size-5 text-muted-foreground" />
              <Input
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                placeholder="Search jobs, skills, or companies"
              />
            </div>
            <Button variant="glass" className="mt-4" asChild>
              <Link href="/jobs">Explore jobs</Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}

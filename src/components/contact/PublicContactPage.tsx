"use client";

import { useMemo, useState, type ReactNode, type SyntheticEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChevronDown,
  Clock,
  LifeBuoy,
  Mail,
  MapPin,
  Send,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ContactFormState = {
  name: string;
  email: string;
  company: string;
  audience: "job_seeker" | "employer" | "partner" | "general";
  topic:
    | "candidate_support"
    | "employer_sales"
    | "billing"
    | "privacy"
    | "accessibility"
    | "partnership"
    | "general";
  subject: string;
  message: string;
  website: string;
};

const initialForm: ContactFormState = {
  name: "",
  email: "",
  company: "",
  audience: "general",
  topic: "general",
  subject: "",
  message: "",
  website: "",
};

function getInitialForm(topic: string | null): ContactFormState {
  if (topic === "employer_sales") {
    return {
      ...initialForm,
      audience: "employer",
      topic: "employer_sales",
    };
  }

  return initialForm;
}

type PublicContactPageProps = {
  initialTopic?: string | null;
};

export function PublicContactPage({ initialTopic }: PublicContactPageProps) {
  const initialFormState = useMemo(
    () => getInitialForm(initialTopic ?? null),
    [initialTopic],
  );
  const [form, setForm] = useState<ContactFormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  const updateField = <Key extends keyof ContactFormState>(
    key: Key,
    value: ContactFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function submitContact(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sourcePath: `${window.location.pathname}${window.location.search}`,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        id?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Could not send your message.");
      }

      setForm(initialFormState);
      toast.success(
        payload?.id
          ? "Message sent. We will be in touch within one business day."
          : "Message received. We will be in touch within one business day.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send your message.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-background">
      <section className="relative overflow-hidden bg-ink text-background">
        <div className="pointer-events-none absolute inset-0 bg-salary-hero-gradient opacity-90" />
        <div className="pointer-events-none absolute -right-40 top-0 size-140 rounded-full bg-accent/40 blur-[160px]" />
        <div className="pointer-events-none absolute -left-32 top-40 size-120 rounded-full bg-primary/40 blur-[160px]" />
        <div className="pointer-events-none absolute inset-0 noise-dark opacity-50" />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-24 md:px-6 md:pb-32 md:pt-24">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-electric/40 bg-electric/10 px-3 py-1 font-mono-tag text-[10px] font-semibold text-electric">
              <span className="size-1.5 rounded-full bg-electric" />
              Support online · ~6 hr reply
            </div>
            <div className="hidden items-center gap-2 font-mono-tag text-[10px] text-background/60 md:inline-flex">
              <span>Contact</span>
              <span className="h-px w-8 bg-background/30" />
              <span className="text-electric">human ↔ human</span>
            </div>
          </div>

          <h1 className="font-display mt-10 max-w-280 text-balance text-[clamp(3.25rem,8vw,6.25rem)] leading-[0.92] tracking-[-0.04em]">
            Talk to a
            <br />
            <span className="text-gradient-electric italic">human.</span>{" "}
            <span className="text-outline text-background">Get a</span>
            <br />
            <span className="text-gradient-warm">real answer.</span>
          </h1>

          <div className="mt-10 grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <p className="max-w-xl text-base leading-7 text-background/70 md:text-lg">
              Job seekers, hiring teams, privacy, accessibility — your message
              gets routed to the right person within one business day.
            </p>
            <div className="hidden gap-8 md:flex">
              <div className="flex flex-col">
                <span className="font-display text-5xl leading-none tracking-tight text-electric">
                  6h
                </span>
                <span className="mt-2 font-mono-tag text-[10px] text-background/60">
                  Avg reply
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-5xl leading-none tracking-tight text-accent">
                  100%
                </span>
                <span className="mt-2 font-mono-tag text-[10px] text-background/60">
                  Routed by human
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-5xl leading-none tracking-tight text-violet-pop">
                  24/7
                </span>
                <span className="mt-2 font-mono-tag text-[10px] text-background/60">
                  Inbox open
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1.4fr_0.9fr]">
          <form
            onSubmit={submitContact}
            className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-soft md:p-10"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex items-end justify-between gap-3 border-b border-border pb-6">
              <div>
                <p className="font-mono-tag text-[10px] font-semibold text-primary">
                  01 / Message
                </p>
                <h2 className="font-display mt-2 text-3xl md:text-4xl">
                  Send us a note
                </h2>
              </div>
              <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
                <Clock className="size-3.5 text-primary" />
                Avg reply <span className="text-foreground">~6 hrs</span>
              </span>
            </div>

            <input
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(event) => updateField("website", event.target.value)}
              className="hidden"
              aria-hidden="true"
            />

            <div className="relative mt-8 grid gap-6 md:grid-cols-2">
              <FormField label="Name">
                <Input
                  required
                  minLength={2}
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  name="name"
                  placeholder="Your name"
                  className="h-12"
                />
              </FormField>
              <FormField label="Work email">
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  name="email"
                  placeholder="you@company.com"
                  className="h-12"
                />
              </FormField>
              <FormField label="I am a">
                <SelectBox
                  name="role"
                  value={form.audience}
                  onChange={(event) =>
                    updateField(
                      "audience",
                      event.target.value as ContactFormState["audience"],
                    )
                  }
                >
                  <option value="general">General visitor</option>
                  <option value="job_seeker">Job seeker</option>
                  <option value="employer">Employer / recruiter</option>
                  <option value="partner">Partner / press</option>
                </SelectBox>
              </FormField>
              <FormField label="Topic">
                <SelectBox
                  name="topic"
                  value={form.topic}
                  onChange={(event) =>
                    updateField(
                      "topic",
                      event.target.value as ContactFormState["topic"],
                    )
                  }
                >
                  <option value="general">General question</option>
                  <option value="candidate_support">Account support</option>
                  <option value="employer_sales">Employer sales</option>
                  <option value="billing">Billing</option>
                  <option value="privacy">Privacy & data</option>
                  <option value="accessibility">Accessibility</option>
                  <option value="partnership">Partnership / press</option>
                </SelectBox>
              </FormField>
              <div className="md:col-span-2">
                <FormField label="Subject">
                  <Input
                    value={form.subject}
                    onChange={(event) =>
                      updateField("subject", event.target.value)
                    }
                    name="subject"
                    placeholder="Short summary"
                    className="h-12"
                  />
                </FormField>
              </div>
              <div className="md:col-span-2">
                <FormField label="Message">
                  <Textarea
                    required
                    minLength={20}
                    maxLength={2000}
                    value={form.message}
                    onChange={(event) =>
                      updateField("message", event.target.value)
                    }
                    name="message"
                    rows={6}
                    placeholder="Share a few details so we can route your request quickly."
                    className="resize-none rounded-xl"
                  />
                </FormField>
              </div>
            </div>

            <div className="relative mt-8 flex flex-col items-start gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                By submitting, you agree HireGeneral may contact you about this
                request.
              </p>
              <Button
                type="submit"
                variant="hero"
                size="xl"
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send message"}{" "}
                <Send className="size-4" />
              </Button>
            </div>
          </form>

          <div className="grid auto-rows-min gap-5">
            <RouteCard
              icon={<LifeBuoy className="size-4" />}
              title="Job seeker support"
              desc="Profile, saved jobs, applications, resume."
              tag="01"
              tone="primary"
            />
            <RouteCard
              icon={<Building2 className="size-4" />}
              title="Employer sales"
              desc="Plans, posting, database access, demos."
              tag="02"
              tone="dark"
            />
            <RouteCard
              icon={<ShieldCheck className="size-4" />}
              title="Privacy & trust"
              desc="Account security and data requests."
              tag="03"
              tone="accent"
            />

            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
              <p className="font-mono-tag text-[10px] font-semibold text-primary">
                Direct
              </p>
              <div className="mt-4 space-y-3">
                <ContactRow title="Support" email="support@hiregeneral.com" />
                <ContactRow
                  title="Employers"
                  email="employers@hiregeneral.com"
                />
              </div>
              <div className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-accent" />
                <span>
                  HireGeneral currently serves U.S. job seekers and employers.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 md:px-6">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-4xl bg-foreground p-10 text-background shadow-lift md:p-16">
          <div className="pointer-events-none absolute -left-20 -top-20 size-105 rounded-full bg-primary/35 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-24 -right-10 size-115 rounded-full bg-accent/35 blur-[120px]" />
          <div className="pointer-events-none absolute inset-0 grain opacity-[0.25]" />
          <div className="relative grid items-end gap-10 md:grid-cols-[1.2fr_auto]">
            <div>
              <p className="font-mono-tag text-[10px] font-semibold text-primary-glow">
                For employers
              </p>
              <h3 className="font-display mt-4 text-balance text-4xl leading-[1.05] md:text-6xl">
                Hire faster,{" "}
                <span className="text-gradient-warm">with less noise.</span>
              </h3>
              <p className="mt-5 max-w-2xl text-base leading-7 text-background/75">
                Posting, candidate discovery, subscriptions, and company
                profiles — see how employer tools work before you create an
                account.
              </p>
            </div>
            <Button asChild variant="hero" size="xl">
              <Link href="/employers/dashboard">
                Explore employer tools <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-mono-tag text-[10px] font-semibold text-muted-foreground">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function SelectBox({
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          "h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 pr-10 text-sm text-foreground transition-colors hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15",
          className,
        )}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
    </div>
  );
}

function RouteCard({
  icon,
  title,
  desc,
  tag,
  tone,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  tag: string;
  tone: "primary" | "accent" | "dark";
}) {
  const wrap =
    tone === "dark"
      ? "border-transparent bg-foreground text-background"
      : tone === "accent"
        ? "border-accent/25 bg-gradient-to-br from-accent/10 to-background"
        : "border-primary/20 bg-gradient-to-br from-primary/10 to-background";
  const iconBox =
    tone === "dark"
      ? "bg-background/15 text-primary-glow"
      : tone === "accent"
        ? "bg-warm-gradient text-accent-foreground shadow-warm"
        : "bg-primary-gradient text-primary-foreground shadow-pop";
  const tagColor =
    tone === "dark" ? "text-background/60" : "text-muted-foreground";
  const descColor =
    tone === "dark" ? "text-background/70" : "text-muted-foreground";

  return (
    <div
      className={cn(
        "group flex items-start gap-4 rounded-3xl border p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-lift",
        wrap,
      )}
    >
      <div
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-2xl",
          iconBox,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold tracking-tight">{title}</p>
          <span
            className={cn("font-mono-tag text-[10px] font-semibold", tagColor)}
          >
            {tag}
          </span>
        </div>
        <p className={cn("mt-1 text-xs leading-5", descColor)}>{desc}</p>
      </div>
    </div>
  );
}

function ContactRow({ title, email }: { title: string; email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="group flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 transition-all hover:border-primary/40 hover:bg-secondary"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold tracking-tight">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
      <div className="grid size-8 place-items-center rounded-full bg-primary-gradient text-primary-foreground shadow-pop transition-all group-hover:scale-110">
        <Mail className="size-3.5" />
        <ArrowUpRight className="sr-only" />
      </div>
    </a>
  );
}

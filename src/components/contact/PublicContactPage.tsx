"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  LifeBuoy,
  Mail,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

const contactChannels = [
  {
    title: "Job seeker support",
    description: "Profile, saved jobs, applications, resume, and account help.",
    icon: LifeBuoy,
  },
  {
    title: "Employer sales",
    description: "Plans, job posting, resume database access, and demos.",
    icon: Building2,
  },
  {
    title: "Privacy and trust",
    description: "Privacy, accessibility, account security, and data requests.",
    icon: ShieldCheck,
  },
];

const responseNotes = [
  "Most support requests receive a response within one business day.",
  "Employer plan questions are routed to the hiring marketplace team.",
  "Privacy and accessibility requests are reviewed with extra care.",
];

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

function selectClassName() {
  return "h-12 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground shadow-xs transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
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
  const [sent, setSent] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const selectedTopicLabel = useMemo(() => {
    const labels: Record<ContactFormState["topic"], string> = {
      candidate_support: "Candidate support",
      employer_sales: "Employer sales",
      billing: "Billing",
      privacy: "Privacy",
      accessibility: "Accessibility",
      partnership: "Partnership",
      general: "General question",
    };

    return labels[form.topic];
  }, [form.topic]);

  const updateField = <Key extends keyof ContactFormState>(
    key: Key,
    value: ContactFormState[Key],
  ) => {
    setSent(false);
    setSubmittedId(null);
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function submitContact(event: FormEvent<HTMLFormElement>) {
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

      setSent(true);
      setSubmittedId(payload?.id ?? null);
      setForm(initialFormState);
      toast.success(
        payload?.id
          ? "Message sent. We will follow up shortly."
          : "Message received. We will follow up shortly.",
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
    <main className="min-h-screen overflow-hidden bg-background">
      <section className="relative bg-hero-gradient px-4 py-16 sm:py-20">
        <div className="pointer-events-none absolute -left-24 top-12 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs backdrop-blur">
              <Sparkles className="size-3.5 text-accent" />
              Contact HireGeneral
            </div>

            <h1 className="mt-5 max-w-3xl text-balance text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Get the right help from the right team.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Send us a note about job seeker support, employer hiring tools,
              billing, privacy, accessibility, or partnership questions.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {contactChannels.map((channel) => (
                <article
                  key={channel.title}
                  className="rounded-2xl border border-border/70 bg-surface/80 p-4 shadow-soft backdrop-blur"
                >
                  <channel.icon className="size-5 text-primary" />
                  <h2 className="mt-3 text-sm font-semibold">
                    {channel.title}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {channel.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <form
            onSubmit={submitContact}
            className="relative rounded-3xl border border-border/70 bg-surface/95 p-4 shadow-lift backdrop-blur sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Send a message
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">
                  Tell us what you need
                </h2>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                <Clock3 className="size-3.5" />1 business day
              </div>
            </div>

            <input
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(event) => updateField("website", event.target.value)}
              className="hidden"
              aria-hidden="true"
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Name
                <Input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Your name"
                  required
                  minLength={2}
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Work email
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                I am a
                <select
                  value={form.audience}
                  onChange={(event) =>
                    updateField(
                      "audience",
                      event.target.value as ContactFormState["audience"],
                    )
                  }
                  className={selectClassName()}
                >
                  <option value="job_seeker">Job seeker</option>
                  <option value="employer">Employer</option>
                  <option value="partner">Partner</option>
                  <option value="general">General visitor</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Topic
                <select
                  value={form.topic}
                  onChange={(event) =>
                    updateField(
                      "topic",
                      event.target.value as ContactFormState["topic"],
                    )
                  }
                  className={selectClassName()}
                >
                  <option value="candidate_support">Candidate support</option>
                  <option value="employer_sales">Employer sales</option>
                  <option value="billing">Billing</option>
                  <option value="privacy">Privacy</option>
                  <option value="accessibility">Accessibility</option>
                  <option value="partnership">Partnership</option>
                  <option value="general">General question</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Company
                <Input
                  value={form.company}
                  onChange={(event) =>
                    updateField("company", event.target.value)
                  }
                  placeholder="Optional"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Subject
                <Input
                  value={form.subject}
                  onChange={(event) =>
                    updateField("subject", event.target.value)
                  }
                  placeholder={`${selectedTopicLabel} question`}
                />
              </label>
            </div>

            <label className="mt-4 grid gap-2 text-sm font-medium">
              Message
              <Textarea
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                placeholder="Share a few details so we can route your request quickly."
                required
                minLength={20}
                maxLength={2000}
                className="min-h-36 resize-y rounded-xl"
              />
            </label>

            {sent ? (
              <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-soft">
                <div className="flex gap-4 p-4 sm:p-5">
                  <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-white shadow-pop">
                    <CheckCircle2 className="size-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-emerald-950">
                      Message sent successfully
                    </p>
                    <p className="mt-1 text-sm leading-6 text-emerald-900/75">
                      Thanks for reaching out. We routed your request to the
                      right HireGeneral team and will follow up shortly.
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 font-medium text-emerald-900 ring-1 ring-emerald-200">
                        <Clock3 className="size-3.5" />
                        Usually within 1 business day
                      </span>

                      {submittedId ? (
                        <span className="rounded-full bg-white/80 px-2.5 py-1 font-medium text-emerald-900 ring-1 ring-emerald-200">
                          Ref {submittedId.slice(0, 8)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted-foreground">
                By submitting, you agree that HireGeneral may contact you about
                your request.
              </p>

              <Button type="submit" variant="hero" disabled={submitting}>
                {submitting ? "Sending..." : "Send message"}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-3xl border border-border/70 bg-surface p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <MessageSquareText className="size-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">
              How we route requests
            </h2>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {responseNotes.map((note) => (
              <p
                key={note}
                className="rounded-2xl border border-border/60 bg-background p-4 text-sm leading-6 text-muted-foreground"
              >
                {note}
              </p>
            ))}
          </div>
        </div>

        <aside className="rounded-3xl border border-border/70 bg-surface p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <Mail className="size-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Quick contacts</h2>
          </div>

          <div className="mt-5 space-y-4 text-sm">
            <a
              href="mailto:support@hiregeneral.com"
              className="flex items-center justify-between rounded-2xl border border-border/60 p-4 transition hover:border-primary/40 hover:bg-secondary/40"
            >
              <span>
                <span className="block font-semibold">Support</span>
                <span className="text-muted-foreground">
                  support@hiregeneral.com
                </span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </a>

            <a
              href="mailto:employers@hiregeneral.com"
              className="flex items-center justify-between rounded-2xl border border-border/60 p-4 transition hover:border-primary/40 hover:bg-secondary/40"
            >
              <span>
                <span className="block font-semibold">Employers</span>
                <span className="text-muted-foreground">
                  employers@hiregeneral.com
                </span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </a>
          </div>

          <div className="mt-5 rounded-2xl bg-secondary/70 p-4 text-sm text-secondary-foreground">
            <MapPin className="size-4" />
            <p className="mt-2 leading-6">
              HireGeneral currently serves U.S. job seekers and employers.
              Salary, location, and hiring data are tuned for U.S. markets.
            </p>
          </div>
        </aside>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="rounded-3xl bg-neutral-950 p-8 text-white shadow-lift sm:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm text-teal-300">
                <UsersRound className="size-4" />
                Employers
              </div>
              <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight">
                Looking to hire faster with HireGeneral?
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
                Learn how job posting, candidate discovery, subscriptions, and
                company profiles work before creating an employer account.
              </p>
            </div>

            <Button asChild variant="secondary" size="lg">
              <Link href="/employers" prefetch={false}>
                Explore employer tools
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

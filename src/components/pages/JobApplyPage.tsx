"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase/client";
import { isSupportedLogoUrl } from "@/lib/logos";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/db/types";

// ─── constants ──────────────────────────────────────────────────────────────

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = [".pdf", ".doc", ".docx"];

const STEPS = [
  { id: 1, title: "Your details", description: "Contact information" },
  { id: 2, title: "Resume", description: "Upload your CV" },
  { id: 3, title: "Questions", description: "A few quick questions" },
  { id: 4, title: "Review", description: "Confirm and submit" },
];

function formatSalary(
  min: number | null,
  max: number | null,
  currency = "USD",
) {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export default function JobApplyPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const [job, setJob] = useState<Job | null>(null);
  const [jobLoading, setJobLoading] = useState(true);

  // ── Auth ──
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  // ── Wizard ──
  const [step, setStep] = useState(1);

  // ── Form fields ──
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [workAuth, setWorkAuth] = useState("");
  const [requireSponsorship, setRequireSponsorship] = useState("no");
  const [agree, setAgree] = useState(false);

  // ── File ──
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // ── Fetch job from real API ──
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/jobs/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setJob)
      .catch(() => setJob(null))
      .finally(() => setJobLoading(false));
  }, [slug]);

  // ── Check auth ──
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const user = data.user;
      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? "");
      setEmail(user?.email ?? "");
      setAuthChecked(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const filePretty = useMemo(() => {
    if (!file) return null;
    const kb = file.size / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(0)} KB`;
  }, [file]);

  const onPickFile = (picked: File | null) => {
    if (!picked) return;
    const ext = `.${picked.name.split(".").pop()!.toLowerCase()}`;
    if (!ACCEPTED.includes(ext)) {
      toast.error("Resume must be PDF, DOC, or DOCX.");
      return;
    }
    if (picked.size > MAX_BYTES) {
      toast.error("Resume must be under 5 MB.");
      return;
    }
    setFile(picked);
  };

  const validateStep = (s: number): boolean => {
    if (s === 1) {
      if (!fullName.trim()) {
        toast.error("Please enter your full name.");
        return false;
      }
      if (!email.trim()) {
        toast.error("Please enter your email.");
        return false;
      }
      return true;
    }
    if (s === 2) {
      if (!file) {
        toast.error("Please attach your resume to continue.");
        return false;
      }
      return true;
    }
    if (s === 3) {
      if (!yearsExp) {
        toast.error("Please select your years of experience.");
        return false;
      }
      if (!workAuth) {
        toast.error("Please select work authorization.");
        return false;
      }
      return true;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(STEPS.length, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async () => {
    if (!userId || !file || !job) return;
    if (!agree) {
      toast.error("Please confirm the information is accurate.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload resume to Supabase Storage
      const ext = file.name.split(".").pop()!.toLowerCase();
      const path = `${userId}/${job.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(path, file, { upsert: false, contentType: file.type });

      if (uploadError) throw uploadError;

      // 2. Get public-ish storage path (private bucket — path stored, not URL)
      const resumeStoragePath = path;

      // 3. Save application via API route (handles DB insert + email)
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.id,
          resume_url: resumeStoragePath,
          cover_note: coverNote || null,
          applicant_full_name: fullName,
          applicant_email: email,
          applicant_phone: phone || null,
          applicant_location: location || null,
          applicant_linkedin: linkedin || null,
          applicant_portfolio: portfolio || null,
          years_experience: yearsExp,
          work_authorization: workAuth,
          requires_sponsorship: requireSponsorship,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        // Handle duplicate application gracefully
        if (res.status === 409) {
          toast.error("You've already applied to this job.");
          return;
        }
        throw new Error(body.error ?? "Failed to submit application");
      }

      setDone(true);
      toast.success("Application submitted!");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Could not submit application.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading job ──
  if (jobLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </main>
    );
  }

  // ── Job not found ──
  if (!job) {
    return (
      <main className="min-h-screen bg-background">
        <section className="mx-auto max-w-3xl px-4 py-24 text-center">
          <Badge variant="soft">Job not found</Badge>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">
            This listing isn&apos;t available
          </h1>
          <Button className="mt-6" asChild>
            <Link href="/jobs">Browse jobs</Link>
          </Button>
        </section>
      </main>
    );
  }

  // ── Auth gate ──
  if (authChecked && !userId) {
    return (
      <main className="min-h-screen bg-background">
        <section className="mx-auto max-w-2xl px-4 py-20 text-center">
          <Badge variant="soft">Sign in required</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Sign in to apply
          </h1>
          <p className="mt-3 text-muted-foreground">
            Create a free account or sign in to submit your application to{" "}
            {job.company_name}.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href={`/signin?next=/jobs/${job.slug}/apply`}>Sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/signup?next=/jobs/${job.slug}/apply`}>
                Create account
              </Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  // ── Success ──
  if (done) {
    return (
      <main className="min-h-screen bg-background">
        <section className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="size-8" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">
            Application sent
          </h1>
          <p className="mt-3 text-muted-foreground">
            Your application for{" "}
            <span className="font-semibold text-foreground">{job.title}</span>{" "}
            at{" "}
            <span className="font-semibold text-foreground">
              {job.company_name}
            </span>{" "}
            has been delivered. The hiring team will reach out to {email} if
            there&apos;s a fit.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/jobs">Browse more jobs</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/profile">View my profile</Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  const salary = formatSalary(
    job.salary_min,
    job.salary_max,
    job.salary_currency,
  );
  const logoUrl = job.company_logo_url
    ? isSupportedLogoUrl(job.company_logo_url)
      ? job.company_logo_url
      : null
    : null;

  return (
    <main className="min-h-screen bg-background">
      {/* ── Job header ── */}
      <section className="border-b border-border bg-background px-4 pb-6 pt-8">
        <div className="mx-auto max-w-5xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-3 -ml-3 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          <Badge variant="soft">Apply</Badge>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
            {job.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {job.company_name} · {job.location} · {job.employment_type}
          </p>
        </div>
      </section>

      {/* ── Step indicator ── */}
      <section className="border-b border-border bg-card px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <ol className="flex items-center justify-between gap-2">
            {STEPS.map((stepItem, index) => {
              const isComplete = step > stepItem.id;
              const isCurrent = step === stepItem.id;
              return (
                <li
                  key={stepItem.id}
                  className="flex flex-1 items-center gap-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors",
                        isComplete &&
                          "border-primary bg-primary text-primary-foreground",
                        isCurrent &&
                          "border-primary bg-background text-primary ring-4 ring-primary/15",
                        !isComplete &&
                          !isCurrent &&
                          "border-border bg-background text-muted-foreground",
                      )}
                    >
                      {isComplete ? <Check className="size-4" /> : stepItem.id}
                    </div>
                    <div className="hidden min-w-0 sm:block">
                      <p
                        className={cn(
                          "truncate text-sm font-medium",
                          isCurrent || isComplete
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {stepItem.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {stepItem.description}
                      </p>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-px flex-1 transition-colors",
                        isComplete ? "bg-primary" : "bg-border",
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* ── Step 1: Details ── */}
          {step === 1 && (
            <div className="rounded-lg border border-border bg-card p-6 md:p-8">
              <h2 className="text-lg font-semibold tracking-tight">
                Your details
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                How can {job.company_name} reach you?
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full name *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Avery Morgan"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 012-4890"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="location">Current location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="New York, NY"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="linkedin.com/in/you"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="portfolio">Portfolio / GitHub</Label>
                  <Input
                    id="portfolio"
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    placeholder="github.com/you"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Resume ── */}
          {step === 2 && (
            <div className="rounded-lg border border-border bg-card p-6 md:p-8">
              <h2 className="text-lg font-semibold tracking-tight">Resume</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                PDF, DOC, or DOCX up to 5 MB.
              </p>
              {!file ? (
                <label
                  htmlFor="resume"
                  className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background px-6 py-12 text-center transition-colors hover:border-primary/50 hover:bg-secondary/40"
                >
                  <div className="grid size-12 place-items-center rounded-full bg-secondary text-primary">
                    <UploadCloud className="size-6" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PDF, DOC, DOCX max 5 MB
                  </p>
                  <input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="sr-only"
                    onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              ) : (
                <div className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {filePretty}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                    aria-label="Remove file"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Questions ── */}
          {step === 3 && (
            <div className="rounded-lg border border-border bg-card p-6 md:p-8">
              <h2 className="text-lg font-semibold tracking-tight">
                A few quick questions
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Helps {job.company_name} review your application.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Years of experience *</Label>
                  <Select value={yearsExp} onValueChange={setYearsExp}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">0–1 years</SelectItem>
                      <SelectItem value="2-4">2–4 years</SelectItem>
                      <SelectItem value="5-7">5–7 years</SelectItem>
                      <SelectItem value="8+">8+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Work authorization *</Label>
                  <Select value={workAuth} onValueChange={setWorkAuth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="citizen">U.S. Citizen</SelectItem>
                      <SelectItem value="permanent">
                        Permanent resident
                      </SelectItem>
                      <SelectItem value="visa">Work visa</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Will you require visa sponsorship?</Label>
                  <Select
                    value={requireSponsorship}
                    onValueChange={setRequireSponsorship}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="future">
                        Not now, but in the future
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="cover">
                    Cover note{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    id="cover"
                    rows={5}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder={`Tell ${job.company_name} why you're a great fit for the ${job.title} role…`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Review ── */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-6 md:p-8">
                <h2 className="text-lg font-semibold tracking-tight">
                  Review your application
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Make sure everything looks right before submitting.
                </p>
                <dl className="mt-6 divide-y divide-border text-sm">
                  <ReviewRow
                    label="Full name"
                    value={fullName}
                    onEdit={() => setStep(1)}
                  />
                  <ReviewRow
                    label="Email"
                    value={email}
                    onEdit={() => setStep(1)}
                  />
                  {phone && (
                    <ReviewRow
                      label="Phone"
                      value={phone}
                      onEdit={() => setStep(1)}
                    />
                  )}
                  {location && (
                    <ReviewRow
                      label="Location"
                      value={location}
                      onEdit={() => setStep(1)}
                    />
                  )}
                  {linkedin && (
                    <ReviewRow
                      label="LinkedIn"
                      value={linkedin}
                      onEdit={() => setStep(1)}
                    />
                  )}
                  {portfolio && (
                    <ReviewRow
                      label="Portfolio"
                      value={portfolio}
                      onEdit={() => setStep(1)}
                    />
                  )}
                  <ReviewRow
                    label="Resume"
                    value={file?.name ?? "—"}
                    onEdit={() => setStep(2)}
                  />
                  <ReviewRow
                    label="Years of experience"
                    value={yearsExp || "—"}
                    onEdit={() => setStep(3)}
                  />
                  <ReviewRow
                    label="Work authorization"
                    value={workAuth || "—"}
                    onEdit={() => setStep(3)}
                  />
                  <ReviewRow
                    label="Sponsorship"
                    value={requireSponsorship}
                    onEdit={() => setStep(3)}
                  />
                  {coverNote && (
                    <div className="py-3">
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-muted-foreground">Cover note</dt>
                        <button
                          type="button"
                          onClick={() => setStep(3)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <dd className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                        {coverNote}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={agree}
                    onCheckedChange={(v) => setAgree(Boolean(v))}
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-6 text-muted-foreground">
                    I confirm that the information provided is accurate, and I
                    agree to HireGeneral&apos;s{" "}
                    <Link
                      href="/terms"
                      className="font-medium text-primary hover:underline"
                    >
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="font-medium text-primary hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="flex items-center justify-between gap-3 border-t border-border pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={step === 1 ? () => router.back() : goBack}
            >
              <ArrowLeft className="size-4" /> {step === 1 ? "Cancel" : "Back"}
            </Button>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Step {step} of {STEPS.length}
            </p>
            {step < STEPS.length ? (
              <Button type="button" onClick={goNext}>
                Continue <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={onSubmit}
                disabled={submitting || !agree}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit application"
                )}
              </Button>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={`${job.company_name} logo`}
                  width={40}
                  height={40}
                  className="size-10 rounded-md object-contain"
                />
              ) : (
                <div className="grid size-10 place-items-center rounded-md bg-secondary text-sm font-semibold text-secondary-foreground">
                  {job.company_name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">
                  Applying for
                </p>
                <p className="truncate font-semibold">{job.title}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {job.company_name}
                </p>
              </div>
            </div>
            <dl className="mt-5 space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">{job.employment_type}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Work mode</dt>
                <dd className="font-medium">{job.work_mode}</dd>
              </div>
              {salary && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Salary</dt>
                  <dd className="font-medium">{salary}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Location</dt>
                <dd className="text-right font-medium">{job.location}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Application tips</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>Tailor your resume to
                highlight relevant experience.
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>Keep your cover note
                short and specific.
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>Double-check links to
                your portfolio work.
              </li>
            </ul>
          </div>

          <p className="px-1 text-xs text-muted-foreground">
            Signed in as {userEmail}
          </p>
        </aside>
      </section>
    </main>
  );
}

// ─── ReviewRow ───────────────────────────────────────────────────────────────

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <div className="flex items-center gap-3">
        <dd className="max-w-[16rem] truncate text-right font-medium text-foreground">
          {value}
        </dd>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium text-primary hover:underline"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/db/types";
import ApplyReview from "./ApplyReview";
import ApplySidebar from "./ApplySidebar";
import {
  ACCEPTED_RESUME_EXTENSIONS,
  APPLICATION_STEPS,
  type ApplicationStep,
  type ApplyFormErrors,
  type ApplyFormValues,
  getFileExtension,
  getFileSizeLabel,
  getJobApplyPath,
  getJobDetailsPath,
  isAcceptedResumeFile,
  MAX_RESUME_BYTES,
  supportedLogoUrl,
  validateApplyStep,
} from "./apply-utils";

type ApplyJobClientProps = {
  job: Job;
  title: string;
};

const initialValues: ApplyFormValues = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  portfolio: "",
  coverNote: "",
  yearsExp: "",
  workAuth: "",
  requireSponsorship: "no",
  agree: false,
};

export default function ApplyJobClient({ job, title }: ApplyJobClientProps) {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");

  const [step, setStep] = useState<ApplicationStep>(1);
  const [values, setValues] = useState<ApplyFormValues>(initialValues);
  const [errors, setErrors] = useState<ApplyFormErrors>({});

  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const filePretty = useMemo(() => getFileSizeLabel(file), [file]);
  const logoUrl = supportedLogoUrl(job.company_logo_url);
  const detailsPath = getJobDetailsPath(job);
  const applyPath = getJobApplyPath(job);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;

      const user = data.user;

      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? "");

      if (user?.email) {
        setValues((current) => ({
          ...current,
          email: user.email ?? "",
        }));
      }

      setAuthChecked(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const updateValue = <K extends keyof ApplyFormValues>(
    key: K,
    value: ApplyFormValues[K],
  ) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: undefined,
      form: undefined,
    }));
  };

  const onPickFile = (picked: File | null) => {
    if (!picked) return;

    if (!isAcceptedResumeFile(picked)) {
      const message = "Resume must be PDF, DOC, or DOCX.";
      setErrors((current) => ({ ...current, resume: message }));
      toast.error(message);
      return;
    }

    if (picked.size > MAX_RESUME_BYTES) {
      const message = "Resume must be under 5 MB.";
      setErrors((current) => ({ ...current, resume: message }));
      toast.error(message);
      return;
    }

    setFile(picked);
    setErrors((current) => ({
      ...current,
      resume: undefined,
      form: undefined,
    }));
  };

  const validateCurrentStep = () => {
    const nextErrors = validateApplyStep({
      step,
      values,
      file,
    });

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateCurrentStep()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setStep(
      (current) =>
        Math.min(APPLICATION_STEPS.length, current + 1) as ApplicationStep,
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStep((current) => Math.max(1, current - 1) as ApplicationStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async () => {
    if (submitting) return;

    const nextErrors = validateApplyStep({
      step: 4,
      values,
      file,
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    if (!userId || !file) {
      toast.error("Please sign in and attach your resume.");
      return;
    }

    setSubmitting(true);

    try {
      const extension = getFileExtension(file.name).replace(".", "");
      const path = `${userId}/${job.id}-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(path, file, {
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.id,
          resume_url: path,
          cover_note: values.coverNote || null,
          applicant_full_name: values.fullName,
          applicant_email: values.email,
          applicant_phone: values.phone || null,
          applicant_location: values.location || null,
          applicant_linkedin: values.linkedin || null,
          applicant_portfolio: values.portfolio || null,
          years_experience: values.yearsExp,
          work_authorization: values.workAuth,
          requires_sponsorship: values.requireSponsorship,
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("You've already applied to this job.");
        }

        throw new Error(body?.error ?? "Failed to submit application.");
      }

      setDone(true);
      toast.success("Application submitted!");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not submit application.";

      setErrors((current) => ({
        ...current,
        form: message,
      }));
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const onFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step < APPLICATION_STEPS.length) {
      goNext();
      return;
    }

    onSubmit();
  };

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-background">
        <div
          className="flex items-center justify-center py-32 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 aria-hidden="true" className="size-6 animate-spin" />
          <span className="sr-only">Checking your session...</span>
        </div>
      </main>
    );
  }

  if (!userId) {
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
              <Link href={`/signin?next=${encodeURIComponent(applyPath)}`}>
                Sign in
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href={`/signup?next=${encodeURIComponent(applyPath)}`}>
                Create account
              </Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-screen bg-background">
        <section className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 aria-hidden="true" className="size-8" />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight">
            Application sent
          </h1>

          <p className="mt-3 text-muted-foreground">
            Your application for{" "}
            <span className="font-semibold text-foreground">{title}</span> at{" "}
            <span className="font-semibold text-foreground">
              {job.company_name}
            </span>{" "}
            has been delivered. The hiring team will reach out to {values.email}{" "}
            if there&apos;s a fit.
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

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-background px-4 pb-6 pt-8">
        <div className="mx-auto max-w-5xl">
          <Button
            variant="ghost"
            size="sm"
            className="mb-3 -ml-3 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href={detailsPath}>
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to job details
            </Link>
          </Button>

          <Badge variant="soft">Apply</Badge>

          <div className="mt-3 flex items-start gap-3">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${job.company_name} logo`}
                width={44}
                height={44}
                className="size-11 rounded-md object-contain"
              />
            ) : null}

            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {title}
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                {job.company_name} · {job.location} · {job.employment_type}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="border-b border-border bg-card px-4 py-6"
        aria-label="Application progress"
      >
        <div className="mx-auto max-w-5xl">
          <ol className="flex items-center justify-between gap-2">
            {APPLICATION_STEPS.map((stepItem, index) => {
              const isComplete = step > stepItem.id;
              const isCurrent = step === stepItem.id;

              return (
                <li
                  key={stepItem.id}
                  className="flex flex-1 items-center gap-3"
                  aria-current={isCurrent ? "step" : undefined}
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
                      {isComplete ? (
                        <Check aria-hidden="true" className="size-4" />
                      ) : (
                        stepItem.id
                      )}
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

                  {index < APPLICATION_STEPS.length - 1 && (
                    <div
                      aria-hidden="true"
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
        <form className="space-y-6" onSubmit={onFormSubmit} noValidate>
          {errors.form && (
            <div
              className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
              role="alert"
            >
              {errors.form}
            </div>
          )}

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
                    value={values.fullName}
                    onChange={(event) =>
                      updateValue("fullName", event.target.value)
                    }
                    placeholder="Avery Morgan"
                    autoComplete="name"
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={
                      errors.fullName ? "fullName-error" : undefined
                    }
                  />
                  {errors.fullName && (
                    <p id="fullName-error" className="text-sm text-destructive">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={values.email}
                    onChange={(event) =>
                      updateValue("email", event.target.value)
                    }
                    placeholder="you@email.com"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-sm text-destructive">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={values.phone}
                    onChange={(event) =>
                      updateValue("phone", event.target.value)
                    }
                    placeholder="(555) 012-4890"
                    autoComplete="tel"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="location">Current location</Label>
                  <Input
                    id="location"
                    value={values.location}
                    onChange={(event) =>
                      updateValue("location", event.target.value)
                    }
                    placeholder="New York, NY"
                    autoComplete="address-level2"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={values.linkedin}
                    onChange={(event) =>
                      updateValue("linkedin", event.target.value)
                    }
                    placeholder="linkedin.com/in/you"
                    autoComplete="url"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="portfolio">Portfolio / GitHub</Label>
                  <Input
                    id="portfolio"
                    value={values.portfolio}
                    onChange={(event) =>
                      updateValue("portfolio", event.target.value)
                    }
                    placeholder="github.com/you"
                    autoComplete="url"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-lg border border-border bg-card p-6 md:p-8">
              <h2 className="text-lg font-semibold tracking-tight">Resume</h2>

              <p
                id="resume-help"
                className="mt-1 text-sm text-muted-foreground"
              >
                PDF, DOC, or DOCX up to 5 MB.
              </p>

              {!file ? (
                <label
                  htmlFor="resume"
                  className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background px-6 py-12 text-center transition-colors hover:border-primary/50 hover:bg-secondary/40"
                >
                  <div className="grid size-12 place-items-center rounded-full bg-secondary text-primary">
                    <UploadCloud aria-hidden="true" className="size-6" />
                  </div>

                  <p className="mt-4 text-sm font-medium text-foreground">
                    Click to upload
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Accepted: {ACCEPTED_RESUME_EXTENSIONS.join(", ")} · Max 5 MB
                  </p>

                  <input
                    id="resume"
                    type="file"
                    accept={ACCEPTED_RESUME_EXTENSIONS.join(",")}
                    className="sr-only"
                    aria-describedby={
                      errors.resume ? "resume-error" : "resume-help"
                    }
                    aria-invalid={Boolean(errors.resume)}
                    onChange={(event) =>
                      onPickFile(event.target.files?.[0] ?? null)
                    }
                  />
                </label>
              ) : (
                <div className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
                      <FileText aria-hidden="true" className="size-5" />
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
                    onClick={() => {
                      setFile(null);
                      setErrors((current) => ({
                        ...current,
                        resume: "Attach your resume to continue.",
                      }));
                    }}
                    aria-label="Remove file"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              )}

              {errors.resume && (
                <p id="resume-error" className="mt-3 text-sm text-destructive">
                  {errors.resume}
                </p>
              )}
            </div>
          )}

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
                  <Label htmlFor="yearsExp">Years of experience *</Label>
                  <Select
                    value={values.yearsExp}
                    onValueChange={(value) => updateValue("yearsExp", value)}
                  >
                    <SelectTrigger
                      id="yearsExp"
                      aria-invalid={Boolean(errors.yearsExp)}
                      aria-describedby={
                        errors.yearsExp ? "yearsExp-error" : undefined
                      }
                    >
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">0–1 years</SelectItem>
                      <SelectItem value="2-4">2–4 years</SelectItem>
                      <SelectItem value="5-7">5–7 years</SelectItem>
                      <SelectItem value="8+">8+ years</SelectItem>
                    </SelectContent>
                  </Select>

                  {errors.yearsExp && (
                    <p id="yearsExp-error" className="text-sm text-destructive">
                      {errors.yearsExp}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="workAuth">Work authorization *</Label>
                  <Select
                    value={values.workAuth}
                    onValueChange={(value) => updateValue("workAuth", value)}
                  >
                    <SelectTrigger
                      id="workAuth"
                      aria-invalid={Boolean(errors.workAuth)}
                      aria-describedby={
                        errors.workAuth ? "workAuth-error" : undefined
                      }
                    >
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

                  {errors.workAuth && (
                    <p id="workAuth-error" className="text-sm text-destructive">
                      {errors.workAuth}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="requireSponsorship">
                    Will you require visa sponsorship?
                  </Label>
                  <Select
                    value={values.requireSponsorship}
                    onValueChange={(value) =>
                      updateValue("requireSponsorship", value)
                    }
                  >
                    <SelectTrigger id="requireSponsorship">
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
                    value={values.coverNote}
                    onChange={(event) =>
                      updateValue("coverNote", event.target.value)
                    }
                    placeholder={`Tell ${job.company_name} why you're a great fit for the ${title} role…`}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <ApplyReview
              values={values}
              resumeName={file?.name ?? "—"}
              agreeError={errors.agree}
              onAgreeChange={(checked) => updateValue("agree", checked)}
              onEdit={(targetStep) => setStep(targetStep as ApplicationStep)}
            />
          )}

          <div className="flex items-center justify-between gap-3 border-t border-border pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={step === 1 ? () => router.push(detailsPath) : goBack}
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {step === 1 ? "Cancel" : "Back"}
            </Button>

            <p className="hidden text-xs text-muted-foreground sm:block">
              Step {step} of {APPLICATION_STEPS.length}
            </p>

            {step < APPLICATION_STEPS.length ? (
              <Button type="submit">
                Continue <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={submitting || !values.agree}>
                {submitting ? (
                  <>
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                    Submitting…
                  </>
                ) : (
                  "Submit application"
                )}
              </Button>
            )}
          </div>
        </form>

        <ApplySidebar job={job} userEmail={userEmail} />
      </section>
    </main>
  );
}

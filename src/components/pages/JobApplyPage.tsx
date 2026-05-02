"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
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
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { getJobBySlug } from "@/data/jobPlatform";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = [".pdf", ".doc", ".docx"];

export default function JobApplyPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const slug = params.slug;
  const job = slug ? getJobBySlug(slug) : undefined;

  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [yearsExp, setYearsExp] = useState<string>("");
  const [workAuth, setWorkAuth] = useState<string>("");
  const [requireSponsorship, setRequireSponsorship] = useState<string>("no");
  const [agree, setAgree] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

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

  const onPickFile = (pickedFile: File | null) => {
    if (!pickedFile) return;

    const ext = `.${pickedFile.name.split(".").pop()!.toLowerCase()}`;

    if (!ACCEPTED.includes(ext)) {
      toast.error("Resume must be PDF, DOC, or DOCX.");
      return;
    }

    if (pickedFile.size > MAX_BYTES) {
      toast.error("Resume must be under 5 MB.");
      return;
    }

    setFile(pickedFile);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!userId || !job) return;

    if (!file) {
      toast.error("Please attach your resume to continue.");
      return;
    }

    if (!agree) {
      toast.error("Please confirm the information is accurate.");
      return;
    }

    setSubmitting(true);

    try {
      const ext = file.name.split(".").pop()!.toLowerCase();
      const path = `${userId}/${job.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(path, file, {
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const summary = [
        `Name: ${fullName}`,
        `Email: ${email}`,
        phone && `Phone: ${phone}`,
        location && `Location: ${location}`,
        linkedin && `LinkedIn: ${linkedin}`,
        portfolio && `Portfolio: ${portfolio}`,
        yearsExp && `Years of experience: ${yearsExp}`,
        workAuth && `Work authorization: ${workAuth}`,
        `Requires sponsorship: ${requireSponsorship}`,
        coverNote && `\nCover note:\n${coverNote}`,
      ]
        .filter(Boolean)
        .join("\n");

      console.info("Application submitted", {
        jobSlug: job.slug,
        resumePath: path,
        summary,
      });

      setDone(true);
      toast.success("Application submitted!");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Could not submit application."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!job) {
    return (
      <main className="min-h-screen bg-background">
        <SiteHeader />

        <section className="mx-auto max-w-3xl px-4 py-24 text-center">
          <Badge variant="soft">Job not found</Badge>

          <h1 className="mt-5 text-3xl font-bold tracking-tight">
            This listing isn&apos;t available
          </h1>

          <Button variant="hero" className="mt-6" asChild>
            <Link href="/jobs">Browse jobs</Link>
          </Button>
        </section>
      </main>
    );
  }

  if (authChecked && !userId) {
    return (
      <main className="min-h-screen bg-background">
        <SiteHeader />

        <section className="mx-auto max-w-2xl px-4 py-20 text-center">
          <Badge variant="soft">Sign in required</Badge>

          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Sign in to apply
          </h1>

          <p className="mt-3 text-muted-foreground">
            Create a free account or sign in to submit your application to{" "}
            {job.company}.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="hero" asChild>
              <Link href={`/signin?next=/jobs/${job.slug}/apply`}>Sign in</Link>
            </Button>

            <Button variant="glass" asChild>
              <Link href={`/signup?next=/jobs/${job.slug}/apply`}>
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
        <SiteHeader />

        <section className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="size-8" />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight">
            Application sent
          </h1>

          <p className="mt-3 text-muted-foreground">
            Your application for{" "}
            <span className="font-semibold text-foreground">{job.title}</span>{" "}
            at{" "}
            <span className="font-semibold text-foreground">{job.company}</span>{" "}
            has been delivered. The hiring team will reach out to {email} if
            there&apos;s a fit.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="hero" asChild>
              <Link href="/jobs">Browse more jobs</Link>
            </Button>

            <Button variant="glass" asChild>
              <Link href="/profile">View my profile</Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border bg-hero-gradient px-4 pb-8 pt-8">
        <div className="mx-auto max-w-5xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-3 -ml-3 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          <Badge variant="soft">Apply</Badge>

          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            {job.title}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {job.company} · {job.location} · {job.employmentType}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1fr_320px]">
        <form onSubmit={onSubmit} className="space-y-8">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
            <h2 className="text-xl font-bold tracking-tight">Your details</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  placeholder="Avery Morgan"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="you@email.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="(555) 012-4890"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location">Current location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="New York, NY"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={linkedin}
                  onChange={(event) => setLinkedin(event.target.value)}
                  placeholder="linkedin.com/in/you"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="portfolio">Portfolio / GitHub</Label>
                <Input
                  id="portfolio"
                  value={portfolio}
                  onChange={(event) => setPortfolio(event.target.value)}
                  placeholder="github.com/you"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
            <h2 className="text-xl font-bold tracking-tight">Resume</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              PDF, DOC, or DOCX up to 5 MB.
            </p>

            {!file ? (
              <label
                htmlFor="resume"
                className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background px-6 py-10 text-center transition hover:border-primary/40 hover:bg-secondary/40"
              >
                <UploadCloud className="size-8 text-primary" />

                <p className="mt-3 text-sm font-medium text-foreground">
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
                  onChange={(event) =>
                    onPickFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>
            ) : (
              <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
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

          <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
            <h2 className="text-xl font-bold tracking-tight">
              A few quick questions
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Years of experience</Label>
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
                <Label>Work authorization</Label>
                <Select value={workAuth} onValueChange={setWorkAuth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="citizen">U.S. Citizen</SelectItem>
                    <SelectItem value="permanent">Permanent resident</SelectItem>
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
                  onChange={(event) => setCoverNote(event.target.value)}
                  placeholder={`Tell ${job.company} why you're a great fit for the ${job.title} role…`}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-soft md:p-8">
            <label className="flex items-start gap-3">
              <Checkbox
                checked={agree}
                onCheckedChange={(value) => setAgree(Boolean(value))}
                className="mt-0.5"
              />

              <span className="text-sm leading-6 text-muted-foreground">
                I confirm that the information provided is accurate, and I agree
                to HireGeneral&apos;s{" "}
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Signed in as {userEmail}
            </p>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                disabled={submitting}
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
            </div>
          </div>
        </form>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-primary-gradient text-sm font-bold text-primary-foreground">
                {job.logo}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">
                  Applying for
                </p>
                <p className="truncate font-semibold">{job.title}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {job.company}
                </p>
              </div>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">{job.employmentType}</dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Work mode</dt>
                <dd className="font-medium">{job.workMode}</dd>
              </div>

              {job.salary && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Salary</dt>
                  <dd className="font-medium">{job.salary}</dd>
                </div>
              )}

              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Location</dt>
                <dd className="text-right font-medium">{job.location}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary-gradient p-6 text-primary-foreground shadow-lift">
            <h3 className="text-lg font-bold tracking-tight">
              Application tips
            </h3>

            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/85">
              <li>• Tailor your resume to highlight relevant experience.</li>
              <li>• Keep your cover note short and specific.</li>
              <li>• Double-check links to your portfolio work.</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
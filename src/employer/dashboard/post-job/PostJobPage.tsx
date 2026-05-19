"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { BenefitsSection } from "./BenefitsSection";
import { BoostSection } from "./BoostSection";
import { CandidateNotificationsSection } from "./CandidateNotificationsSection";
import { JobDescriptionSection } from "./JobDescriptionSection";
import { JobPreviewOverlay } from "./JobPreviewOverlay";
import { PayRangeSection } from "./PayRangeSection";
import { PostJobActions } from "./PostJobActions";
import { PostJobModeToggle } from "./PostJobModeToggle";
import { RoleBasicsSection } from "./RoleBasicsSection";
import { ScreeningQuestionsSection } from "./ScreeningQuestionsSection";
import {
  type EditableJob,
  type PostJobMode,
  type RemoteOption,
  type ScreeningQuestion,
} from "./post-job-content";

type SubmitStatus = "draft" | "published";

type CreatedJob = {
  id: string;
  slug: string | null;
  status: SubmitStatus;
  title: string;
  company_name: string;
};

type PostJobPageProps = {
  initialJob?: EditableJob | null;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getMoneyValue(formData: FormData, key: string) {
  const value = getString(formData, key).replace(/[$,\s]/g, "");

  return value || null;
}

function cleanScreeningQuestions(questions: ScreeningQuestion[]) {
  return questions
    .map((question) => ({
      ...question,
      question: question.question.trim(),
    }))
    .filter((question) => question.question.length > 0);
}

export function PostJobPage({ initialJob = null }: PostJobPageProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<PostJobMode>("new");
  const isEditing = Boolean(initialJob);
  const [selectedBoostId, setSelectedBoostId] = useState(
    initialJob?.boostId ?? "none",
  );
  const [remote, setRemote] = useState<RemoteOption>(
    initialJob?.remote ?? "no",
  );
  const [distance, setDistance] = useState(initialJob?.distance ?? 50);
  const [employmentType, setEmploymentType] = useState(
    initialJob?.employmentType ?? "Full-time",
  );
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([
    ...(initialJob?.benefits.length
      ? initialJob.benefits
      : ["Medical", "Paid time off"]),
  ]);
  const [screeningQuestions, setScreeningQuestions] = useState<
    ScreeningQuestion[]
  >(initialJob?.screeningQuestions ?? []);
  const [previewJob, setPreviewJob] = useState<EditableJob | null>(null);
  const [submitting, setSubmitting] = useState<SubmitStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdJob, setCreatedJob] = useState<CreatedJob | null>(null);

  function toggleBenefit(benefit: string) {
    setSelectedBenefits((currentBenefits) =>
      currentBenefits.includes(benefit)
        ? currentBenefits.filter((currentBenefit) => currentBenefit !== benefit)
        : [...currentBenefits, benefit],
    );
  }

  function buildJobPayload(formData: FormData, status: SubmitStatus) {
    return {
      id: initialJob?.id,
      title: getString(formData, "title"),
      companyName: getString(formData, "companyName"),
      location: getString(formData, "location"),
      streetAddress: getString(formData, "streetAddress"),
      remote,
      distance,
      includeRelocation: formData.has("includeRelocation"),
      employmentType,
      description: getString(formData, "description"),
      skills: getString(formData, "skills"),
      benefits: selectedBenefits,
      salaryMin: getMoneyValue(formData, "salaryMin"),
      salaryMax: getMoneyValue(formData, "salaryMax"),
      salaryCurrency: getString(formData, "salaryCurrency") || "USD",
      payFrequency: getString(formData, "payFrequency") || "Per year",
      boostId: selectedBoostId,
      notificationEmail: getString(formData, "notificationEmail"),
      screeningQuestions: cleanScreeningQuestions(screeningQuestions),
      status,
    };
  }

  function openPreview() {
    const form = formRef.current;

    if (!form) return;

    const formData = new FormData(form);
    const payload = buildJobPayload(formData, "published");

    setPreviewJob({
      id: initialJob?.id ?? "preview",
      slug: initialJob?.slug ?? null,
      status: "published",
      title: payload.title,
      companyName: payload.companyName,
      location: payload.location,
      streetAddress: payload.streetAddress,
      remote: payload.remote,
      distance: payload.distance,
      includeRelocation: payload.includeRelocation,
      employmentType: payload.employmentType,
      description: payload.description,
      skills: payload.skills,
      benefits: payload.benefits,
      salaryMin: payload.salaryMin ?? "",
      salaryMax: payload.salaryMax ?? "",
      salaryCurrency: payload.salaryCurrency,
      payFrequency: payload.payFrequency,
      boostId: payload.boostId,
      notificationEmail: payload.notificationEmail,
      screeningQuestions: payload.screeningQuestions,
    });
  }

  async function submitJob(status: SubmitStatus) {
    const form = formRef.current;

    if (!form) return;

    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);

    setSubmitting(status);
    setError(null);
    setCreatedJob(null);

    try {
      const response = await fetch("/api/employers/jobs", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildJobPayload(formData, status)),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save this job.");
      }

      setCreatedJob(payload.job);

      if (status === "published" && !isEditing) {
        form.reset();
        setRemote("no");
        setDistance(50);
        setEmploymentType("Full-time");
        setSelectedBenefits(["Medical", "Paid time off"]);
        setScreeningQuestions([]);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save this job.",
      );
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <form
      ref={formRef}
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        submitJob("published");
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">
            {isEditing ? "Edit job" : "Post a job"}
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {isEditing
              ? "Update the role, preview the candidate view, and manage screening questions."
              : "Create a new role or duplicate a previous post."}
          </p>
        </div>

        {isEditing ? null : (
          <PostJobModeToggle mode={mode} onModeChange={setMode} />
        )}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {createdJob ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <span>
            {createdJob.status === "published"
              ? isEditing
                ? "Job updated successfully."
                : "Job posted successfully."
              : "Draft saved successfully."}{" "}
            <b>{createdJob.title}</b>
          </span>

          {createdJob.status === "published" && createdJob.slug ? (
            <Link
              href={`/jobs/${createdJob.slug}`}
              className="font-semibold text-emerald-800 underline-offset-4 hover:underline"
            >
              View live role
            </Link>
          ) : null}
        </div>
      ) : null}

      <BoostSection
        selectedBoostId={selectedBoostId}
        onSelectedBoostChange={setSelectedBoostId}
      />

      <RoleBasicsSection
        remote={remote}
        onRemoteChange={setRemote}
        distance={distance}
        onDistanceChange={setDistance}
        employmentType={employmentType}
        onEmploymentTypeChange={setEmploymentType}
        defaultValues={
          initialJob
            ? {
                title: initialJob.title,
                companyName: initialJob.companyName,
                location: initialJob.location,
                streetAddress: initialJob.streetAddress,
                includeRelocation: initialJob.includeRelocation,
              }
            : undefined
        }
      />

      <JobDescriptionSection
        defaultDescription={initialJob?.description}
        defaultSkills={initialJob?.skills}
      />

      <BenefitsSection
        selectedBenefits={selectedBenefits}
        onToggleBenefit={toggleBenefit}
      />

      <PayRangeSection
        defaultValues={
          initialJob
            ? {
                salaryMin: initialJob.salaryMin,
                salaryMax: initialJob.salaryMax,
                salaryCurrency: initialJob.salaryCurrency,
                payFrequency: initialJob.payFrequency,
              }
            : undefined
        }
      />

      <CandidateNotificationsSection
        defaultEmail={initialJob?.notificationEmail}
      />

      <ScreeningQuestionsSection
        questions={screeningQuestions}
        onQuestionsChange={setScreeningQuestions}
      />

      <PostJobActions
        submitting={submitting}
        onSaveDraft={() => submitJob("draft")}
        onPreview={openPreview}
        onPostNow={() => submitJob("published")}
      />

      {previewJob ? (
        <JobPreviewOverlay
          job={previewJob}
          screeningQuestions={previewJob.screeningQuestions}
          onClose={() => setPreviewJob(null)}
        />
      ) : null}
    </form>
  );
}

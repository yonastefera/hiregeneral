"use client";

import { useState } from "react";

import { BenefitsSection } from "./BenefitsSection";
import { BoostSection } from "./BoostSection";
import { CandidateNotificationsSection } from "./CandidateNotificationsSection";
import { JobDescriptionSection } from "./JobDescriptionSection";
import { PayRangeSection } from "./PayRangeSection";
import { PostJobActions } from "./PostJobActions";
import { PostJobModeToggle } from "./PostJobModeToggle";
import { RoleBasicsSection } from "./RoleBasicsSection";
import { type PostJobMode, type RemoteOption } from "./post-job-content";

export function PostJobPage() {
  const [mode, setMode] = useState<PostJobMode>("new");
  const [selectedBoostId, setSelectedBoostId] = useState("none");
  const [remote, setRemote] = useState<RemoteOption>("no");
  const [distance, setDistance] = useState(50);
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([
    "Medical",
    "Paid time off",
  ]);

  function toggleBenefit(benefit: string) {
    setSelectedBenefits((currentBenefits) =>
      currentBenefits.includes(benefit)
        ? currentBenefits.filter((currentBenefit) => currentBenefit !== benefit)
        : [...currentBenefits, benefit],
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">
            Post a job
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Create a new role or duplicate a previous post.
          </p>
        </div>

        <PostJobModeToggle mode={mode} onModeChange={setMode} />
      </div>

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
      />

      <JobDescriptionSection />

      <BenefitsSection
        selectedBenefits={selectedBenefits}
        onToggleBenefit={toggleBenefit}
      />

      <PayRangeSection />

      <CandidateNotificationsSection />

      <PostJobActions />
    </div>
  );
}

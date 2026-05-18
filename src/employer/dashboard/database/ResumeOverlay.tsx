import { Download, FileText, X } from "lucide-react";

import { ResumeBlock } from "./ResumeBlock";
import type { ResumeMatch } from "./database-content";

type ResumeOverlayProps = {
  candidate: ResumeMatch;
  onClose: () => void;
};

export function ResumeOverlay({ candidate, onClose }: ResumeOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-neutral-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-neutral-50/80 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-emerald-600" />
            <span className="text-[13px] font-semibold">
              Resume — {candidate.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-teal-500 to-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close resume preview"
              className="grid h-8 w-8 place-items-center rounded-lg text-neutral-500 transition hover:bg-neutral-200/60 hover:text-neutral-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="mx-auto max-w-[640px] rounded-lg bg-white p-8 ring-1 ring-black/[0.04]">
            <div className="border-b border-neutral-200 pb-4">
              <h2 className="text-2xl font-semibold tracking-tight">
                {candidate.name}
              </h2>

              <div className="mt-1 text-[13px] text-neutral-600">
                {candidate.title}
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-500">
                <span>{candidate.location}</span>
                <span>{candidate.email}</span>
                <span>{candidate.phone}</span>
              </div>
            </div>

            <ResumeBlock heading="Summary">
              <p className="text-[13px] leading-relaxed text-neutral-700">
                {candidate.summary}
              </p>
            </ResumeBlock>

            <ResumeBlock heading="Experience">
              <div className="space-y-4">
                {candidate.experience.map((experience) => (
                  <div key={`${experience.company}-${experience.role}`}>
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="text-[13px] font-semibold">
                        {experience.role}
                      </div>
                      <div className="shrink-0 text-[11px] text-neutral-500">
                        {experience.period}
                      </div>
                    </div>

                    <div className="text-[12px] text-neutral-600">
                      {experience.company}
                    </div>

                    <ul className="mt-1.5 list-disc pl-4 text-[12px] text-neutral-700">
                      {experience.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </ResumeBlock>

            <ResumeBlock heading="Education">
              {candidate.education.map((education) => (
                <div
                  key={education.school}
                  className="flex items-baseline justify-between gap-4"
                >
                  <div>
                    <div className="text-[13px] font-semibold">
                      {education.school}
                    </div>
                    <div className="text-[12px] text-neutral-600">
                      {education.degree}
                    </div>
                  </div>

                  <div className="shrink-0 text-[11px] text-neutral-500">
                    {education.period}
                  </div>
                </div>
              ))}
            </ResumeBlock>

            <ResumeBlock heading="Skills">
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </ResumeBlock>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Download, ExternalLink, FileText, X } from "lucide-react";

import { ResumeBlock } from "./ResumeBlock";
import type { ResumeMatch } from "./database-content";

type ResumeOverlayProps = {
  candidate: ResumeMatch;
  onClose: () => void;
};

export function ResumeOverlay({ candidate, onClose }: ResumeOverlayProps) {
  const resumeFile = candidate.resumeFileName ?? candidate.resumeUrl ?? "";
  const canPreviewInline = Boolean(
    candidate.resumeViewUrl && resumeFile.toLowerCase().includes(".pdf"),
  );

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
            {candidate.resumeViewUrl ? (
              <a
                href={candidate.resumeViewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-teal-500 to-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white"
              >
                <Download className="h-3.5 w-3.5" />
                Open resume
              </a>
            ) : (
              <span className="rounded-lg bg-neutral-100 px-3 py-1.5 text-[12px] font-medium text-neutral-500">
                No resume file
              </span>
            )}

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
                {candidate.email ? <span>{candidate.email}</span> : null}
                {candidate.phone ? <span>{candidate.phone}</span> : null}
                {candidate.resumeFileName ? (
                  <span>{candidate.resumeFileName}</span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {candidate.levelOfExperience ? (
                  <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-700">
                    {candidate.levelOfExperience}
                  </span>
                ) : null}
                {candidate.highestDegree ? (
                  <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-700">
                    {candidate.highestDegree}
                  </span>
                ) : null}
                {candidate.industry ? (
                  <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-700">
                    {candidate.industry}
                  </span>
                ) : null}
                {candidate.minimumDesiredPay ? (
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                    Desired pay: {candidate.minimumDesiredPay}
                  </span>
                ) : null}
                {candidate.openToRelocation ? (
                  <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] text-teal-700">
                    Open to relocation
                  </span>
                ) : null}
              </div>
            </div>

            <ResumeBlock heading="Summary">
              <p className="text-[13px] leading-relaxed text-neutral-700">
                {candidate.summary}
              </p>
            </ResumeBlock>

            <ResumeBlock heading="Experience">
              {candidate.experience.length > 0 ? (
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
                        {experience.location ? ` · ${experience.location}` : ""}
                      </div>

                      {experience.bullets.length > 0 ? (
                        <ul className="mt-1.5 list-disc pl-4 text-[12px] text-neutral-700">
                          {experience.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] leading-relaxed text-neutral-600">
                  Structured experience has not been added yet. Use the resume
                  link or profile summary to review the candidate.
                </p>
              )}
            </ResumeBlock>

            {candidate.education.length > 0 ? (
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
                      {education.description ? (
                        <p className="mt-1 text-[12px] leading-relaxed text-neutral-600">
                          {education.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-[11px] text-neutral-500">
                      {education.period}
                    </div>
                  </div>
                ))}
              </ResumeBlock>
            ) : null}

            {candidate.links.length > 0 ? (
              <ResumeBlock heading="Links">
                <div className="flex flex-wrap gap-2">
                  {candidate.links.map((link) => (
                    <a
                      key={`${link.label}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-700 transition hover:bg-neutral-200"
                    >
                      {link.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </ResumeBlock>
            ) : null}

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

            {canPreviewInline && candidate.resumeViewUrl ? (
              <ResumeBlock heading="Resume file">
                <iframe
                  title={`${candidate.name} resume`}
                  src={candidate.resumeViewUrl}
                  className="h-[520px] w-full rounded-lg border border-neutral-200"
                />
              </ResumeBlock>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

import { ExternalLink, MapPin, X } from "lucide-react";

import type { EditableJob, ScreeningQuestion } from "./post-job-content";

type JobPreviewOverlayProps = {
  job: EditableJob;
  screeningQuestions: ScreeningQuestion[];
  onClose: () => void;
};

function formatSalary(job: EditableJob) {
  if (!job.salaryMin && !job.salaryMax) return null;

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: job.salaryCurrency || "USD",
    maximumFractionDigits: 0,
  });

  if (job.salaryMin && job.salaryMax) {
    return `${formatter.format(Number(job.salaryMin))} - ${formatter.format(
      Number(job.salaryMax),
    )} ${job.payFrequency.toLowerCase()}`;
  }

  return `${formatter.format(Number(job.salaryMin || job.salaryMax))} ${job.payFrequency.toLowerCase()}`;
}

export function JobPreviewOverlay({
  job,
  screeningQuestions,
  onClose,
}: JobPreviewOverlayProps) {
  const salary = formatSalary(job);
  const skills = job.skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/45 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <article
        className="mx-auto my-6 max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Candidate preview
            </p>
            <h2 className="text-lg font-semibold text-neutral-950">
              {job.title || "Untitled role"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="grid h-9 w-9 place-items-center rounded-xl text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <section>
            <p className="text-sm font-semibold text-neutral-700">
              {job.companyName || "Company"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location || "Location"}
              </span>
              <span>{job.employmentType}</span>
              <span>{job.remote === "yes" ? "Remote" : "On-site"}</span>
              {salary ? <span>{salary}</span> : null}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-neutral-950">
              About the role
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-neutral-600">
              {job.description || "Add a job description to preview the role."}
            </p>
          </section>

          {skills.length > 0 ? (
            <section>
              <h3 className="text-sm font-semibold text-neutral-950">Skills</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {screeningQuestions.length > 0 ? (
            <section>
              <h3 className="text-sm font-semibold text-neutral-950">
                Application questions
              </h3>
              <div className="mt-2 space-y-2">
                {screeningQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="rounded-xl border border-neutral-100 bg-neutral-50 p-3"
                  >
                    <p className="text-sm font-medium text-neutral-800">
                      {question.question}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {question.required ? "Required" : "Optional"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <div className="rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 p-4 text-white">
            <p className="text-base font-semibold">Ready to apply?</p>
            <p className="mt-1 text-sm text-white/80">
              Candidates will see this listing before submitting their
              application.
            </p>
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-950"
            >
              Apply now
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

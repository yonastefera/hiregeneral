import { Briefcase, MapPin, Star } from "lucide-react";

import type { Candidate, CandidateStatus } from "./candidates-content";

type CandidateCardProps = {
  candidate: Candidate;
};

const statusClassNames: Record<CandidateStatus, string> = {
  New: "bg-emerald-50 text-emerald-700",
  Interview: "bg-violet-50 text-violet-700",
  Reviewed: "bg-neutral-100 text-neutral-600",
};

export function CandidateCard({ candidate }: CandidateCardProps) {
  const initials = candidate.name
    .split(" ")
    .map((namePart) => namePart[0])
    .join("");

  return (
    <article className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 transition-colors hover:bg-white/80">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-neutral-900 to-neutral-700 text-[12px] font-semibold text-white">
          {initials}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-semibold">{candidate.name}</h2>

            <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-teal-50 to-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              <Star className="h-2.5 w-2.5" />
              {candidate.match}% match
            </span>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-neutral-500">
            <span>{candidate.role}</span>

            <span className="inline-flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" />
              {candidate.location}
            </span>

            <span>{candidate.experience}</span>

            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-2.5 w-2.5" />
              {candidate.job}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-neutral-400">
            Applied
          </div>
          <div className="text-[12px] font-medium">{candidate.applied}</div>
        </div>

        <span
          className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
            statusClassNames[candidate.status]
          }`}
        >
          {candidate.status}
        </span>

        <button
          type="button"
          className="rounded-lg bg-neutral-100 px-3.5 py-2 text-[12px] font-medium text-neutral-700 transition hover:bg-neutral-200/60"
        >
          View
        </button>

        <button
          type="button"
          className="rounded-lg bg-neutral-900 px-3.5 py-2 text-[12px] font-semibold text-white transition hover:bg-neutral-800"
        >
          Message
        </button>
      </div>
    </article>
  );
}

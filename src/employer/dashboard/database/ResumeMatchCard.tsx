import { FileText, MapPin, MessageSquare } from "lucide-react";

import type { ResumeMatch } from "./database-content";

type ResumeMatchCardProps = {
  candidate: ResumeMatch;
  onViewResume: () => void;
};

export function ResumeMatchCard({
  candidate,
  onViewResume,
}: ResumeMatchCardProps) {
  const initials = candidate.name
    .split(" ")
    .map((namePart) => namePart[0])
    .join("");

  return (
    <article className="rounded-2xl bg-white p-4 transition-transform hover:scale-[1.01]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-neutral-900 to-neutral-700 text-[12px] font-semibold text-white">
            {initials}
          </div>

          <div>
            <h2 className="text-[13px] font-semibold">{candidate.name}</h2>
            <p className="text-[11px] text-neutral-500">{candidate.title}</p>
          </div>
        </div>

        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 text-[12px] font-bold text-emerald-700">
          {candidate.match}
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-2 text-[11px] text-neutral-500">
        <MapPin className="h-3 w-3" />
        {candidate.location}

        {candidate.openToOffers ? (
          <span className="ml-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
            Open to offers
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1">
        {candidate.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-700"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 flex gap-1.5">
        <button
          type="button"
          onClick={onViewResume}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-gradient-to-b from-teal-500 to-emerald-600 px-3 py-2 text-[12px] font-semibold text-white"
        >
          <FileText className="h-3.5 w-3.5" />
          View resume
        </button>

        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-neutral-100 px-3 py-2 text-[12px] font-medium text-neutral-700 transition hover:bg-neutral-200/60"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Message
        </button>
      </div>
    </article>
  );
}

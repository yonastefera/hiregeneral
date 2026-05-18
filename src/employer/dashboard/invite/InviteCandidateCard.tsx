import { Briefcase, Check, MapPin, Send } from "lucide-react";

import type { RecommendedCandidate } from "./invite-content";

type InviteCandidateCardProps = {
  candidate: RecommendedCandidate;
  invited: boolean;
  onConnect: () => void;
};

export function InviteCandidateCard({
  candidate,
  invited,
  onConnect,
}: InviteCandidateCardProps) {
  const initials = candidate.name
    .split(" ")
    .map((namePart) => namePart[0])
    .join("");

  return (
    <article className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-neutral-900 to-neutral-700 text-[12px] font-semibold text-white">
          {initials}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-semibold">{candidate.name}</h2>

            <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-teal-50 to-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              {candidate.match}% match
            </span>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-neutral-500">
            <span>{candidate.title}</span>

            <span className="inline-flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" />
              {candidate.location}
            </span>

            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-2.5 w-2.5" />
              {candidate.experience}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap gap-1">
            {candidate.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {invited ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3.5 py-2 text-[12px] font-semibold text-emerald-700">
            <Check className="h-3.5 w-3.5" />
            Invite sent
          </span>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-teal-500 to-emerald-600 px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:scale-[1.02]"
          >
            <Send className="h-3.5 w-3.5" />
            Connect
          </button>
        )}
      </div>
    </article>
  );
}

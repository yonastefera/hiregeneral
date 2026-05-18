import { Send, X } from "lucide-react";

import type { RecommendedCandidate } from "./invite-content";

type InviteMessageOverlayProps = {
  candidate: RecommendedCandidate;
  message: string;
  onMessageChange: (value: string) => void;
  onClose: () => void;
  onSendInvite: () => void;
};

export function InviteMessageOverlay({
  candidate,
  message,
  onMessageChange,
  onClose,
  onSendInvite,
}: InviteMessageOverlayProps) {
  const initials = candidate.name
    .split(" ")
    .map((namePart) => namePart[0])
    .join("");

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-neutral-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-neutral-900 to-neutral-700 text-[11px] font-semibold text-white">
              {initials}
            </div>

            <div>
              <h2 className="text-[13px] font-semibold">{candidate.name}</h2>
              <p className="text-[11px] text-neutral-500">{candidate.title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close invite message"
            className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pb-4">
          <label
            htmlFor="invite-message"
            className="mb-1 block text-[11px] font-medium text-neutral-600"
          >
            Personal message
          </label>

          <textarea
            id="invite-message"
            rows={6}
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            className="min-h-[140px] w-full rounded-lg bg-neutral-50 p-3 text-[13px] outline-none transition focus:bg-white focus:ring-2 focus:ring-emerald-400/40"
          />

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-neutral-100 px-4 py-2 text-[12px] font-semibold text-neutral-700 transition hover:bg-neutral-200/60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSendInvite}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-teal-500 to-emerald-600 px-4 py-2 text-[12px] font-semibold text-white"
            >
              <Send className="h-3.5 w-3.5" />
              Send invite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

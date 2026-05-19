import type { FormEvent } from "react";
import { Loader2, Paperclip, Send } from "lucide-react";

type MessageComposerProps = {
  draft: string;
  sending: boolean;
  disabled: boolean;
  onDraftChange: (value: string) => void;
  onSend: (event: FormEvent<HTMLFormElement>) => void;
};

export function MessageComposer({
  draft,
  sending,
  disabled,
  onDraftChange,
  onSend,
}: MessageComposerProps) {
  return (
    <form
      className="flex items-center gap-2 border-t border-neutral-100 p-3"
      onSubmit={onSend}
    >
      <button
        type="button"
        aria-label="Attach file"
        disabled={disabled || sending}
        className="grid h-9 w-9 place-items-center rounded-lg text-neutral-500 transition hover:bg-neutral-100"
      >
        <Paperclip className="h-4 w-4" />
      </button>

      <input
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        placeholder="Write a message…"
        disabled={disabled || sending}
        className="h-10 flex-1 rounded-lg bg-neutral-50 px-3.5 text-[13px] outline-none transition focus:bg-white focus:ring-2 focus:ring-emerald-400/40"
      />

      <button
        type="submit"
        disabled={disabled || sending || !draft.trim()}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-gradient-to-b from-teal-500 to-emerald-600 px-4 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Send className="h-3.5 w-3.5" />
        )}
        {sending ? "Sending" : "Send"}
      </button>
    </form>
  );
}

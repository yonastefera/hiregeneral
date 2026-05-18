import { Paperclip, Send } from "lucide-react";

export function MessageComposer() {
  return (
    <div className="flex items-center gap-2 border-t border-neutral-100 p-3">
      <button
        type="button"
        aria-label="Attach file"
        className="grid h-9 w-9 place-items-center rounded-lg text-neutral-500 transition hover:bg-neutral-100"
      >
        <Paperclip className="h-4 w-4" />
      </button>

      <input
        placeholder="Write a message…"
        className="h-10 flex-1 rounded-lg bg-neutral-50 px-3.5 text-[13px] outline-none transition focus:bg-white focus:ring-2 focus:ring-emerald-400/40"
      />

      <button
        type="button"
        className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-gradient-to-b from-teal-500 to-emerald-600 px-4 text-[12px] font-semibold text-white"
      >
        <Send className="h-3.5 w-3.5" />
        Send
      </button>
    </div>
  );
}

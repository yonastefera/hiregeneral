import { Save, Send } from "lucide-react";

export function PostJobActions() {
  return (
    <div className="sticky bottom-3 flex flex-wrap items-center justify-end gap-2 rounded-xl bg-white/85 p-3 ring-1 ring-black/4 backdrop-blur-xl">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-4 py-2 text-[13px] font-semibold text-neutral-700 transition hover:bg-neutral-200/60"
      >
        <Save className="h-3.5 w-3.5" />
        Save draft
      </button>

      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-b from-teal-500 to-emerald-600 px-5 py-2 text-[13px] font-semibold text-white transition-transform hover:scale-[1.02]"
      >
        <Send className="h-3.5 w-3.5" />
        Post now
      </button>
    </div>
  );
}

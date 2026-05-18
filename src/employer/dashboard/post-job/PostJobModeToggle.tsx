import { Copy } from "lucide-react";

import type { PostJobMode } from "./post-job-content";

type PostJobModeToggleProps = {
  mode: PostJobMode;
  onModeChange: (mode: PostJobMode) => void;
};

const modes: { id: PostJobMode; label: string }[] = [
  {
    id: "new",
    label: "Create new",
  },
  {
    id: "duplicate",
    label: "Duplicate previous",
  },
];

export function PostJobModeToggle({
  mode,
  onModeChange,
}: PostJobModeToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-white p-0.5 ring-1 ring-black/[0.04]">
      {modes.map((modeOption) => (
        <button
          key={modeOption.id}
          type="button"
          onClick={() => onModeChange(modeOption.id)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
            mode === modeOption.id
              ? "bg-neutral-900 text-white"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          {modeOption.id === "duplicate" ? <Copy className="h-3 w-3" /> : null}
          {modeOption.label}
        </button>
      ))}
    </div>
  );
}

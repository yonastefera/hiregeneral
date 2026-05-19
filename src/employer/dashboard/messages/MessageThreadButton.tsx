import { getInitials, type MessageThread } from "./messages-content";

type MessageThreadButtonProps = {
  thread: MessageThread;
  active: boolean;
  onClick: () => void;
};

export function MessageThreadButton({
  thread,
  active,
  onClick,
}: MessageThreadButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors ${
        active
          ? "bg-gradient-to-r from-emerald-50/70 to-transparent"
          : "hover:bg-neutral-50"
      }`}
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-neutral-900 to-neutral-700 text-[10px] font-semibold text-white">
        {getInitials(thread.name)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate text-[13px] font-semibold">
            {thread.name}
          </div>

          <div className="shrink-0 text-[10px] text-neutral-400">
            {thread.time}
          </div>
        </div>

        <div className="text-[11px] text-neutral-500">{thread.role}</div>

        <div className="mt-0.5 truncate text-[11px] text-neutral-600">
          {thread.preview}
        </div>

        {thread.jobTitle ? (
          <div className="mt-1 truncate text-[10px] text-neutral-400">
            {thread.jobTitle}
          </div>
        ) : null}
      </div>

      {thread.unread > 0 ? (
        <span className="grid h-4 min-w-4 place-items-center rounded-full bg-gradient-to-b from-teal-500 to-emerald-600 px-1 text-[9px] font-semibold text-white">
          {thread.unread}
        </span>
      ) : null}
    </button>
  );
}

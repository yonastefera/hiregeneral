import { Search } from "lucide-react";

import { MessageThreadButton } from "./MessageThreadButton";
import type { MessageThread } from "./messages-content";

type MessagesSidebarProps = {
  threads: MessageThread[];
  activeThreadId: number;
  onActiveThreadChange: (threadId: number) => void;
};

export function MessagesSidebar({
  threads,
  activeThreadId,
  onActiveThreadChange,
}: MessagesSidebarProps) {
  return (
    <aside className="border-r border-neutral-100">
      <div className="p-4">
        <h1 className="text-[16px] font-semibold">Messages</h1>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />

          <input
            placeholder="Search conversations"
            className="h-9 w-full rounded-lg bg-neutral-50 pl-9 pr-3 text-[13px] outline-none transition focus:bg-white focus:ring-2 focus:ring-emerald-400/40"
          />
        </div>
      </div>

      <div className="overflow-y-auto">
        {threads.map((thread) => (
          <MessageThreadButton
            key={thread.id}
            thread={thread}
            active={activeThreadId === thread.id}
            onClick={() => onActiveThreadChange(thread.id)}
          />
        ))}
      </div>
    </aside>
  );
}

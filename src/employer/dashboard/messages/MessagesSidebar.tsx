import { Search } from "lucide-react";

import { MessageThreadButton } from "./MessageThreadButton";
import type { MessageThread } from "./messages-content";

type MessagesSidebarProps = {
  threads: MessageThread[];
  activeThreadId: string | null;
  onActiveThreadChange: (threadId: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
};

export function MessagesSidebar({
  threads,
  activeThreadId,
  onActiveThreadChange,
  search,
  onSearchChange,
}: MessagesSidebarProps) {
  return (
    <aside className="border-r border-neutral-100">
      <div className="p-4">
        <h1 className="text-[16px] font-semibold">Messages</h1>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />

          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search conversations"
            className="h-9 w-full rounded-lg bg-neutral-50 pl-9 pr-3 text-[13px] outline-none transition focus:bg-white focus:ring-2 focus:ring-emerald-400/40"
          />
        </div>
      </div>

      <div className="overflow-y-auto">
        {threads.length > 0 ? (
          threads.map((thread) => (
            <MessageThreadButton
              key={thread.id}
              thread={thread}
              active={activeThreadId === thread.id}
              onClick={() => onActiveThreadChange(thread.id)}
            />
          ))
        ) : (
          <div className="px-4 py-8 text-center text-[12px] text-neutral-500">
            No conversations yet.
          </div>
        )}
      </div>
    </aside>
  );
}

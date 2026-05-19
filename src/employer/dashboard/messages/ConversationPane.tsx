import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { MessageComposer } from "./MessageComposer";
import { MessageBubble } from "./MessageBubble";
import {
  getInitials,
  type ConversationMessage,
  type MessageThread,
} from "./messages-content";

type ConversationPaneProps = {
  thread: MessageThread | null;
  messages: ConversationMessage[];
  draft: string;
  sending: boolean;
  loading: boolean;
  onDraftChange: (value: string) => void;
  onSend: (event: FormEvent<HTMLFormElement>) => void;
};

export function ConversationPane({
  thread,
  messages,
  draft,
  sending,
  loading,
  onDraftChange,
  onSend,
}: ConversationPaneProps) {
  return (
    <section className="flex flex-col">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-neutral-900 to-neutral-700 text-[10px] font-semibold text-white">
            {thread ? getInitials(thread.name) : "HG"}
          </div>

          <div>
            <h2 className="text-[13px] font-semibold">
              {thread?.name ?? "Messages"}
            </h2>
            <p className="text-[11px] text-neutral-500">
              {thread?.role ?? "Select a conversation"}
            </p>
          </div>
        </div>

        {thread ? (
          <a
            href={`/employers/dashboard/database?candidate=${thread.candidateId}`}
            className="rounded-lg bg-neutral-100 px-3 py-1.5 text-[11px] font-medium transition hover:bg-neutral-200/60"
          >
            View profile
          </a>
        ) : null}
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto bg-neutral-50/40 p-5">
        {loading ? (
          <div className="flex h-full items-center justify-center text-[12px] text-neutral-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading messages...
          </div>
        ) : messages.length > 0 ? (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        ) : (
          <div className="flex h-full items-center justify-center text-center text-[12px] text-neutral-500">
            {thread
              ? "No messages in this conversation yet."
              : "Choose a candidate conversation to start."}
          </div>
        )}
      </div>

      <MessageComposer
        draft={draft}
        sending={sending}
        disabled={!thread}
        onDraftChange={onDraftChange}
        onSend={onSend}
      />
    </section>
  );
}

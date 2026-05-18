import { MessageComposer } from "./MessageComposer";
import { MessageBubble } from "./MessageBubble";
import {
  getInitials,
  type ConversationMessage,
  type MessageThread,
} from "./messages-content";

type ConversationPaneProps = {
  thread: MessageThread;
  messages: ConversationMessage[];
};

export function ConversationPane({ thread, messages }: ConversationPaneProps) {
  return (
    <section className="flex flex-col">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-neutral-900 to-neutral-700 text-[10px] font-semibold text-white">
            {getInitials(thread.name)}
          </div>

          <div>
            <h2 className="text-[13px] font-semibold">{thread.name}</h2>
            <p className="text-[11px] text-neutral-500">{thread.role}</p>
          </div>
        </div>

        <button
          type="button"
          className="rounded-lg bg-neutral-100 px-3 py-1.5 text-[11px] font-medium transition hover:bg-neutral-200/60"
        >
          View profile
        </button>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto bg-neutral-50/40 p-5">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      <MessageComposer />
    </section>
  );
}

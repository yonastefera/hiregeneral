import type { ConversationMessage } from "./messages-content";

type MessageBubbleProps = {
  message: ConversationMessage;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isMine = message.from === "me";

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-md rounded-2xl px-3.5 py-2 text-[13px] ${
          isMine
            ? "bg-gradient-to-b from-teal-500 to-emerald-600 text-white"
            : "bg-white text-neutral-800"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <time
          dateTime={message.createdAt}
          className={`mt-1 block text-[10px] ${
            isMine ? "text-white/70" : "text-neutral-400"
          }`}
        >
          {message.time}
        </time>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

import { ConversationPane } from "./ConversationPane";
import { MessagesSidebar } from "./MessagesSidebar";
import { conversationMessages, messageThreads } from "./messages-content";

export function MessagesPage() {
  const [activeThreadId, setActiveThreadId] = useState(1);

  const activeThread = useMemo(() => {
    return (
      messageThreads.find((thread) => thread.id === activeThreadId) ??
      messageThreads[0]
    );
  }, [activeThreadId]);

  return (
    <div className="h-[calc(100vh-6rem)]">
      <div className="grid h-full grid-cols-1 overflow-hidden rounded-2xl bg-white md:grid-cols-[300px_1fr]">
        <MessagesSidebar
          threads={messageThreads}
          activeThreadId={activeThreadId}
          onActiveThreadChange={setActiveThreadId}
        />

        <ConversationPane
          thread={activeThread}
          messages={conversationMessages}
        />
      </div>
    </div>
  );
}

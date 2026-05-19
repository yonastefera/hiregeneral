"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConversationPane } from "./ConversationPane";
import { MessagesSidebar } from "./MessagesSidebar";
import type { EmployerMessagesData } from "./messages-content";

type MessagesPageProps = {
  initialData: EmployerMessagesData;
};

export function MessagesPage({ initialData }: MessagesPageProps) {
  const [data, setData] = useState(initialData);
  const [activeThreadId, setActiveThreadId] = useState(
    initialData.activeThreadId,
  );
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return data.threads;

    return data.threads.filter((thread) =>
      [thread.name, thread.role, thread.preview, thread.jobTitle]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [data.threads, search]);

  const activeThread = useMemo(() => {
    return (
      data.threads.find((thread) => thread.id === activeThreadId) ??
      data.threads[0] ??
      null
    );
  }, [activeThreadId, data.threads]);

  async function loadConversation(threadId: string) {
    setActiveThreadId(threadId);
    setLoadingMessages(true);

    try {
      const response = await fetch(
        `/api/employers/messages?conversationId=${encodeURIComponent(threadId)}`,
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load messages.");
      }

      setData(payload.data);
      setActiveThreadId(payload.data.activeThreadId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not load messages.",
      );
    } finally {
      setLoadingMessages(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = draft.trim();
    const conversationId = activeThread?.id;

    if (!body || !conversationId || sending) return;

    setSending(true);
    setDraft("");

    try {
      const response = await fetch("/api/employers/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          body,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not send message.");
      }

      setData(payload.data);
      setActiveThreadId(payload.data.activeThreadId);
    } catch (error) {
      setDraft(body);
      toast.error(
        error instanceof Error ? error.message : "Could not send message.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="h-[calc(100vh-6rem)]">
      <div className="grid h-full grid-cols-1 overflow-hidden rounded-2xl bg-white md:grid-cols-[300px_1fr]">
        <MessagesSidebar
          threads={filteredThreads}
          activeThreadId={activeThreadId}
          search={search}
          onSearchChange={setSearch}
          onActiveThreadChange={loadConversation}
        />

        <ConversationPane
          thread={activeThread}
          messages={data.messages}
          draft={draft}
          sending={sending}
          loading={loadingMessages}
          onDraftChange={setDraft}
          onSend={sendMessage}
        />
      </div>
    </div>
  );
}

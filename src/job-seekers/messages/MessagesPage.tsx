"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthUser } from "@/hooks/useAuthUser";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Conversation = {
  id: string;
  participant_one: string;
  participant_two: string;
  job_id: string | null;
  last_message_at: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

const POLL_MS = 5000;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) return "Unknown date";

  return dateFormatter.format(new Date(timestamp));
}

function formatTime(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) return "";

  return timeFormatter.format(new Date(timestamp));
}

function getOtherParticipant(conversation: Conversation, userId: string) {
  return conversation.participant_one === userId
    ? conversation.participant_two
    : conversation.participant_one;
}

function getParticipantLabel(participantId: string) {
  return `User ${participantId.slice(0, 6)}`;
}

function getParticipantInitials(participantId: string) {
  return participantId.slice(0, 2).toUpperCase();
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuthUser();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeId) ??
      null,
    [conversations, activeId],
  );

  const activeParticipant = useMemo(() => {
    if (!activeConversation || !user) return null;

    return getOtherParticipant(activeConversation, user.id);
  }, [activeConversation, user]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
      });
    });
  };

  useEffect(() => {
    if (authLoading) return;

    const userId = user?.id;

    if (!userId) {
      router.replace("/signin?next=/messages");
      return;
    }

    let active = true;

    async function loadConversations() {
      try {
        const { data, error } = await supabase
          .from("conversations")
          .select("*")
          .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
          .order("last_message_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (!active) return;

        const nextConversations = data ?? [];

        setConversations(nextConversations);

        setActiveId((currentActiveId) => {
          if (
            currentActiveId &&
            nextConversations.some(
              (conversation) => conversation.id === currentActiveId,
            )
          ) {
            return currentActiveId;
          }

          return nextConversations[0]?.id ?? null;
        });
      } catch {
        if (!active) return;

        toast.error("Could not load conversations.");
      } finally {
        if (active) {
          setLoadingConversations(false);
        }
      }
    }

    loadConversations();

    const intervalId = window.setInterval(loadConversations, POLL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [authLoading, user, router]);

  useEffect(() => {
    if (activeId === null) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    const conversationId: string = activeId;
    let active = true;

    async function loadMessages() {
      setLoadingMessages(true);

      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) {
          throw error;
        }

        if (!active) return;

        setMessages(data ?? []);
        scrollToBottom();
      } catch {
        if (!active) return;

        toast.error("Could not load messages.");
      } finally {
        if (active) {
          setLoadingMessages(false);
        }
      }
    }

    loadMessages();

    const intervalId = window.setInterval(loadMessages, POLL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [activeId]);

  const send = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const body = draft.trim();
    const userId = user?.id;
    const conversationId = activeId;

    if (!userId || !conversationId || !body || sending) return;

    setSending(true);
    setDraft("");

    const previousMessages = messages;
    const optimisticMessage: Message = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: userId,
      body,
      created_at: new Date().toISOString(),
    };

    setMessages((currentMessages) => [...currentMessages, optimisticMessage]);
    scrollToBottom();

    try {
      const sentAt = new Date().toISOString();

      const { error: messageError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: userId,
        body,
      });

      if (messageError) {
        throw messageError;
      }

      const { error: conversationError } = await supabase
        .from("conversations")
        .update({
          last_message_at: sentAt,
        })
        .eq("id", conversationId);

      if (conversationError) {
        throw conversationError;
      }

      const { data, error: refreshError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (refreshError) {
        throw refreshError;
      }

      setMessages(data ?? []);
      scrollToBottom();
    } catch {
      setMessages(previousMessages);
      setDraft(body);
      toast.error("Could not send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-6xl px-4 py-8">
        <Badge variant="soft">Inbox</Badge>

        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Messages
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Direct messages with employers and candidates.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside
            aria-label="Conversations"
            className="rounded-lg border border-border bg-card"
          >
            {authLoading || loadingConversations ? (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center justify-center p-6 text-sm text-muted-foreground"
              >
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <EmptyConversations />
            ) : (
              <ul className="divide-y divide-border">
                {conversations.map((conversation) => {
                  const otherParticipant = user
                    ? getOtherParticipant(conversation, user.id)
                    : "";
                  const isActive = activeId === conversation.id;

                  return (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        aria-current={isActive ? "true" : undefined}
                        onClick={() => setActiveId(conversation.id)}
                        className={cn(
                          "flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                          isActive && "bg-secondary/60",
                        )}
                      >
                        <span
                          aria-hidden
                          className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground"
                        >
                          {getParticipantInitials(otherParticipant)}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {getParticipantLabel(otherParticipant)}
                          </span>

                          <span className="block truncate text-xs text-muted-foreground">
                            {formatDate(conversation.last_message_at)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <section
            aria-labelledby="messages-panel-heading"
            className="flex min-h-[60vh] flex-col rounded-lg border border-border bg-card"
          >
            <div className="border-b border-border p-4">
              <h2
                id="messages-panel-heading"
                className="text-base font-semibold text-foreground"
              >
                {activeParticipant
                  ? getParticipantLabel(activeParticipant)
                  : "Conversation"}
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                {activeConversation
                  ? "Messages in this conversation"
                  : "Select a conversation to start chatting."}
              </p>
            </div>

            {!activeConversation ? (
              <div className="grid flex-1 place-items-center p-8 text-center text-sm text-muted-foreground">
                Select a conversation to start chatting.
              </div>
            ) : (
              <>
                <div
                  ref={scrollRef}
                  role="log"
                  aria-live="polite"
                  aria-relevant="additions text"
                  className="flex-1 space-y-3 overflow-y-auto p-4"
                >
                  {loadingMessages ? (
                    <div
                      role="status"
                      aria-live="polite"
                      className="flex items-center justify-center py-6 text-sm text-muted-foreground"
                    >
                      <Loader2
                        className="mr-2 size-4 animate-spin"
                        aria-hidden
                      />
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No messages in this conversation yet.
                    </p>
                  ) : (
                    messages.map((message) => {
                      const mine = message.sender_id === user?.id;

                      return (
                        <article
                          key={message.id}
                          aria-label={
                            mine ? "Message from you" : "Message from them"
                          }
                          className={cn(
                            "flex",
                            mine ? "justify-end" : "justify-start",
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                              mine
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground",
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {message.body}
                            </p>

                            <time
                              dateTime={message.created_at}
                              className={cn(
                                "mt-1 block text-[10px]",
                                mine
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground",
                              )}
                            >
                              {formatTime(message.created_at)}
                            </time>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={send}
                  className="flex items-center gap-2 border-t border-border p-3"
                >
                  <label htmlFor="message-draft" className="sr-only">
                    Write a message
                  </label>

                  <Input
                    id="message-draft"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Write a message…"
                    autoComplete="off"
                    disabled={sending}
                  />

                  <Button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    aria-label={sending ? "Sending message" : "Send message"}
                  >
                    {sending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Send className="size-4" aria-hidden />
                    )}
                  </Button>
                </form>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function EmptyConversations() {
  return (
    <div className="p-6 text-center">
      <MessageSquare
        className="mx-auto size-7 text-muted-foreground"
        aria-hidden
      />

      <h2 className="mt-3 text-sm font-medium">No conversations yet</h2>

      <p className="mt-1 text-xs text-muted-foreground">
        When an employer messages you about an application, threads will appear
        here.
      </p>
    </div>
  );
}

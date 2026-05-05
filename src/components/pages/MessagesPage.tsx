"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Send } from "lucide-react";

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

export default function MessagesPage() {
  const { user, loading } = useAuthUser();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/signin");
      return;
    }

    let cancelled = false;

    const loadConversations = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (cancelled) return;

      setConversations(data ?? []);

      if (data && data.length > 0) {
        setActiveId((currentActiveId) => currentActiveId ?? data[0].id);
      }
    };

    loadConversations();

    const intervalId = window.setInterval(loadConversations, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user, loading, router]);

  useEffect(() => {
    if (!activeId) return;

    let cancelled = false;

    const scrollToBottom = () => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
        });
      });
    };

    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      setMessages(data ?? []);
      scrollToBottom();
    };

    loadMessages();

    const intervalId = window.setInterval(loadMessages, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeId]);

  const send = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || !activeId || !draft.trim()) return;

    setSending(true);

    const body = draft.trim();
    const sentAt = new Date().toISOString();

    setDraft("");

    await supabase.from("messages").insert({
      conversation_id: activeId,
      sender_id: user.id,
      body,
    });

    await supabase
      .from("conversations")
      .update({
        last_message_at: sentAt,
      })
      .eq("id", activeId);

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", activeId)
      .order("created_at", { ascending: true });

    setMessages(data ?? []);
    setSending(false);

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
      });
    });
  };

  const active = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeId) ??
      null,
    [conversations, activeId],
  );

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
          <aside className="rounded-lg border border-border bg-card">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="mx-auto size-7 text-muted-foreground" />

                <p className="mt-3 text-sm font-medium">No conversations yet</p>

                <p className="mt-1 text-xs text-muted-foreground">
                  When an employer messages you about an application, threads
                  will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {conversations.map((conversation) => {
                  const otherParticipant =
                    conversation.participant_one === user?.id
                      ? conversation.participant_two
                      : conversation.participant_one;

                  return (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        onClick={() => setActiveId(conversation.id)}
                        className={cn(
                          "flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-secondary/40",
                          activeId === conversation.id && "bg-secondary/60",
                        )}
                      >
                        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground">
                          {otherParticipant.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            User {otherParticipant.slice(0, 6)}
                          </p>

                          <p className="truncate text-xs text-muted-foreground">
                            {new Date(
                              conversation.last_message_at,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <div className="flex min-h-[60vh] flex-col rounded-lg border border-border bg-card">
            {!active ? (
              <div className="grid flex-1 place-items-center p-8 text-center text-sm text-muted-foreground">
                Select a conversation to start chatting.
              </div>
            ) : (
              <>
                <div
                  ref={scrollRef}
                  className="flex-1 space-y-3 overflow-y-auto p-4"
                >
                  {messages.map((message) => {
                    const mine = message.sender_id === user?.id;

                    return (
                      <div
                        key={message.id}
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
                          <p>{message.body}</p>

                          <p
                            className={cn(
                              "mt-1 text-[10px]",
                              mine
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground",
                            )}
                          >
                            {new Date(message.created_at).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form
                  onSubmit={send}
                  className="flex items-center gap-2 border-t border-border p-3"
                >
                  <Input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Write a message…"
                  />

                  <Button type="submit" disabled={!draft.trim() || sending}>
                    <Send className="size-4" />
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

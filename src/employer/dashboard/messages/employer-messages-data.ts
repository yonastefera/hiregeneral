import { createClient } from "@/lib/supabase/server";

import type { EmployerMessagesData } from "./messages-content";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type ConversationRow = {
  id: string;
  participant_one: string;
  participant_two: string;
  job_id: string | null;
  last_message_at: string;
  created_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  headline: string | null;
  email: string | null;
};

type JobRow = {
  id: string;
  title: string;
};

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function getOtherParticipant(conversation: ConversationRow, userId: string) {
  return conversation.participant_one === userId
    ? conversation.participant_two
    : conversation.participant_one;
}

function formatThreadTime(value: string) {
  const date = new Date(value);
  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) return "";

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "now";
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) return `${diffHours}h`;

  return `${Math.floor(diffHours / 24)}d`;
}

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return timeFormatter.format(date);
}

function getProfileLabel(profile: ProfileRow | undefined, userId: string) {
  return (
    profile?.full_name?.trim() ||
    profile?.email ||
    `Candidate ${userId.slice(0, 6)}`
  );
}

export async function getEmployerMessagesData(params: {
  supabase: SupabaseServerClient;
  recruiterId: string;
  conversationId?: string | null;
}): Promise<EmployerMessagesData> {
  const { supabase, recruiterId } = params;
  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select(
      "id, participant_one, participant_two, job_id, last_message_at, created_at",
    )
    .or(`participant_one.eq.${recruiterId},participant_two.eq.${recruiterId}`)
    .order("last_message_at", { ascending: false })
    .limit(80);

  if (conversationsError) {
    console.error(
      "[getEmployerMessagesData:conversations]",
      conversationsError,
    );

    return {
      threads: [],
      activeThreadId: null,
      messages: [],
    };
  }

  const conversationRows = (conversations ?? []) as ConversationRow[];

  if (conversationRows.length === 0) {
    return {
      threads: [],
      activeThreadId: null,
      messages: [],
    };
  }

  const conversationIds = conversationRows.map(
    (conversation) => conversation.id,
  );
  const participantIds = Array.from(
    new Set(
      conversationRows.map((conversation) =>
        getOtherParticipant(conversation, recruiterId),
      ),
    ),
  );
  const jobIds = Array.from(
    new Set(
      conversationRows
        .map((conversation) => conversation.job_id)
        .filter((jobId): jobId is string => Boolean(jobId)),
    ),
  );

  const [profilesResult, jobsResult, recentMessagesResult] = await Promise.all([
    participantIds.length > 0
      ? supabase
          .from("profiles")
          .select("user_id, full_name, headline, email")
          .in("user_id", participantIds)
      : Promise.resolve({ data: [], error: null }),
    jobIds.length > 0
      ? supabase.from("jobs").select("id, title").in("id", jobIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, read_at, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false })
      .limit(240),
  ]);

  if (profilesResult.error) {
    console.error("[getEmployerMessagesData:profiles]", profilesResult.error);
  }

  if (jobsResult.error) {
    console.error("[getEmployerMessagesData:jobs]", jobsResult.error);
  }

  if (recentMessagesResult.error) {
    console.error(
      "[getEmployerMessagesData:recentMessages]",
      recentMessagesResult.error,
    );
  }

  const profilesByUserId = new Map(
    ((profilesResult.data ?? []) as ProfileRow[]).map((profile) => [
      profile.user_id,
      profile,
    ]),
  );
  const jobsById = new Map(
    ((jobsResult.data ?? []) as JobRow[]).map((job) => [job.id, job]),
  );
  const latestMessagesByConversationId = new Map<string, MessageRow>();
  const unreadByConversationId = new Map<string, number>();

  for (const message of (recentMessagesResult.data ?? []) as MessageRow[]) {
    if (!latestMessagesByConversationId.has(message.conversation_id)) {
      latestMessagesByConversationId.set(message.conversation_id, message);
    }

    if (message.sender_id !== recruiterId && !message.read_at) {
      unreadByConversationId.set(
        message.conversation_id,
        (unreadByConversationId.get(message.conversation_id) ?? 0) + 1,
      );
    }
  }

  const activeConversation =
    conversationRows.find(
      (conversation) => conversation.id === params.conversationId,
    ) ?? conversationRows[0];
  const { data: activeMessages, error: activeMessagesError } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, read_at, created_at")
    .eq("conversation_id", activeConversation.id)
    .order("created_at", { ascending: true })
    .limit(120);

  if (activeMessagesError) {
    console.error(
      "[getEmployerMessagesData:activeMessages]",
      activeMessagesError,
    );
  }

  const threads = conversationRows.map((conversation) => {
    const candidateId = getOtherParticipant(conversation, recruiterId);
    const profile = profilesByUserId.get(candidateId);
    const latestMessage = latestMessagesByConversationId.get(conversation.id);
    const job = conversation.job_id ? jobsById.get(conversation.job_id) : null;
    const name = getProfileLabel(profile, candidateId);

    return {
      id: conversation.id,
      candidateId,
      name,
      role: profile?.headline?.trim() || job?.title || "Candidate",
      preview: latestMessage?.body || "No messages yet.",
      time: formatThreadTime(
        latestMessage?.created_at ?? conversation.created_at,
      ),
      unread: unreadByConversationId.get(conversation.id) ?? 0,
      jobTitle: job?.title ?? null,
    };
  });

  return {
    threads,
    activeThreadId: activeConversation.id,
    messages: ((activeMessages ?? []) as MessageRow[]).map((message) => ({
      id: message.id,
      from: message.sender_id === recruiterId ? "me" : "them",
      text: message.body,
      time: formatMessageTime(message.created_at),
      createdAt: message.created_at,
    })),
  };
}

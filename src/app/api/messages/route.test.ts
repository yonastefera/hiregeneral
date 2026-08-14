import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonRequest } from "@/test/api-request";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  duplicate: vi.fn(),
  limit: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/rate-limit", () => ({
  userMessageRateLimit: { limit: mocks.limit },
}));
vi.mock("@/lib/security/abuse", () => ({
  enforceDuplicateCooldown: mocks.duplicate,
}));

import { POST } from "@/app/api/messages/route";

const userId = "11111111-1111-4111-8111-111111111111";
const conversationId = "22222222-2222-4222-8222-222222222222";

function request(body: unknown) {
  return new NextRequest(jsonRequest("/api/messages", "POST", body));
}

function createSupabase(options?: {
  user?: object | null;
  conversation?: object | null;
  conversationError?: object | null;
  insertError?: object | null;
}) {
  const conversation = {
    select: vi.fn(),
    eq: vi.fn(),
    or: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data:
        options?.conversation === undefined
          ? { id: conversationId }
          : options.conversation,
      error: options?.conversationError ?? null,
    }),
  };
  conversation.select.mockReturnValue(conversation);
  conversation.eq.mockReturnValue(conversation);
  conversation.or.mockReturnValue(conversation);

  const messages = {
    insert: vi.fn().mockResolvedValue({ error: options?.insertError ?? null }),
  };
  const update = {
    update: vi.fn(),
    eq: vi.fn().mockResolvedValue({ error: null }),
  };
  update.update.mockReturnValue(update);
  let conversationCalls = 0;

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: options?.user === undefined ? { id: userId } : options.user,
        },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "messages") return messages;
      conversationCalls += 1;
      return conversationCalls === 1 ? conversation : update;
    }),
    conversation,
    messages,
    update,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
  mocks.duplicate.mockResolvedValue(null);
  mocks.createClient.mockResolvedValue(createSupabase());
});

describe("POST /api/messages", () => {
  it("requires authentication", async () => {
    mocks.createClient.mockResolvedValue(createSupabase({ user: null }));
    const response = await POST(request({ conversationId, body: "Hello" }));
    expect(response.status).toBe(401);
    expect(mocks.limit).not.toHaveBeenCalled();
  });

  it.each([
    { conversationId: "invalid", body: "Hello" },
    { conversationId, body: "Hello", sender_id: "attacker-controlled" },
  ])("rejects invalid and unknown fields", async (body) => {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
  });

  it("rate limits repeated messages", async () => {
    mocks.limit.mockResolvedValue({
      success: false,
      reset: Date.now() + 30_000,
    });
    const response = await POST(request({ conversationId, body: "Hello" }));
    expect(response.status).toBe(429);
  });

  it("enforces duplicate-message cooldowns", async () => {
    mocks.duplicate.mockResolvedValue(
      NextResponse.json({ error: "Duplicate request." }, { status: 429 }),
    );
    const response = await POST(request({ conversationId, body: "Hello" }));
    expect(response.status).toBe(429);
  });

  it("rejects conversations that do not include the user", async () => {
    const supabase = createSupabase({ conversation: null });
    mocks.createClient.mockResolvedValue(supabase);
    const response = await POST(request({ conversationId, body: "Hello" }));
    expect(response.status).toBe(404);
    expect(supabase.conversation.or).toHaveBeenCalledWith(
      `participant_one.eq.${userId},participant_two.eq.${userId}`,
    );
  });

  it("uses the authenticated user as message sender", async () => {
    const supabase = createSupabase();
    mocks.createClient.mockResolvedValue(supabase);
    const response = await POST(
      request({ conversationId, body: "  Hello there  " }),
    );
    expect(response.status).toBe(200);
    expect(supabase.messages.insert).toHaveBeenCalledWith({
      conversation_id: conversationId,
      sender_id: userId,
      body: "Hello there",
    });
  });

  it("does not expose database errors", async () => {
    mocks.createClient.mockResolvedValue(
      createSupabase({
        insertError: { code: "DB100", message: "private database detail" },
      }),
    );
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const response = await POST(request({ conversationId, body: "Hello" }));
    const payload = await response.json();
    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Could not send the message." });
    expect(JSON.stringify(payload)).not.toContain("private database detail");
    consoleError.mockRestore();
  });
});

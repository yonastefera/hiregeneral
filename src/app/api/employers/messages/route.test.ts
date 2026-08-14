import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonRequest } from "@/test/api-request";

const mocks = vi.hoisted(() => ({
  duplicate: vi.fn(),
  getMessages: vi.fn(),
  limit: vi.fn(),
  loadEntitlements: vi.fn(),
  requireEmployer: vi.fn(),
}));

vi.mock("@/lib/auth/require-employer-user", () => ({
  requireEmployerUser: mocks.requireEmployer,
}));
vi.mock("@/lib/rate-limit", () => ({
  employerMessageRateLimit: { limit: mocks.limit },
}));
vi.mock("@/lib/security/abuse", () => ({
  enforceDuplicateCooldown: mocks.duplicate,
}));
vi.mock("@/lib/billing/entitlements", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/billing/entitlements")>();
  return { ...original, loadEmployerEntitlements: mocks.loadEntitlements };
});
vi.mock("@/employer/dashboard/messages/employer-messages-data", () => ({
  getEmployerMessagesData: mocks.getMessages,
}));

import { POST } from "@/app/api/employers/messages/route";

const user = { id: "11111111-1111-4111-8111-111111111111", email: "r@test" };
const conversationId = "22222222-2222-4222-8222-222222222222";

function request(body: unknown) {
  return new NextRequest(jsonRequest("/api/employers/messages", "POST", body));
}

function createSupabase(options?: {
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
  mocks.loadEntitlements.mockResolvedValue({
    messagesUsed: 0,
    messageLimit: 100,
  });
  mocks.getMessages.mockResolvedValue({ conversations: [], messages: [] });
  mocks.requireEmployer.mockResolvedValue({
    user,
    supabase: createSupabase(),
    status: 200,
  });
});

describe("POST /api/employers/messages", () => {
  it.each([401, 403])(
    "enforces employer authorization (%i)",
    async (status) => {
      mocks.requireEmployer.mockResolvedValue({
        user: null,
        error: status === 401 ? "Unauthorized" : "Employer role required",
        status,
      });
      const response = await POST(request({ conversationId, body: "Hello" }));
      expect(response.status).toBe(status);
    },
  );

  it.each([
    { conversationId: "invalid", body: "Hello" },
    { conversationId, body: "Hello", sender_id: "attacker-controlled" },
  ])("rejects invalid and unknown fields", async (body) => {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
  });

  it("enforces rate limits", async () => {
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

  it("enforces message entitlements", async () => {
    mocks.loadEntitlements.mockResolvedValue({
      messagesUsed: 10,
      messageLimit: 10,
    });
    const response = await POST(request({ conversationId, body: "Hello" }));
    expect(response.status).toBe(403);
  });

  it("rejects conversations that do not include the recruiter", async () => {
    const supabase = createSupabase({ conversation: null });
    mocks.requireEmployer.mockResolvedValue({ user, supabase, status: 200 });
    const response = await POST(request({ conversationId, body: "Hello" }));
    expect(response.status).toBe(404);
    expect(supabase.conversation.or).toHaveBeenCalledWith(
      `participant_one.eq.${user.id},participant_two.eq.${user.id}`,
    );
  });

  it("sends a message with the authenticated recruiter as sender", async () => {
    const supabase = createSupabase();
    mocks.requireEmployer.mockResolvedValue({ user, supabase, status: 200 });
    const response = await POST(request({ conversationId, body: "  Hello  " }));
    expect(response.status).toBe(200);
    expect(supabase.messages.insert).toHaveBeenCalledWith({
      conversation_id: conversationId,
      sender_id: user.id,
      body: "Hello",
    });
    expect(mocks.getMessages).toHaveBeenCalledWith(
      expect.objectContaining({ recruiterId: user.id, conversationId }),
    );
  });

  it("does not expose database errors", async () => {
    const supabase = createSupabase({
      insertError: { code: "DB100", message: "private detail" },
    });
    mocks.requireEmployer.mockResolvedValue({ user, supabase, status: 200 });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const response = await POST(request({ conversationId, body: "Hello" }));
    const payload = await response.json();
    expect(response.status).toBe(500);
    expect(JSON.stringify(payload)).not.toContain("private detail");
    consoleError.mockRestore();
  });
});

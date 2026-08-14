import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  boundedJsonBody,
  enforceRateLimit,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";
import { userMessageRateLimit } from "@/lib/rate-limit";
import { enforceDuplicateCooldown } from "@/lib/security/abuse";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const messageSchema = z
  .object({
    conversationId: z.string().uuid(),
    body: z.string().trim().min(1).max(5_000),
  })
  .strict();

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await enforceRateLimit({
    limiter: userMessageRateLimit,
    key: user.id,
    context: "user_message_send",
  });
  if (limited) return limited;

  const body = await boundedJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = messageSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid message." },
      { status: 400 },
    );
  }

  const duplicate = await enforceDuplicateCooldown({
    scope: "user_message",
    actorKey: user.id,
    content: `${parsed.data.conversationId}\n${parsed.data.body}`,
    ttlSeconds: 15,
  });
  if (duplicate) return duplicate;

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", parsed.data.conversationId)
    .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
    .maybeSingle();

  if (conversationError) {
    logServerError(
      "user_message_conversation_lookup_failed",
      conversationError,
    );
    return safeServerError("Could not send the message.");
  }
  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation was not found." },
      { status: 404 },
    );
  }

  const sentAt = new Date().toISOString();
  const { error: insertError } = await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_id: user.id,
    body: parsed.data.body,
  });
  if (insertError) {
    logServerError("user_message_insert_failed", insertError);
    return safeServerError("Could not send the message.");
  }

  const { error: updateError } = await supabase
    .from("conversations")
    .update({ last_message_at: sentAt })
    .eq("id", conversation.id);
  if (updateError) {
    logServerError("user_message_conversation_update_failed", updateError);
  }

  return NextResponse.json({ sent: true });
}

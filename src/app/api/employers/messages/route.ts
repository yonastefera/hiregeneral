import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getEmployerMessagesData } from "@/employer/dashboard/messages/employer-messages-data";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";
import {
  entitlementDenied,
  loadEmployerEntitlements,
} from "@/lib/billing/entitlements";
import {
  boundedJsonBody,
  enforceRateLimit,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";
import { employerMessageRateLimit } from "@/lib/rate-limit";
import { enforceDuplicateCooldown } from "@/lib/security/abuse";

export const runtime = "nodejs";

const sendMessageSchema = z
  .object({
    conversationId: z.string().uuid(),
    body: z.string().trim().min(1).max(5000),
  })
  .strict();

export async function GET(request: NextRequest) {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const conversationId = request.nextUrl.searchParams.get("conversationId");
  const data = await getEmployerMessagesData({
    supabase: auth.supabase,
    recruiterId: auth.user.id,
    conversationId,
  });

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limited = await enforceRateLimit({
    limiter: employerMessageRateLimit,
    key: auth.user.id,
    context: "employer_message_send",
  });
  if (limited) return limited;

  const bodyResult = await boundedJsonBody(request);
  if (!bodyResult.ok) return bodyResult.response;
  const parsed = sendMessageSchema.safeParse(bodyResult.data);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please enter a message.",
        fields: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const { conversationId, body } = parsed.data;

  try {
    const entitlements = await loadEmployerEntitlements(auth.supabase);
    if (entitlements.messagesUsed >= entitlements.messageLimit) {
      return entitlementDenied(
        "Your monthly messaging limit has been reached.",
      );
    }
  } catch (error) {
    logServerError("employer_message_entitlement_load_failed", error);
    return safeServerError("Could not send the message.");
  }
  const duplicate = await enforceDuplicateCooldown({
    scope: "employer_message",
    actorKey: auth.user.id,
    content: `${conversationId}\n${body}`,
    ttlSeconds: 15,
  });
  if (duplicate) return duplicate;

  const { data: conversation, error: conversationError } = await auth.supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .or(`participant_one.eq.${auth.user.id},participant_two.eq.${auth.user.id}`)
    .maybeSingle();

  if (conversationError) {
    logServerError(
      "employer_message_conversation_lookup_failed",
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
  const { error: insertError } = await auth.supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: auth.user.id,
    body,
  });

  if (insertError) {
    if (insertError.code === "P0001") {
      return entitlementDenied("Your messaging entitlement is unavailable.");
    }
    logServerError("employer_message_insert_failed", insertError);
    return safeServerError("Could not send the message.");
  }

  const { error: updateError } = await auth.supabase
    .from("conversations")
    .update({
      last_message_at: sentAt,
    })
    .eq("id", conversationId);

  if (updateError) {
    logServerError("employer_message_conversation_update_failed", updateError);
  }

  const data = await getEmployerMessagesData({
    supabase: auth.supabase,
    recruiterId: auth.user.id,
    conversationId,
  });

  return NextResponse.json({ data });
}

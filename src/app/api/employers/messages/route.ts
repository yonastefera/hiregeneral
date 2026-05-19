import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getEmployerMessagesData } from "@/employer/dashboard/messages/employer-messages-data";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";

export const runtime = "nodejs";

const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
});

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

  const rawBody = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(rawBody);

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
  const { data: conversation, error: conversationError } = await auth.supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .or(`participant_one.eq.${auth.user.id},participant_two.eq.${auth.user.id}`)
    .maybeSingle();

  if (conversationError) {
    return NextResponse.json(
      { error: conversationError.message },
      { status: 500 },
    );
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
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { error: updateError } = await auth.supabase
    .from("conversations")
    .update({
      last_message_at: sentAt,
    })
    .eq("id", conversationId);

  if (updateError) {
    console.error("[employerMessages:updateConversation]", updateError);
  }

  const data = await getEmployerMessagesData({
    supabase: auth.supabase,
    recruiterId: auth.user.id,
    conversationId,
  });

  return NextResponse.json({ data });
}

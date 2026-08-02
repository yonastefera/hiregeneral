import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  boundedJsonBody,
  enforceRateLimit,
  JSON_BODY_LIMITS,
  logServerError,
  requestIp,
  safeServerError,
} from "@/lib/http/api-security";
import { contactSubmissionRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  company: z.string().trim().max(160).optional().default(""),
  audience: z
    .enum(["job_seeker", "employer", "partner", "general"])
    .default("general"),
  topic: z
    .enum([
      "candidate_support",
      "employer_sales",
      "billing",
      "privacy",
      "accessibility",
      "partnership",
      "general",
    ])
    .default("general"),
  subject: z.string().trim().max(160).optional().default(""),
  message: z.string().trim().min(20).max(2_000),
  sourcePath: z.string().trim().max(240).optional().default("/contact"),
  website: z.string().trim().max(240).optional().default(""),
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sendContactNotification(params: {
  id: string;
  name: string;
  email: string;
  company: string;
  audience: string;
  topic: string;
  subject: string;
  message: string;
  sourcePath: string;
}) {
  const to = process.env.CONTACT_TO_EMAIL;
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!to || !apiKey) return;

  const subject = params.subject || `New ${params.topic} contact request`;
  const companyLine = params.company
    ? `<p><strong>Company:</strong> ${escapeHtml(params.company)}</p>`
    : "";

  fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "HireGeneral <no-reply@hiregeneral.com>",
      to,
      reply_to: params.email,
      subject: `[HireGeneral Contact] ${subject}`,
      html: `
        <p><strong>Contact ID:</strong> ${escapeHtml(params.id)}</p>
        <p><strong>Name:</strong> ${escapeHtml(params.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(params.email)}</p>
        ${companyLine}
        <p><strong>Audience:</strong> ${escapeHtml(params.audience)}</p>
        <p><strong>Topic:</strong> ${escapeHtml(params.topic)}</p>
        <p><strong>Source:</strong> ${escapeHtml(params.sourcePath)}</p>
        <hr />
        <p>${escapeHtml(params.message).replaceAll("\n", "<br />")}</p>
      `,
    }),
  }).catch((error) => {
    logServerError("contact_notification_failed", error);
  });
}

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit({
    limiter: contactSubmissionRateLimit,
    key: requestIp(request),
    context: "contact_submission",
  });
  if (limited) return limited;

  const body = await boundedJsonBody(request, JSON_BODY_LIMITS.small);
  if (!body.ok) return body.response;

  const parsed = contactSchema.safeParse(body.data);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the contact form and try again." },
      { status: 400 },
    );
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("contact_messages")
      .insert({
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company || null,
        audience: parsed.data.audience,
        topic: parsed.data.topic,
        subject: parsed.data.subject || null,
        message: parsed.data.message,
        source_path: parsed.data.sourcePath || "/contact",
        user_agent: request.headers.get("user-agent"),
      })
      .select("id")
      .single();

    if (error) {
      logServerError("contact_insert_failed", error);
      return safeServerError("Could not send your message.");
    }

    if (data) {
      sendContactNotification({
        id: data.id,
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company,
        audience: parsed.data.audience,
        topic: parsed.data.topic,
        subject: parsed.data.subject,
        message: parsed.data.message,
        sourcePath: parsed.data.sourcePath || "/contact",
      });
    }

    return NextResponse.json({ ok: true, id: data?.id }, { status: 201 });
  } catch (error) {
    logServerError("contact_submission_failed", error);
    return safeServerError("Could not send your message.");
  }
}

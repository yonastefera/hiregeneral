import { NextRequest, NextResponse } from "next/server";

import { employerApplicationUpdateSchema } from "@/lib/applications/status";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";
import {
  boundedJsonBody,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";
import { employerApplicationRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireEmployerUser();
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rateLimit = await employerApplicationRateLimit.limit(auth.user.id);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many application updates. Please try again later." },
      { status: 429 },
    );
  }

  const { id } = await context.params;
  const body = await boundedJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = employerApplicationUpdateSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Choose a valid status and keep the response under 1,000 characters.",
      },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await auth.supabase.rpc(
      "employer_update_application_status",
      {
        p_application_id: id,
        p_status: parsed.data.status,
        p_note: parsed.data.note || null,
      },
    );

    if (error) {
      if (error.code === "42501") {
        return NextResponse.json(
          { error: "Application not found." },
          { status: 404 },
        );
      }
      if (error.code === "22023") {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    logServerError("employer_application_update_failed", error);
    return safeServerError("Could not update this application.");
  }
}

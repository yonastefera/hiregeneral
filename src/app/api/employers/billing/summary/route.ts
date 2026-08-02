import { NextResponse } from "next/server";

import { getEmployerBillingSummary } from "@/employer/dashboard/subscription/employer-billing-data";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";
import { logServerError, safeServerError } from "@/lib/http/api-security";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const summary = await getEmployerBillingSummary({
      supabase: auth.supabase,
      recruiterId: auth.user.id,
      email: auth.user.email,
    });

    return NextResponse.json({ summary });
  } catch (error) {
    logServerError("billing_summary_load_failed", error);
    return safeServerError("Could not load billing summary.");
  }
}

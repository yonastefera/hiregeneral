import { NextResponse } from "next/server";

import { getEmployerBillingSummary } from "@/employer/dashboard/subscription/employer-billing-data";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";

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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load billing summary.",
      },
      { status: 500 },
    );
  }
}

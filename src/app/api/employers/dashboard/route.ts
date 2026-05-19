import { NextResponse } from "next/server";

import { getEmployerDashboardData } from "@/employer/dashboard/overview/employer-dashboard-data";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const data = await getEmployerDashboardData();

  return NextResponse.json(data);
}

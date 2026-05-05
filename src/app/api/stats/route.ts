// app/api/stats/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();

  const [
    { count: totalJobs },
    { count: totalUsers },
    { count: totalApplications },
    { count: totalCompanies },
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase.from("companies").select("*", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    totalJobs: totalJobs ?? 0,
    totalUsers: totalUsers ?? 0,
    totalApplications: totalApplications ?? 0,
    totalCompanies: totalCompanies ?? 0,
  });
}

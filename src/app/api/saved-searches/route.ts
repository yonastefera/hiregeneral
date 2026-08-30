import { NextResponse } from "next/server";

import {
  boundedJsonBody,
  enforceRateLimit,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";
import { savedSearchRateLimit } from "@/lib/rate-limit";
import {
  savedSearchFieldsSchema,
  toSavedSearchInsert,
} from "@/lib/saved-searches/schema";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    logServerError("saved_searches_load_failed", error);
    return safeServerError("Could not load saved searches.");
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await enforceRateLimit({
    limiter: savedSearchRateLimit,
    key: user.id,
    context: "saved_search_create",
  });
  if (limited) return limited;

  const body = await boundedJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = savedSearchFieldsSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the saved search details." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("saved_searches")
    .insert(toSavedSearchInsert(parsed.data, user.id))
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You already have a saved search with that name." },
        { status: 409 },
      );
    }
    logServerError("saved_search_create_failed", error);
    return safeServerError("Could not save this search.");
  }

  return NextResponse.json({ data }, { status: 201 });
}

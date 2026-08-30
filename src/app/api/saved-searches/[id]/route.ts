import { NextResponse } from "next/server";
import { z } from "zod";

import {
  boundedJsonBody,
  enforceRateLimit,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";
import { savedSearchRateLimit } from "@/lib/rate-limit";
import {
  toSavedSearchUpdate,
  updateSavedSearchSchema,
} from "@/lib/saved-searches/schema";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();
type SavedSearchRouteContext = { params: Promise<{ id: string }> };

async function authenticatedRequest(id: string) {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { error: "invalid" as const };

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { error: "unauthorized" as const };
  return { supabase, user, id: parsedId.data };
}

export async function PATCH(
  request: Request,
  context: SavedSearchRouteContext,
) {
  const { id } = await context.params;
  const auth = await authenticatedRequest(id);
  if (auth.error === "invalid") {
    return NextResponse.json(
      { error: "Invalid saved search." },
      { status: 400 },
    );
  }
  if (auth.error === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await enforceRateLimit({
    limiter: savedSearchRateLimit,
    key: auth.user.id,
    context: "saved_search_update",
  });
  if (limited) return limited;

  const body = await boundedJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = updateSavedSearchSchema.safeParse(body.data);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { error: "Please provide a saved search change." },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase
    .from("saved_searches")
    .update(toSavedSearchUpdate(parsed.data))
    .eq("id", auth.id)
    .eq("user_id", auth.user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You already have a saved search with that name." },
        { status: 409 },
      );
    }
    logServerError("saved_search_update_failed", error);
    return safeServerError("Could not update this saved search.");
  }
  if (!data) {
    return NextResponse.json(
      { error: "Saved search not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  context: SavedSearchRouteContext,
) {
  const { id } = await context.params;
  const auth = await authenticatedRequest(id);
  if (auth.error === "invalid") {
    return NextResponse.json(
      { error: "Invalid saved search." },
      { status: 400 },
    );
  }
  if (auth.error === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await enforceRateLimit({
    limiter: savedSearchRateLimit,
    key: auth.user.id,
    context: "saved_search_delete",
  });
  if (limited) return limited;

  const { error, count } = await auth.supabase
    .from("saved_searches")
    .delete({ count: "exact" })
    .eq("id", auth.id)
    .eq("user_id", auth.user.id);

  if (error) {
    logServerError("saved_search_delete_failed", error);
    return safeServerError("Could not delete this saved search.");
  }
  if (!count) {
    return NextResponse.json(
      { error: "Saved search not found." },
      { status: 404 },
    );
  }

  return new NextResponse(null, { status: 204 });
}

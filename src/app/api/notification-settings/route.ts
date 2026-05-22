import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type NotificationPreferenceKey =
  | "jobAlerts"
  | "applicationUpdates"
  | "savedJobReminders"
  | "marketingEmails";

type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

const defaultPreferences: NotificationPreferences = {
  jobAlerts: true,
  applicationUpdates: true,
  savedJobReminders: true,
  marketingEmails: false,
};

function normalizePreferences(value: unknown): NotificationPreferences {
  if (!value || typeof value !== "object") {
    return defaultPreferences;
  }

  const maybePrefs = value as Partial<
    Record<NotificationPreferenceKey, unknown>
  >;

  return {
    jobAlerts:
      typeof maybePrefs.jobAlerts === "boolean"
        ? maybePrefs.jobAlerts
        : defaultPreferences.jobAlerts,
    applicationUpdates:
      typeof maybePrefs.applicationUpdates === "boolean"
        ? maybePrefs.applicationUpdates
        : defaultPreferences.applicationUpdates,
    savedJobReminders:
      typeof maybePrefs.savedJobReminders === "boolean"
        ? maybePrefs.savedJobReminders
        : defaultPreferences.savedJobReminders,
    marketingEmails:
      typeof maybePrefs.marketingEmails === "boolean"
        ? maybePrefs.marketingEmails
        : defaultPreferences.marketingEmails,
  };
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Could not load notification settings." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: normalizePreferences(data.notification_preferences),
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const preferences = normalizePreferences(body?.preferences);

  const { error } = await supabase
    .from("profiles")
    .update({
      notification_preferences: preferences,
    })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Could not save notification settings." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: preferences,
  });
}

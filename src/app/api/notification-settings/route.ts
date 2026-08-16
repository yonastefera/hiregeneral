import { NextResponse } from "next/server";
import { z } from "zod";

import {
  boundedJsonBody,
  enforceRateLimit,
  logServerError,
} from "@/lib/http/api-security";
import { notificationSettingsRateLimit } from "@/lib/rate-limit";
import { recordPrivilegedAction } from "@/lib/security/audit";
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

const preferencesSchema = z
  .object({
    preferences: z
      .object({
        jobAlerts: z.boolean(),
        applicationUpdates: z.boolean(),
        savedJobReminders: z.boolean(),
        marketingEmails: z.boolean(),
      })
      .strict(),
  })
  .strict();

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

  const limited = await enforceRateLimit({
    limiter: notificationSettingsRateLimit,
    key: user.id,
    context: "notification_settings_update",
  });
  if (limited) return limited;

  const body = await boundedJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = preferencesSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check your notification settings." },
      { status: 400 },
    );
  }
  const preferences = parsed.data.preferences;

  const { error } = await supabase
    .from("profiles")
    .update({
      notification_preferences: preferences,
    })
    .eq("user_id", user.id);

  if (error) {
    logServerError("notification_settings_update_failed", error);
    return NextResponse.json(
      { error: "Could not save notification settings." },
      { status: 500 },
    );
  }

  await recordPrivilegedAction({
    action: "account.communication_preferences_updated",
    targetType: "user",
    targetId: user.id,
    metadata: {
      source: "account_settings",
      job_alerts: preferences.jobAlerts,
      application_updates: preferences.applicationUpdates,
      saved_job_reminders: preferences.savedJobReminders,
      marketing_emails: preferences.marketingEmails,
    },
  });

  return NextResponse.json({
    data: preferences,
  });
}

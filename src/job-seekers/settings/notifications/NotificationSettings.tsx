"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Loader2,
  Mail,
  RotateCcw,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type NotificationPreferenceKey =
  | "jobAlerts"
  | "applicationUpdates"
  | "savedJobReminders"
  | "marketingEmails";

type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

type PreferenceConfig = {
  key: NotificationPreferenceKey;
  title: string;
  description: string;
  icon: typeof Bell;
};

const defaultPreferences: NotificationPreferences = {
  jobAlerts: true,
  applicationUpdates: true,
  savedJobReminders: true,
  marketingEmails: false,
};

const preferenceSections: PreferenceConfig[] = [
  {
    key: "jobAlerts",
    title: "Job alerts",
    description:
      "Receive email alerts when new jobs match your saved searches and profile.",
    icon: BriefcaseBusiness,
  },
  {
    key: "applicationUpdates",
    title: "Application updates",
    description:
      "Receive updates when an application is submitted, reviewed, or changes status.",
    icon: CheckCircle2,
  },
  {
    key: "savedJobReminders",
    title: "Saved job reminders",
    description:
      "Get reminders about saved jobs before they become inactive or close.",
    icon: Bell,
  },
  {
    key: "marketingEmails",
    title: "Product and hiring tips",
    description:
      "Receive occasional product updates, hiring insights, and job-search tips.",
    icon: Mail,
  },
];

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

export default function NotificationSettings() {
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);
  const [initialPreferences, setInitialPreferences] =
    useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hasChanges = useMemo(
    () => JSON.stringify(preferences) !== JSON.stringify(initialPreferences),
    [preferences, initialPreferences],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadPreferences() {
      setLoading(true);

      try {
        const response = await fetch("/api/notification-settings", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 404) {
          setPreferences(defaultPreferences);
          setInitialPreferences(defaultPreferences);
          return;
        }

        if (!response.ok) {
          throw new Error("Could not load notification settings.");
        }

        const body = await response.json();
        const normalized = normalizePreferences(body.data ?? body);

        if (controller.signal.aborted) return;

        setPreferences(normalized);
        setInitialPreferences(normalized);
      } catch (error) {
        if (controller.signal.aborted) return;

        toast.error(
          error instanceof Error
            ? error.message
            : "Could not load notification settings.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadPreferences();

    return () => {
      controller.abort();
    };
  }, []);

  const updatePreference = (
    key: NotificationPreferenceKey,
    checked: boolean,
  ) => {
    setPreferences((current) => ({
      ...current,
      [key]: checked,
    }));
  };

  const resetChanges = () => {
    setPreferences(initialPreferences);
  };

  const savePreferences = async () => {
    if (!hasChanges || saving) return;

    setSaving(true);

    try {
      const response = await fetch("/api/notification-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferences,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not save notification settings.");
      }

      setInitialPreferences(preferences);
      toast.success("Notification settings saved.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save notification settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="soft">Settings</Badge>

            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Notification settings
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Choose which notifications you want to receive from HireGeneral.
            </p>
          </div>

          <Button variant="outline" asChild>
            <Link href="/account/settings">Back to account</Link>
          </Button>
        </div>

        {loading ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-8 flex items-center justify-center rounded-lg border border-border bg-card p-12 text-muted-foreground"
          >
            <Loader2 className="mr-2 size-5 animate-spin" aria-hidden={true} />
            Loading notification settings...
          </div>
        ) : (
          <>
            <div className="mt-8 space-y-4">
              {preferenceSections.map((item) => (
                <PreferenceCard
                  key={item.key}
                  title={item.title}
                  description={item.description}
                  icon={item.icon}
                >
                  <Switch
                    checked={preferences[item.key]}
                    onCheckedChange={(checked) =>
                      updatePreference(item.key, checked)
                    }
                    aria-label={`${item.title}: ${
                      preferences[item.key] ? "enabled" : "disabled"
                    }`}
                  />
                </PreferenceCard>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={!hasChanges || saving}
                onClick={resetChanges}
              >
                <RotateCcw className="mr-2 size-4" aria-hidden={true} />
                Reset changes
              </Button>

              <Button
                type="button"
                disabled={!hasChanges || saving}
                onClick={savePreferences}
              >
                {saving ? (
                  <Loader2
                    className="mr-2 size-4 animate-spin"
                    aria-hidden={true}
                  />
                ) : (
                  <Save className="mr-2 size-4" aria-hidden={true} />
                )}
                {saving ? "Saving..." : "Save settings"}
              </Button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function PreferenceCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const headingId = `${title.toLowerCase().replace(/\s+/g, "-")}-setting`;

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-6"
    >
      <div className="flex items-start gap-3">
        <Icon className="size-5 shrink-0 text-primary" aria-hidden={true} />

        <div>
          <h2
            id={headingId}
            className="text-base font-semibold text-foreground"
          >
            {title}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

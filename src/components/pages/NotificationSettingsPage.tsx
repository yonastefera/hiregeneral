"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuthUser } from "@/hooks/useAuthUser";
import { supabase } from "@/lib/supabase/client";

type Prefs = {
  daily_job_alerts: boolean;
  instant_match_alerts: boolean;
  application_status_updates: boolean;
  profile_activity: boolean;
  employer_messages: boolean;
  hiregeneral_communications: boolean;
  unsubscribed_all: boolean;
};

const DEFAULT_PREFS: Prefs = {
  daily_job_alerts: true,
  instant_match_alerts: true,
  application_status_updates: true,
  profile_activity: true,
  employer_messages: true,
  hiregeneral_communications: false,
  unsubscribed_all: false,
};

const SECTIONS: { key: keyof Prefs; title: string; description: string }[] = [
  {
    key: "daily_job_alerts",
    title: "Job recommendations — Daily Job Alerts",
    description: "Recommended jobs based on your job search activity.",
  },
  {
    key: "instant_match_alerts",
    title: "Instant match alerts",
    description:
      "Instant notifications when you match to a job, powered by our smart matching technology.",
  },
  {
    key: "application_status_updates",
    title: "Application status updates",
    description:
      "Updates to your job applications, including when it is received, viewed, rated, or closed by the employer, and other updates related to your job search.",
  },
  {
    key: "profile_activity",
    title: "Profile activity",
    description:
      "Receive information about which companies are viewing your profile, updates on your saved and viewed jobs, suggestions for improving your profile, and more.",
  },
  {
    key: "employer_messages",
    title: "Messages from employers",
    description:
      "Notifications when an employer contacts you about your job application.",
  },
  {
    key: "hiregeneral_communications",
    title: "Communications from HireGeneral",
    description:
      "Product updates, feature announcements, and occasional research invitations.",
  },
];

export default function NotificationSettingsPage() {
  const { user, loading } = useAuthUser();
  const router = useRouter();

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/signin");
      return;
    }

    const loadPreferences = async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setPrefs({
          daily_job_alerts: data.daily_job_alerts,
          instant_match_alerts: data.instant_match_alerts,
          application_status_updates: data.application_status_updates,
          profile_activity: data.profile_activity,
          employer_messages: data.employer_messages,
          hiregeneral_communications: data.hiregeneral_communications,
          unsubscribed_all: data.unsubscribed_all,
        });
      }

      setLoaded(true);
    };

    loadPreferences();
  }, [user, loading, router]);

  const update = (key: keyof Prefs, value: boolean) => {
    setPrefs((currentPrefs) => ({
      ...currentPrefs,
      [key]: value,
      unsubscribed_all: false,
    }));
  };

  const save = async () => {
    if (!user) return;

    setSaving(true);

    const { error } = await supabase.from("notification_preferences").upsert(
      {
        user_id: user.id,
        ...prefs,
      },
      { onConflict: "user_id" },
    );

    setSaving(false);

    if (error) {
      toast.error("Could not save preferences.");
      return;
    }

    toast.success("Notification preferences saved.");
  };

  const unsubscribeAll = async () => {
    if (!user) return;

    setSaving(true);

    const allOff: Prefs = {
      daily_job_alerts: false,
      instant_match_alerts: false,
      application_status_updates: false,
      profile_activity: false,
      employer_messages: false,
      hiregeneral_communications: false,
      unsubscribed_all: true,
    };

    const { error } = await supabase.from("notification_preferences").upsert(
      {
        user_id: user.id,
        ...allOff,
      },
      { onConflict: "user_id" },
    );

    setSaving(false);

    if (error) {
      toast.error("Could not unsubscribe.");
      return;
    }

    setPrefs(allOff);
    toast.success("You have been unsubscribed from all notifications.");
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-3xl px-4 py-10">
        <Badge variant="soft">Settings</Badge>

        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Notifications
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          You are currently updating preferences for{" "}
          <span className="font-medium text-foreground">
            {user?.email ?? "—"}
          </span>{" "}
          <Link
            href="/settings/account"
            className="text-primary hover:underline"
          >
            Edit
          </Link>
        </p>

        {!loaded ? (
          <div className="mt-8 rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <div className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
            {SECTIONS.map((section) => (
              <div
                key={section.key}
                className="flex items-start justify-between gap-6 p-5"
              >
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    {section.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {section.description}
                  </p>
                </div>

                <Switch
                  checked={prefs[section.key]}
                  onCheckedChange={(value) => update(section.key, value)}
                />
              </div>
            ))}
          </div>
        )}

        {prefs.unsubscribed_all && (
          <div className="mt-4 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-foreground">
            You are currently unsubscribed from all HireGeneral notifications.
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={unsubscribeAll}
            disabled={saving || !loaded}
          >
            Unsubscribe from all
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/settings/account")}
            >
              Cancel
            </Button>

            <Button onClick={save} disabled={saving || !loaded}>
              {saving ? "Saving…" : "Save preferences"}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

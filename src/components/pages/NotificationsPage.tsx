"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/hooks/useAuthUser";
import { supabase } from "@/lib/supabase/client";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export default function NotificationsPage() {
  const { user, loading } = useAuthUser();
  const router = useRouter();

  const [items, setItems] = useState<NotificationRow[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/signin");
      return;
    }

    const loadNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setItems(data ?? []);
    };

    loadNotifications();
  }, [user, loading, router]);

  const markAllRead = async () => {
    if (!user) return;

    setBusy(true);

    const readAt = new Date().toISOString();

    await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .eq("user_id", user.id)
      .is("read_at", null);

    setItems((prev) =>
      prev.map((notification) => ({
        ...notification,
        read_at: notification.read_at ?? readAt,
      })),
    );

    setBusy(false);
  };

  const unread = items.filter((notification) => !notification.read_at).length;

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Badge variant="soft">Inbox</Badge>

            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Notifications
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "All caught up"}
            </p>
          </div>

          {items.length > 0 && (
            <Button
              variant="outline"
              onClick={markAllRead}
              disabled={busy || unread === 0}
            >
              <CheckCheck className="size-4" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="mt-6">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
              <Bell className="mx-auto size-8 text-muted-foreground" />

              <h3 className="mt-3 text-base font-semibold">
                No notifications yet
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                We&apos;ll let you know when there&apos;s activity on your
                applications, profile, or messages.
              </p>

              <div className="mt-4">
                <Button variant="outline" asChild>
                  <Link href="/settings/notifications">
                    Notification settings
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {items.map((notification) => {
                const content = (
                  <div
                    className={`flex gap-3 p-4 ${
                      notification.read_at ? "" : "bg-primary/5"
                    }`}
                  >
                    <div
                      className={`mt-1 size-2 shrink-0 rounded-full ${
                        notification.read_at ? "bg-transparent" : "bg-primary"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {notification.title}
                        </p>

                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(
                            notification.created_at,
                          ).toLocaleDateString()}
                        </span>
                      </div>

                      {notification.body && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {notification.body}
                        </p>
                      )}
                    </div>
                  </div>
                );

                return (
                  <li key={notification.id}>
                    {notification.link ? (
                      <Link
                        href={notification.link}
                        className="block hover:bg-secondary/40"
                      >
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

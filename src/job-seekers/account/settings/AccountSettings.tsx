"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, Mail, Shield, UserRound } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthUser } from "@/hooks/useAuthUser";
import { supabase } from "@/lib/supabase/client";

type SettingsCardConfig = {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  disabled?: boolean;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const settingsCards: SettingsCardConfig[] = [
  {
    title: "Profile",
    description: "Update your contact details, headline, and resume.",
    href: "/profile",
    actionLabel: "Open profile",
    icon: UserRound,
  },
  {
    title: "Notifications",
    description: "Choose which alerts you receive by email.",
    href: "/settings/notifications",
    actionLabel: "Notification settings",
    icon: Bell,
  },
  {
    title: "Privacy",
    description: "Control whether recruiters can discover your profile.",
    href: "/profile",
    actionLabel: "Privacy controls",
    icon: Shield,
  },
];

export default function AccountSettings() {
  const { user } = useAuthUser();

  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const email = user?.email ?? "Not available";
  const canDelete = Boolean(user) && confirm === "DELETE" && !deleting;

  const handleDelete = async () => {
    if (!user || deleting) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          deletion_requested_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        toast.error("Could not request account deletion. Please try again.");
        return;
      }

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        toast.error(
          "Deletion was requested, but we could not sign you out automatically.",
        );
        return;
      }

      toast.success("Account deletion requested. You have been signed out.");

      window.location.assign("/");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-3xl px-4 py-10">
        <Badge variant="soft">Settings</Badge>

        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Account settings
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Manage your account, notifications, and privacy.
        </p>

        <div className="mt-8 space-y-4">
          {settingsCards.map((card) => (
            <SettingsCard
              key={card.title}
              icon={card.icon}
              title={card.title}
              description={card.description}
            >
              <Button variant="outline" asChild>
                <Link href={card.href}>{card.actionLabel}</Link>
              </Button>
            </SettingsCard>
          ))}

          <SettingsCard
            icon={Mail}
            title="Email"
            description={`Signed in as ${email}.`}
          >
            <Button type="button" variant="outline" disabled>
              Change email
            </Button>
          </SettingsCard>

          <section
            aria-labelledby="delete-account-heading"
            className="rounded-lg border border-destructive/30 bg-destructive/5 p-6"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="mt-0.5 size-5 shrink-0 text-destructive"
                aria-hidden="true"
              />

              <div className="flex-1">
                <h2
                  id="delete-account-heading"
                  className="text-lg font-semibold text-foreground"
                >
                  Delete account
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  This signs you out immediately and submits your account for
                  deletion. An admin reviews and permanently removes your data
                  within 14 days. This action is irreversible after admin
                  approval.
                </p>

                <AlertDialog
                  open={deleteDialogOpen}
                  onOpenChange={(open) => {
                    setDeleteDialogOpen(open);

                    if (!open) {
                      setConfirm("");
                    }
                  }}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      className="mt-4"
                      disabled={!user}
                    >
                      Delete my account
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Confirm account deletion
                      </AlertDialogTitle>

                      <AlertDialogDescription>
                        Type{" "}
                        <span className="font-mono font-semibold">DELETE</span>{" "}
                        below to confirm. You&apos;ll be signed out and an admin
                        will review your request.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-2">
                      <label
                        htmlFor="delete-confirmation"
                        className="text-sm font-medium text-foreground"
                      >
                        Confirmation text
                      </label>

                      <Input
                        id="delete-confirmation"
                        value={confirm}
                        onChange={(event) => setConfirm(event.target.value)}
                        placeholder="Type DELETE"
                        autoComplete="off"
                        disabled={deleting}
                      />
                    </div>

                    <AlertDialogFooter>
                      <AlertDialogCancel
                        type="button"
                        disabled={deleting}
                        onClick={() => setConfirm("")}
                      >
                        Cancel
                      </AlertDialogCancel>

                      <AlertDialogAction
                        type="button"
                        disabled={!canDelete}
                        onClick={(event) => {
                          event.preventDefault();
                          handleDelete();
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? "Submitting…" : "Delete account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  const headingId = `${title.toLowerCase().replace(/\s+/g, "-")}-settings`;

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

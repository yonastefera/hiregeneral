"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Download,
  Mail,
  Shield,
  UserRound,
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
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
  const router = useRouter();
  const { user } = useAuthUser();

  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deletionRequestedAt, setDeletionRequestedAt] = useState<string | null>(
    null,
  );
  const [deletionScheduledFor, setDeletionScheduledFor] = useState<
    string | null
  >(null);
  const [cancellingDeletion, setCancellingDeletion] = useState(false);
  const [employerAccessEnabled, setEmployerAccessEnabled] = useState(false);
  const [employerAccessLoaded, setEmployerAccessLoaded] = useState(false);
  const [savingEmployerAccess, setSavingEmployerAccess] = useState(false);
  const [hasResume, setHasResume] = useState(false);

  const email = user?.email ?? "Not available";
  const canDelete = Boolean(user) && confirm === "DELETE" && !deleting;

  useEffect(() => {
    if (!user) return;

    let active = true;

    fetch("/api/account/deletion", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as {
          requested_at?: string | null;
          scheduled_for?: string | null;
        };
      })
      .then((status) => {
        if (!active || !status) return;
        setDeletionRequestedAt(status.requested_at ?? null);
        setDeletionScheduledFor(status.scheduled_for ?? null);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    fetch("/api/account/employer-access", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load privacy settings.");
        return (await response.json()) as {
          enabled: boolean;
          hasResume: boolean;
        };
      })
      .then((data) => {
        if (!active) return;
        setEmployerAccessEnabled(data.enabled);
        setHasResume(data.hasResume);
      })
      .catch(() => {
        if (active) toast.error("Could not load employer-access settings.");
      })
      .finally(() => {
        if (active) setEmployerAccessLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const handleEmployerAccessChange = async (enabled: boolean) => {
    if (!user || savingEmployerAccess) return;

    const previous = employerAccessEnabled;
    setEmployerAccessEnabled(enabled);
    setSavingEmployerAccess(true);

    try {
      const response = await fetch("/api/account/employer-access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) throw new Error("Could not save privacy settings.");

      const data = (await response.json()) as { enabled: boolean };
      setEmployerAccessEnabled(data.enabled);
      toast.success(
        data.enabled ? "Employer access enabled." : "Employer access revoked.",
      );
    } catch {
      setEmployerAccessEnabled(previous);
      toast.error("Could not save employer-access settings.");
    } finally {
      setSavingEmployerAccess(false);
    }
  };

  const handleDelete = async () => {
    if (!user || deleting) return;

    setDeleting(true);

    try {
      const deletionResponse = await fetch("/api/account/deletion", {
        method: "POST",
      });

      if (!deletionResponse.ok) {
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

      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    if (!user || exporting) return;

    setExporting(true);

    try {
      const response = await fetch("/api/account/export", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        toast.error("Could not prepare your data export. Please try again.");
        return;
      }

      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const disposition = response.headers.get("content-disposition") ?? "";
      const fileName =
        disposition.match(/filename="([^"]+)"/)?.[1] ?? "hiregeneral-data.json";

      anchor.href = href;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);
      toast.success("Your data export was downloaded.");
    } catch {
      toast.error("Could not prepare your data export. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!user || cancellingDeletion) return;

    setCancellingDeletion(true);

    try {
      const response = await fetch("/api/account/deletion", {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error("Could not cancel account deletion. Please try again.");
        return;
      }

      setDeletionRequestedAt(null);
      setDeletionScheduledFor(null);
      toast.success("Account deletion was cancelled.");
    } catch {
      toast.error("Could not cancel account deletion. Please try again.");
    } finally {
      setCancellingDeletion(false);
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

          <SettingsCard
            icon={Download}
            title="Download your data"
            description="Export your profile, applications, saved jobs, messages, employer activity, and support requests as JSON."
          >
            <Button
              type="button"
              variant="outline"
              disabled={!user || exporting}
              onClick={handleExport}
            >
              {exporting ? "Preparing…" : "Download data"}
            </Button>
          </SettingsCard>

          <section className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Resume and employer access
                </h2>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {employerAccessEnabled
                    ? "Your profile is discoverable"
                    : "Your profile is private"}
                </p>
              </div>
              <Switch
                aria-label="Allow authorized employers to discover my profile"
                checked={employerAccessEnabled}
                disabled={!employerAccessLoaded || savingEmployerAccess}
                onCheckedChange={handleEmployerAccessChange}
              />
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              When enabled, authenticated employers with an eligible paid plan
              can discover your profile and review your name, contact details,
              skills, work and education history, profile links, and uploaded
              resume. Resume links expire after a short period. Turning this off
              immediately removes you from employer discovery.
            </p>
            {!hasResume && (
              <p className="mt-3 text-sm text-muted-foreground">
                You do not currently have a resume uploaded. You can still set
                your preference now, but resume-only searches will not display
                your profile until you upload one.
              </p>
            )}
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Employers can also retain information you deliberately submit in
              an application according to the application-retention period, even
              when discovery is disabled later.
            </p>
          </section>

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
                  {deletionRequestedAt
                    ? `Deletion was requested. Permanent deletion cannot begin before ${new Date(
                        deletionScheduledFor ?? deletionRequestedAt,
                      ).toLocaleDateString()}. You can cancel during this grace period.`
                    : "This signs you out immediately and starts a 14-day grace period. You can sign back in and cancel during that period. After it ends, permanent deletion and backup propagation can begin."}
                </p>

                {deletionRequestedAt ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    disabled={cancellingDeletion}
                    onClick={handleCancelDeletion}
                  >
                    {cancellingDeletion
                      ? "Cancelling…"
                      : "Cancel account deletion"}
                  </Button>
                ) : (
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
                          <span className="font-mono font-semibold">
                            DELETE
                          </span>{" "}
                          below to confirm. You&apos;ll be signed out and an
                          admin will review your request.
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
                )}
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

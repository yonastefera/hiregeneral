"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, Mail, Shield, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAuthUser } from "@/hooks/useAuthUser";
import { supabase } from "@/lib/supabase/client";

export default function AccountSettingsPage() {
  const { user } = useAuthUser();
  const router = useRouter();

  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const email = user?.email ?? "you@example.com";

  const handleDelete = async () => {
    if (!user) return;

    setDeleting(true);

    // Soft delete: flag profile, sign out. An admin reviews + hard-deletes.
    const { error } = await supabase
      .from("profiles")
      .update({
        deletion_requested_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (error) {
      setDeleting(false);
      toast.error("Could not request account deletion. Please try again.");
      return;
    }

    await supabase.auth.signOut();

    setDeleting(false);
    toast.success("Account deletion requested. You have been signed out.");
    router.push("/");
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
          <Card
            icon={<UserRound className="size-5 text-primary" />}
            title="Profile"
            description="Update your contact details, headline, and resume."
          >
            <Button variant="outline" onClick={() => router.push("/profile")}>
              Open profile
            </Button>
          </Card>

          <Card
            icon={<Bell className="size-5 text-primary" />}
            title="Notifications"
            description="Choose which alerts you receive by email."
          >
            <Button
              variant="outline"
              onClick={() => router.push("/settings/notifications")}
            >
              Notification settings
            </Button>
          </Card>

          <Card
            icon={<Shield className="size-5 text-primary" />}
            title="Privacy"
            description="Control whether recruiters can discover your profile."
          >
            <Button variant="outline" onClick={() => router.push("/profile")}>
              Privacy controls
            </Button>
          </Card>

          <Card
            icon={<Mail className="size-5 text-primary" />}
            title="Email"
            description={`Signed in as ${email}.`}
          >
            <Button variant="outline" disabled>
              Change email
            </Button>
          </Card>

          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 text-destructive" />

              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">
                  Delete account
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  This signs you out immediately and submits your account for
                  deletion. An admin reviews and permanently removes your data
                  within 14 days. This action is irreversible after admin
                  approval.
                </p>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
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

                    <Input
                      value={confirm}
                      onChange={(event) => setConfirm(event.target.value)}
                      placeholder="Type DELETE"
                    />

                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setConfirm("")}>
                        Cancel
                      </AlertDialogCancel>

                      <AlertDialogAction
                        disabled={confirm !== "DELETE" || deleting}
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? "Submitting…" : "Delete account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Card({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        {icon}

        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>

          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {children}
    </div>
  );
}

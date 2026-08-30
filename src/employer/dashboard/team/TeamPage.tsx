"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";

type Member = {
  id: string;
  role: "owner" | "admin" | "interviewer";
  profile: { full_name: string | null; email: string | null } | null;
};

export function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "interviewer">("interviewer");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const response = await fetch("/api/employers/team");
    const body = await response.json().catch(() => null);
    if (response.ok) setMembers(body.members ?? []);
    else toast.error(body?.error ?? "Could not load team.");
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const add = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/employers/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(body?.error ?? "Could not add teammate.");
      setEmail("");
      await load();
      toast.success("Teammate added.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not add teammate.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (memberId: string) => {
    const response = await fetch("/api/employers/team", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.error ?? "Could not remove teammate.");
      return;
    }
    setMembers((current) => current.filter((member) => member.id !== memberId));
    toast.success("Teammate removed.");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">
          Hiring team
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Invite existing employer accounts to collaborate on private interview
          scorecards.
        </p>
      </div>
      <section className="rounded-2xl bg-white p-5">
        <h2 className="font-semibold">Add teammate</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="teammate@company.com"
            className="min-w-64 flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as typeof role)}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          >
            <option value="interviewer">Interviewer</option>
            <option value="admin">Team admin</option>
          </select>
          <button
            type="button"
            disabled={saving || !email.trim()}
            onClick={add}
            className="inline-flex items-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}{" "}
            Add
          </button>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          The teammate must already have a HireGeneral employer account.
        </p>
      </section>
      <section className="rounded-2xl bg-white p-5">
        <h2 className="font-semibold">Team members</h2>
        {loading ? (
          <Loader2 className="mt-5 size-5 animate-spin" />
        ) : members.length ? (
          <div className="mt-3 divide-y divide-neutral-100">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-full bg-neutral-100">
                    <UsersRound className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {member.profile?.full_name ||
                        member.profile?.email ||
                        "Employer teammate"}
                    </p>
                    <p className="text-xs capitalize text-neutral-500">
                      {member.role}
                    </p>
                  </div>
                </div>
                {member.role !== "owner" ? (
                  <button
                    type="button"
                    onClick={() => remove(member.id)}
                    aria-label="Remove teammate"
                    className="p-2 text-rose-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-500">No team members yet.</p>
        )}
      </section>
    </div>
  );
}

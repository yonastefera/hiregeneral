"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  FileText,
  Loader2,
  MapPin,
  Save,
  Shield,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  headline: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  user_type: string;
  skills: string[] | null;
  additional_info: string | null;
  visibility: string | null;
  resume_url: string | null;
}

type ProfileUpdate = {
  full_name: string | null;
  headline: string | null;
  phone: string | null;
  location: string | null;
  skills: string[];
  additional_info: string | null;
  visibility: string;
  resume_url: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const skillRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
      } else {
        const newProfile = {
          user_id: user.id,
          email: user.email ?? null,
          full_name: user.user_metadata?.full_name ?? null,
          user_type: user.user_metadata?.role ?? "job_seeker",
          skills: [],
          visibility: "private",
        };

        const { data: created } = await supabase
          .from("profiles")
          .insert(newProfile as never)
          .select()
          .single();

        if (created) {
          setProfile(created as Profile);
        }
      }

      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);

    const updates: ProfileUpdate = {
      full_name: profile.full_name,
      headline: profile.headline,
      phone: profile.phone,
      location: profile.location,
      skills: profile.skills ?? [],
      additional_info: profile.additional_info,
      visibility: profile.visibility ?? "private",
      resume_url: profile.resume_url,
    };

    const { error } = await supabase
      .from("profiles")
      .update(updates as never)
      .eq("user_id", profile.user_id);

    setSaving(false);

    if (error) {
      toast.error("Could not save profile.");
      return;
    }

    toast.success("Profile saved.");
  };

  const handleResumeUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!profile) return;

    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${profile.user_id}/resume-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      setUploadingResume(false);
      toast.error("Could not upload resume.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("resumes").getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ resume_url: publicUrl } as never)
      .eq("user_id", profile.user_id);

    setUploadingResume(false);

    if (updateError) {
      toast.error("Resume uploaded, but profile could not be updated.");
      return;
    }

    setProfile({ ...profile, resume_url: publicUrl });
    toast.success("Resume uploaded.");
  };

  const addSkill = () => {
    const skill = skillInput.trim();

    if (!skill || !profile) return;

    const currentSkills = profile.skills ?? [];

    if (currentSkills.includes(skill)) {
      setSkillInput("");
      return;
    }

    setProfile({
      ...profile,
      skills: [...currentSkills, skill],
    });

    setSkillInput("");
    skillRef.current?.focus();
  };

  const removeSkill = (skill: string) => {
    if (!profile) return;

    setProfile({
      ...profile,
      skills: (profile.skills ?? []).filter((item) => item !== skill),
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-background">
        <section className="border-b border-border bg-hero-gradient px-4 py-12">
          <div className="mx-auto max-w-7xl">
            <Badge variant="soft">Your profile</Badge>

            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              Profile settings
            </h1>

            <p className="mt-3 max-w-2xl text-muted-foreground">
              Keep your profile complete to get better job matches.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <p className="text-muted-foreground">
            Please sign in to view your profile.
          </p>

          <Button className="mt-4" asChild>
            <Link href="/signin?next=/profile">Sign in</Link>
          </Button>
        </div>
      </main>
    );
  }

  const skills = profile.skills ?? [];
  const visibility = profile.visibility ?? "private";

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (profile.email?.slice(0, 2).toUpperCase() ?? "??");

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-hero-gradient px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <Badge variant="soft">Your profile</Badge>

          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            Profile settings
          </h1>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Keep your profile complete to get better job matches.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border border-border bg-surface p-6 shadow-soft">
          <div className="flex size-20 items-center justify-center rounded-lg bg-secondary text-2xl font-bold text-secondary-foreground">
            {initials}
          </div>

          <h2 className="mt-5 text-2xl font-bold tracking-tight">
            {profile.full_name || "Your name"}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {profile.headline || "Add a headline to introduce yourself."}
          </p>

          <div className="mt-5 space-y-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <MapPin className="size-4" />
              {profile.location || "Add your location"}
            </p>

            <p className="flex items-center gap-2 capitalize">
              <BriefcaseBusiness className="size-4" />
              {profile.user_type?.replace("_", " ") || "Job seeker"}
            </p>

            <p className="flex items-center gap-2">
              <Shield className="size-4" />
              Profile visibility:{" "}
              <span className="capitalize">{visibility}</span>
            </p>
          </div>

          <Button
            variant="glass"
            className="mt-6 w-full"
            onClick={() =>
              setProfile({
                ...profile,
                visibility: visibility === "public" ? "private" : "public",
              })
            }
          >
            {visibility === "public"
              ? "Make profile private"
              : "Make profile public"}
          </Button>

          <Button
            className="mt-3 w-full"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="size-4" />
                Save profile
              </>
            )}
          </Button>
        </aside>

        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-surface p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <UserRound className="size-5 text-primary" />

              <h2 className="text-xl font-bold tracking-tight">
                Contact information
              </h2>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  value={profile.email ?? ""}
                  disabled
                  className="opacity-70"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  value={profile.phone ?? ""}
                  onChange={(event) =>
                    setProfile({ ...profile, phone: event.target.value })
                  }
                  placeholder="(555) 012-4890"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profile.location ?? ""}
                  onChange={(event) =>
                    setProfile({ ...profile, location: event.target.value })
                  }
                  placeholder="New York, NY"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={profile.full_name ?? ""}
                  onChange={(event) =>
                    setProfile({ ...profile, full_name: event.target.value })
                  }
                  placeholder="Avery Morgan"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={profile.headline ?? ""}
                  onChange={(event) =>
                    setProfile({ ...profile, headline: event.target.value })
                  }
                  placeholder="Senior product engineer seeking remote-first teams."
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />

                <h2 className="text-xl font-bold tracking-tight">
                  Resume and skills
                </h2>
              </div>

              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleResumeUpload}
              />

              <Button
                variant="warm"
                onClick={() => resumeInputRef.current?.click()}
                disabled={uploadingResume}
              >
                {uploadingResume ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Upload resume
                  </>
                )}
              </Button>
            </div>

            <div className="mt-5 rounded-lg border border-dashed border-border bg-background p-5 text-sm text-muted-foreground">
              {profile.resume_url ? (
                <a
                  href={profile.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-foreground hover:text-primary"
                >
                  View uploaded resume
                </a>
              ) : (
                "No resume uploaded yet."
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="flex items-center gap-1.5"
                  >
                    {skill}

                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No skills added yet.
                </p>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <Input
                ref={skillRef}
                value={skillInput}
                onChange={(event) => setSkillInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Add a skill, e.g. React"
                className="max-w-xs"
              />

              <Button type="button" variant="glass" onClick={addSkill}>
                Add
              </Button>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-6 shadow-soft">
            <h2 className="text-xl font-bold tracking-tight">
              Additional information
            </h2>

            <div className="mt-5">
              <Label htmlFor="additionalInfo">Bio / additional info</Label>

              <Textarea
                id="additionalInfo"
                rows={5}
                value={profile.additional_info ?? ""}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    additional_info: event.target.value,
                  })
                }
                placeholder="A short bio that recruiters will see on your public profile..."
                className="mt-2"
              />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Input placeholder="Gender" />
              <Input placeholder="Ethnicity" />
              <Input placeholder="Veteran status" />
              <Input placeholder="Disability status" />
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              These fields are optional and can remain private. They help
              employers support inclusive hiring reporting where applicable.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

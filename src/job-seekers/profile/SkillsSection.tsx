"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { JobSeekerProfile } from "./profile-types";

type SkillsSectionProps = {
  profile: JobSeekerProfile;
  onProfileChange: (profile: JobSeekerProfile) => void;
};

const MAX_SKILLS = 15;

const RECOMMENDED_SKILLS = [
  "NoSQL",
  "EC2",
  "Bootstrap.js",
  "MFC",
  "VxWorks",
  "WCF",
  "STL",
  "Device Driver",
];

function normalizeSkill(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isSameSkill(first: string, second: string) {
  return first.trim().toLowerCase() === second.trim().toLowerCase();
}

function getInitialSkills(profile: JobSeekerProfile) {
  return Array.isArray(profile.skills)
    ? profile.skills
        .map(normalizeSkill)
        .filter(Boolean)
        .filter((skill, index, allSkills) => {
          return (
            allSkills.findIndex((item) => isSameSkill(item, skill)) === index
          );
        })
    : [];
}

export default function SkillsSection({
  profile,
  onProfileChange,
}: SkillsSectionProps) {
  const profileSkills = useMemo(() => getInitialSkills(profile), [profile]);
  const [open, setOpen] = useState(false);
  const [draftSkills, setDraftSkills] = useState<string[]>(profileSkills);
  const [newSkill, setNewSkill] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasSkills = profileSkills.length > 0;

  useEffect(() => {
    if (!open) return;

    setDraftSkills(profileSkills);
    setNewSkill("");
    setError(null);
  }, [open, profileSkills]);

  const hasChanges =
    draftSkills.length !== profileSkills.length ||
    draftSkills.some((skill, index) => skill !== profileSkills[index]);

  const canAddMore = draftSkills.length < MAX_SKILLS;

  const recommendedSkills = RECOMMENDED_SKILLS.filter(
    (recommendedSkill) =>
      !draftSkills.some((skill) => isSameSkill(skill, recommendedSkill)),
  );

  const addSkill = (value: string) => {
    const normalizedSkill = normalizeSkill(value);

    if (!normalizedSkill) {
      setError("Enter a skill before adding it.");
      return;
    }

    if (!canAddMore) {
      setError(`You can add up to ${MAX_SKILLS} skills.`);
      return;
    }

    if (draftSkills.some((skill) => isSameSkill(skill, normalizedSkill))) {
      setError("That skill is already added.");
      return;
    }

    setDraftSkills((current) => [...current, normalizedSkill]);
    setNewSkill("");
    setError(null);
  };

  const removeSkill = (skillToRemove: string) => {
    setDraftSkills((current) =>
      current.filter((skill) => !isSameSkill(skill, skillToRemove)),
    );
    setError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addSkill(newSkill);
  };

  const save = () => {
    if (!hasChanges) return;

    onProfileChange({
      ...profile,
      skills: draftSkills,
    });

    setOpen(false);
  };

  return (
    <section
      className="mx-auto max-w-3xl px-4 py-8"
      aria-labelledby="skills-heading"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="skills-heading" className="text-2xl font-bold tracking-tight">
          Skills
        </h2>

        {hasSkills && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(true)}
            className="rounded-md px-5"
          >
            <Pencil aria-hidden="true" className="size-4" />
            Edit
          </Button>
        )}
      </div>

      {hasSkills ? (
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Skills">
          {profileSkills.map((skill) => (
            <li
              key={skill}
              className="rounded-md bg-muted px-3 py-2 text-xs font-semibold text-foreground"
            >
              {skill}
            </li>
          ))}
        </ul>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="mt-6 rounded-md px-5 font-semibold"
        >
          <Plus aria-hidden="true" className="size-4" />
          Add Skills
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto rounded-xl border border-border bg-background p-0 shadow-2xl">
          <div className="px-6 pb-3 pt-6">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Skills
            </DialogTitle>
          </div>

          <div className="space-y-5 px-6 pb-6">
            {draftSkills.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Selected skills">
                {draftSkills.map((skill) => (
                  <li key={skill}>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                      aria-label={`Remove ${skill}`}
                    >
                      {skill}
                      <X aria-hidden="true" className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form className="space-y-2" onSubmit={handleSubmit}>
              <Label htmlFor="skillInput">Add skill</Label>

              <div className="flex">
                <Input
                  id="skillInput"
                  value={newSkill}
                  onChange={(event) => {
                    setNewSkill(event.target.value);
                    setError(null);
                  }}
                  className="rounded-r-none"
                  disabled={!canAddMore}
                />

                <Button
                  type="submit"
                  variant="outline"
                  className="rounded-l-none border-l-0 px-6 font-semibold"
                  disabled={!newSkill.trim() || !canAddMore}
                >
                  Add
                </Button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  {draftSkills.length}/{MAX_SKILLS} Skills added
                </p>

                {error && (
                  <p className="text-xs font-medium text-destructive">
                    {error}
                  </p>
                )}
              </div>
            </form>

            {recommendedSkills.length > 0 && (
              <div className="rounded-xl bg-muted/70 p-5">
                <h3 className="font-semibold">Recommended Skills</h3>

                <p className="mt-2 text-sm text-foreground">
                  Based on your work history and activity
                </p>

                <ul className="mt-4 flex flex-wrap gap-2">
                  {recommendedSkills.map((skill) => (
                    <li key={skill}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full bg-background"
                        onClick={() => addSkill(skill)}
                        disabled={!canAddMore}
                      >
                        <Plus aria-hidden="true" className="size-3.5" />
                        {skill}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              type="button"
              className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
              onClick={save}
              disabled={!hasChanges}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

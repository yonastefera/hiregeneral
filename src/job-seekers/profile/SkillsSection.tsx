"use client";

import { useEffect, useMemo, useState } from "react";
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

function normalizeSkills(skills: string[] | null | undefined) {
  return Array.from(
    new Set((skills ?? []).map((skill) => skill.trim()).filter(Boolean)),
  );
}

function areSkillListsEqual(
  first: string[] | null | undefined,
  second: string[] | null | undefined,
) {
  const firstSkills = normalizeSkills(first).sort((a, b) => a.localeCompare(b));
  const secondSkills = normalizeSkills(second).sort((a, b) =>
    a.localeCompare(b),
  );

  if (firstSkills.length !== secondSkills.length) return false;

  return firstSkills.every((skill, index) => skill === secondSkills[index]);
}

export default function SkillsSection({
  profile,
  onProfileChange,
}: SkillsSectionProps) {
  const [open, setOpen] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (!open) return;

    setSkills(normalizeSkills(profile.skills).slice(0, MAX_SKILLS));
    setSkillInput("");
  }, [open, profile.skills]);

  const currentSkills = useMemo(
    () => normalizeSkills(profile.skills).slice(0, MAX_SKILLS),
    [profile.skills],
  );

  const draftSkills = useMemo(
    () => normalizeSkills(skills).slice(0, MAX_SKILLS),
    [skills],
  );

  const trimmedSkillInput = skillInput.trim();

  const hasDuplicateSkill = draftSkills.some(
    (skill) => skill.toLowerCase() === trimmedSkillInput.toLowerCase(),
  );

  const canAddSkill =
    trimmedSkillInput.length > 0 &&
    draftSkills.length < MAX_SKILLS &&
    !hasDuplicateSkill;

  const nextDraftSkills = canAddSkill
    ? normalizeSkills([...draftSkills, trimmedSkillInput]).slice(0, MAX_SKILLS)
    : draftSkills;

  const canSave =
    nextDraftSkills.length <= MAX_SKILLS &&
    !areSkillListsEqual(currentSkills, nextDraftSkills);

  const addSkill = () => {
    if (!canAddSkill) return;

    setSkills([...draftSkills, trimmedSkillInput]);
    setSkillInput("");
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(
      draftSkills.filter(
        (skill) => skill.toLowerCase() !== skillToRemove.toLowerCase(),
      ),
    );
  };

  const handleSave = () => {
    if (!canSave) return;

    onProfileChange({
      ...profile,
      skills: nextDraftSkills,
    });

    setOpen(false);
  };

  return (
    <>
      <section
        className="mx-auto max-w-3xl px-4 py-8"
        aria-labelledby="skills-heading"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="skills-heading" className="text-2xl font-bold tracking-tight">
            Skills
          </h2>

          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(true)}
            className="border border-[#f2f2f2] bg-white px-5 shadow-none [border-radius:3px]"
          >
            <Pencil aria-hidden="true" className="size-4" />
            Edit
          </Button>
        </div>

        {currentSkills.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {currentSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-[#f2f2f2] bg-white px-3 py-1.5 text-sm font-semibold text-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-5 inline-flex items-center gap-2 font-semibold text-foreground hover:text-primary"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add Skills
          </button>
        )}

        {currentSkills.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {currentSkills.length}/{MAX_SKILLS} skills added
          </p>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[86vh] max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-0 shadow-2xl">
          <div className="border-b border-border px-7 py-6">
            <DialogTitle className="text-3xl font-bold tracking-tight">
              Skills
            </DialogTitle>

            <p className="mt-2 text-sm text-muted-foreground">
              Add up to {MAX_SKILLS} skills that best represent your experience.
            </p>
          </div>

          <div className="space-y-6 px-7 py-6">
            <div className="space-y-2">
              <Label htmlFor="skillInput">Skill</Label>

              <div className="flex gap-2">
                <Input
                  id="skillInput"
                  value={skillInput}
                  onChange={(event) => setSkillInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Example: React, Forklift, Customer Service"
                  className="h-12"
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={addSkill}
                  disabled={!canAddSkill}
                  className="h-12 shrink-0 border border-[#f2f2f2] bg-white px-4 shadow-none [border-radius:3px]"
                >
                  Add
                </Button>
              </div>

              {hasDuplicateSkill && trimmedSkillInput.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  This skill is already added.
                </p>
              )}

              {draftSkills.length >= MAX_SKILLS && (
                <p className="text-xs text-muted-foreground">
                  You reached the {MAX_SKILLS}-skill limit.
                </p>
              )}
            </div>

            {draftSkills.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-foreground">
                    Selected skills
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {draftSkills.length}/{MAX_SKILLS}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {draftSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-2 rounded-full border border-[#f2f2f2] bg-white px-3 py-1.5 text-sm font-semibold text-foreground"
                    >
                      {skill}

                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`Remove ${skill}`}
                      >
                        <X aria-hidden="true" className="size-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 border-t border-border bg-background px-7 py-5">
            <Button
              type="button"
              className="w-full bg-[#087f73] text-white hover:bg-[#066d63] disabled:bg-[#087f73]/40"
              size="lg"
              onClick={handleSave}
              disabled={!canSave}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

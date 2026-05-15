"use client";

import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import AchievementsSection from "./AchievementsSection";
import EducationSection from "./EducationSection";
import LicensesCertificationsSection from "./LicensesCertificationsSection";
import LinksSection from "./LinksSection";
import ProfileInfoSection from "./ProfileInfoSection";
import ResumeSection from "./ResumeSection";
import SkillsSection from "./SkillsSection";
import SummaryObjectiveSection from "./SummaryObjectiveSection";
import WorkExperienceSection from "./WorkExperienceSection";
import type {
  Achievement,
  AvatarViewState,
  EducationItem,
  JobSeekerProfile,
  LicenseCertification,
  ProfileFormErrors,
  ProfileLink,
  ResumeViewState,
  WorkExperience,
} from "./profile-types";
import {
  getResumeLabel,
  isPublicUrl,
  validateAvatarFile,
  validateResumeFile,
} from "./profile-utils";

function isPlaceholderResumeUrl(value: string) {
  return [
    "/profile/resume/view",
    "profile/resume/view",
    "/profile/resume",
    "profile/resume",
    "/resume/view",
    "resume/view",
  ].includes(value.trim());
}

function getStoredResumeUrl(profile: JobSeekerProfile | null) {
  const resumeUrl = profile?.resume_url?.trim() ?? "";

  if (!resumeUrl || isPlaceholderResumeUrl(resumeUrl)) {
    return null;
  }

  return resumeUrl;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [resumeView, setResumeView] = useState<ResumeViewState>({
    label: "No resume uploaded yet.",
    href: null,
  });

  const [avatarView, setAvatarView] = useState<AvatarViewState>({
    href: null,
  });

  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errors, setErrors] = useState<ProfileFormErrors>({});

  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [licenses, setLicenses] = useState<LicenseCertification[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [links, setLinks] = useState<ProfileLink[]>([]);

  const [achievementsDialogOpen, setAchievementsDialogOpen] = useState(false);
  const [linksDialogOpen, setLinksDialogOpen] = useState(false);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleProfileInfoChange = async (nextProfile: JobSeekerProfile) => {
    if (!profile) return;

    const nextLocation = [
      nextProfile.city ?? null,
      nextProfile.state ?? null,
      nextProfile.zip_code ?? null,
    ]
      .filter(Boolean)
      .join(", ");

    const updatePayload = {
      full_name: nextProfile.full_name,
      headline: nextProfile.headline,
      phone: nextProfile.phone,
      city: nextProfile.city ?? null,
      state: nextProfile.state ?? null,
      zip_code: nextProfile.zip_code ?? null,
      location: nextLocation || null,
      open_to_relocation: Boolean(nextProfile.open_to_relocation),
      visibility: nextProfile.visibility,
    };

    const updatedProfile: JobSeekerProfile = {
      ...profile,
      ...updatePayload,
    };

    setProfile(updatedProfile);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updatePayload as never)
        .eq("user_id", profile.user_id)
        .select()
        .single();

      if (error) {
        console.error("[profile] Could not save profile info:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        throw error;
      }

      if (data) {
        setProfile(data as JobSeekerProfile);
      }

      toast.success("Profile updated.");
    } catch (error) {
      console.error("[profile] Profile info save failed:", error);
      toast.error("Could not save profile.");
    }
  };

  const handleEducationChange = async (nextEducation: EducationItem[]) => {
    if (!profile) return;

    setEducation(nextEducation);

    const nextProfile: JobSeekerProfile = {
      ...profile,
      education: nextEducation,
    };

    setProfile(nextProfile);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          education: nextEducation,
        } as never)
        .eq("user_id", profile.user_id);

      if (error) {
        console.error("[profile] Could not save education:", error);
        throw error;
      }

      toast.success("Education saved.");
    } catch {
      toast.error("Could not save education.");
    }
  };

  const handleWorkExperienceChange = async (
    nextWorkExperience: WorkExperience[],
  ) => {
    if (!profile) return;

    setWorkExperience(nextWorkExperience);

    const nextProfile: JobSeekerProfile = {
      ...profile,
      work_experience: nextWorkExperience,
    };

    setProfile(nextProfile);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          work_experience: nextWorkExperience,
        } as never)
        .eq("user_id", profile.user_id);

      if (error) {
        console.error("[profile] Could not save work experience:", error);
        throw error;
      }

      toast.success("Work experience saved.");
    } catch {
      toast.error("Could not save work experience.");
    }
  };

  const handleSummaryObjectiveChange = async (
    nextProfile: JobSeekerProfile,
  ) => {
    if (!profile) return;

    const nextExecutiveSummary = nextProfile.executive_summary ?? null;
    const nextObjective = nextProfile.objective ?? null;

    const updatedProfile: JobSeekerProfile = {
      ...profile,
      executive_summary: nextExecutiveSummary,
      objective: nextObjective,
    };

    setProfile(updatedProfile);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          executive_summary: nextExecutiveSummary,
          objective: nextObjective,
        } as never)
        .eq("user_id", profile.user_id);

      if (error) {
        console.error("[profile] Could not save summary/objective:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        throw error;
      }

      toast.success("Summary and objective saved.");
    } catch (error) {
      console.error("[profile] Summary/objective save failed:", error);
      toast.error("Could not save summary and objective.");
    }
  };

  const handleSkillsChange = async (nextProfile: JobSeekerProfile) => {
    if (!profile) return;

    const nextSkills = Array.isArray(nextProfile.skills)
      ? nextProfile.skills
      : [];

    const updatedProfile: JobSeekerProfile = {
      ...profile,
      skills: nextSkills,
    };

    setProfile(updatedProfile);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          skills: nextSkills,
        } as never)
        .eq("user_id", profile.user_id);

      if (error) {
        console.error("[profile] Could not save skills:", error);
        throw error;
      }

      toast.success("Skills saved.");
    } catch {
      toast.error("Could not save skills.");
    }
  };

  const handleLicensesChange = async (nextLicenses: LicenseCertification[]) => {
    if (!profile) return;

    setLicenses(nextLicenses);

    const nextProfile = {
      ...profile,
      licenses_certifications: nextLicenses,
    };

    setProfile(nextProfile);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          licenses_certifications: nextLicenses,
        } as never)
        .eq("user_id", profile.user_id);

      if (error) throw error;

      toast.success("Licenses and certifications saved.");
    } catch {
      toast.error("Could not save licenses and certifications.");
    }
  };

  const handleAchievementsChange = async (nextAchievements: Achievement[]) => {
    if (!profile) return;

    setAchievements(nextAchievements);

    const nextProfile = {
      ...profile,
      achievements: nextAchievements,
    };

    setProfile(nextProfile);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          achievements: nextAchievements,
        } as never)
        .eq("user_id", profile.user_id);

      if (error) throw error;

      toast.success("Achievements saved.");
    } catch {
      toast.error("Could not save achievements.");
    }
  };

  const handleLinksChange = async (nextLinks: ProfileLink[]) => {
    if (!profile) return;

    setLinks(nextLinks);

    const nextProfile = {
      ...profile,
      profile_links: nextLinks,
    };

    setProfile(nextProfile);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          profile_links: nextLinks,
        } as never)
        .eq("user_id", profile.user_id);

      if (error) throw error;

      toast.success("Links saved.");
    } catch {
      toast.error("Could not save links.");
    }
  };

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        const user = authData.user;

        if (!user) {
          if (active) setProfile(null);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        if (profileData) {
          const loadedProfile = profileData as JobSeekerProfile;

          if (active) {
            setProfile(loadedProfile);
            setWorkExperience(loadedProfile.work_experience ?? []);
            setEducation(loadedProfile.education ?? []);
            setLinks(loadedProfile.profile_links ?? []);
            setAchievements(loadedProfile.achievements ?? []);
            setLicenses(loadedProfile.licenses_certifications ?? []);
          }

          return;
        }

        const newProfile = {
          user_id: user.id,
          email: user.email ?? null,
          full_name: user.user_metadata?.full_name ?? null,
          user_type: "job_seeker",
          skills: [],
          visibility: "private",
          open_to_relocation: false,
          resume_url: null,
          resume_file_name: null,
          resume_file_size: null,
          resume_uploaded_at: null,
          resume_scan_status: null,
          work_experience: [],
          education: [],
          profile_links: [],
          licenses_certifications: [],
        };

        const { data: created, error: createError } = await supabase
          .from("profiles")
          .insert(newProfile as never)
          .select()
          .single();

        if (createError) throw createError;

        if (active && created) {
          setProfile(created as JobSeekerProfile);
        }
      } catch {
        if (active) {
          setErrors((current) => ({
            ...current,
            form: "Could not load your profile.",
          }));
          toast.error("Could not load your profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadResumeView() {
      const storedResumeUrl = getStoredResumeUrl(profile);

      if (!storedResumeUrl) {
        setResumeView({
          label: "No resume uploaded yet.",
          href: null,
        });
        return;
      }

      if (isPublicUrl(storedResumeUrl)) {
        setResumeView({
          label: getResumeLabel(profile as JobSeekerProfile),
          href: storedResumeUrl,
        });
        return;
      }

      const { data, error } = await supabase.storage
        .from("resumes")
        .createSignedUrl(storedResumeUrl, 60 * 10);

      if (!active) return;

      setResumeView({
        label: getResumeLabel(profile as JobSeekerProfile),
        href: error ? null : (data?.signedUrl ?? null),
      });
    }

    loadResumeView();

    return () => {
      active = false;
    };
  }, [
    profile,
    profile?.resume_url,
    profile?.resume_file_name,
    profile?.resume_uploaded_at,
  ]);

  useEffect(() => {
    let active = true;

    async function loadAvatarView() {
      if (!profile?.avatar_url) {
        setAvatarView({ href: null });
        return;
      }

      if (isPublicUrl(profile.avatar_url)) {
        setAvatarView({ href: profile.avatar_url });
        return;
      }

      const { data, error } = await supabase.storage
        .from("avatars")
        .createSignedUrl(profile.avatar_url, 60 * 10);

      if (!active) return;

      setAvatarView({
        href: error ? null : (data?.signedUrl ?? null),
      });
    }

    loadAvatarView();

    return () => {
      active = false;
    };
  }, [profile?.avatar_url]);

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;

    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const validationError = validateAvatarFile(file);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    const localAvatarPreviewUrl = URL.createObjectURL(file);
    setAvatarView({ href: localAvatarPreviewUrl });

    setUploadingAvatar(true);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const filePath = `${profile.user_id}/avatar-${Date.now()}.${extension}`;
      const oldAvatarPath =
        profile.avatar_url && !isPublicUrl(profile.avatar_url)
          ? profile.avatar_url
          : null;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type || "image/jpeg",
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error("[profile] Avatar storage upload failed:", {
          message: uploadError.message,
          name: uploadError.name,
        });

        throw uploadError;
      }

      const avatarUploadedAt = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: filePath,
          avatar_file_name: file.name,
          avatar_uploaded_at: avatarUploadedAt,
        } as never)
        .eq("user_id", profile.user_id);

      if (updateError) {
        console.error("[profile] Could not save avatar:", {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        });

        throw updateError;
      }

      if (oldAvatarPath) {
        await supabase.storage.from("avatars").remove([oldAvatarPath]);
      }

      setProfile({
        ...profile,
        avatar_url: filePath,
        avatar_file_name: file.name,
        avatar_uploaded_at: avatarUploadedAt,
      });

      toast.success("Profile photo updated.");
    } catch {
      toast.error("Could not upload profile photo.");

      if (profile.avatar_url) {
        setAvatarView({ href: null });
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleResumeUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;

    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const validationError = validateResumeFile(file);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploadingResume(true);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const filePath = `${profile.user_id}/resume-${Date.now()}.${extension}`;

      const storedResumeUrl = getStoredResumeUrl(profile);
      const oldResumePath =
        storedResumeUrl && !isPublicUrl(storedResumeUrl)
          ? storedResumeUrl
          : null;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const uploadedAt = new Date().toISOString();

      const updatedProfile: JobSeekerProfile = {
        ...profile,
        resume_url: filePath,
        resume_file_name: file.name,
        resume_file_size: file.size,
        resume_uploaded_at: uploadedAt,
        resume_scan_status: "available",
      };

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          resume_url: filePath,
          resume_file_name: file.name,
          resume_file_size: file.size,
          resume_uploaded_at: uploadedAt,
          resume_scan_status: "available",
        } as never)
        .eq("user_id", profile.user_id);

      if (updateError) throw updateError;

      if (oldResumePath) {
        await supabase.storage.from("resumes").remove([oldResumePath]);
      }

      setProfile(updatedProfile);
      toast.success("Resume uploaded.");
    } catch {
      toast.error("Could not upload resume.");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleResumeDelete = async () => {
    if (!profile) return;

    setUploadingResume(true);

    try {
      const storedResumeUrl = getStoredResumeUrl(profile);

      const oldResumePath =
        storedResumeUrl && !isPublicUrl(storedResumeUrl)
          ? storedResumeUrl
          : null;

      const { error } = await supabase
        .from("profiles")
        .update({
          resume_url: null,
          resume_file_name: null,
          resume_file_size: null,
          resume_uploaded_at: null,
          resume_scan_status: null,
        } as never)
        .eq("user_id", profile.user_id);

      if (error) throw error;

      if (oldResumePath) {
        await supabase.storage.from("resumes").remove([oldResumePath]);
      }

      setProfile({
        ...profile,
        resume_url: null,
        resume_file_name: null,
        resume_file_size: null,
        resume_uploaded_at: null,
        resume_scan_status: null,
      });

      setResumeView({
        label: "No resume uploaded yet.",
        href: null,
      });

      toast.success("Resume deleted.");
    } catch {
      toast.error("Could not delete resume.");
    } finally {
      setUploadingResume(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div
          className="flex items-center justify-center py-32 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 aria-hidden="true" className="size-6 animate-spin" />
          <span className="sr-only">Loading your profile...</span>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-background">
        <section className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Sign in to view your profile
          </h1>

          <p className="mt-3 text-muted-foreground">
            Manage your job seeker profile after signing in.
          </p>

          <Button className="mt-6" asChild>
            <Link href="/signin?next=/profile">Sign in</Link>
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {errors.form && (
        <div
          className="fixed left-1/2 top-24 z-60 flex w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 items-start justify-between gap-4 rounded-xl border border-destructive/40 bg-destructive/10 px-5 py-4 text-sm font-medium text-destructive shadow-lg backdrop-blur"
          role="alert"
          aria-live="assertive"
        >
          <span>{errors.form}</span>

          <button
            type="button"
            onClick={() =>
              setErrors((current) => ({
                ...current,
                form: undefined,
              }))
            }
            className="shrink-0 rounded-md px-1 text-destructive/80 hover:text-destructive"
            aria-label="Dismiss error message"
          >
            ×
          </button>
        </div>
      )}

      <ProfileInfoSection
        profile={profile}
        avatarView={avatarView}
        resumeView={resumeView}
        workExperience={workExperience}
        education={education}
        licenses={licenses}
        achievements={achievements}
        links={links}
        avatarInputRef={avatarInputRef}
        uploadingAvatar={uploadingAvatar}
        onAvatarUpload={handleAvatarUpload}
        onProfileChange={handleProfileInfoChange}
      />

      <ResumeSection
        profile={profile}
        resumeView={resumeView}
        resumeInputRef={resumeInputRef}
        uploadingResume={uploadingResume}
        onResumeUpload={handleResumeUpload}
        onResumeDelete={handleResumeDelete}
      />

      <SummaryObjectiveSection
        profile={profile}
        onProfileChange={handleSummaryObjectiveChange}
      />

      <WorkExperienceSection
        items={workExperience}
        onChange={handleWorkExperienceChange}
      />

      <EducationSection items={education} onChange={handleEducationChange} />

      <SkillsSection profile={profile} onProfileChange={handleSkillsChange} />

      <LicensesCertificationsSection
        items={licenses}
        onChange={handleLicensesChange}
      />

      <AchievementsSection
        items={achievements}
        onChange={handleAchievementsChange}
        open={achievementsDialogOpen}
        onOpenChange={setAchievementsDialogOpen}
      />

      <LinksSection
        items={links}
        onChange={handleLinksChange}
        open={linksDialogOpen}
        onOpenChange={setLinksDialogOpen}
      />

      {(achievements.length === 0 || links.length === 0) && (
        <section
          className="mx-auto max-w-3xl px-4 py-8"
          aria-labelledby="add-sections-heading"
        >
          <h2
            id="add-sections-heading"
            className="text-2xl font-bold tracking-tight"
          >
            Add sections
          </h2>

          <div className="mt-6 flex flex-col items-start gap-5">
            {achievements.length === 0 && (
              <Button
                type="button"
                variant="ghost"
                className="h-auto px-0 py-0 font-semibold text-foreground hover:bg-transparent hover:text-primary"
                onClick={() => setAchievementsDialogOpen(true)}
              >
                + Add Achievements
              </Button>
            )}

            {links.length === 0 && (
              <Button
                type="button"
                variant="ghost"
                className="h-auto px-0 py-0 font-semibold text-foreground hover:bg-transparent hover:text-primary"
                onClick={() => setLinksDialogOpen(true)}
              >
                + Add Links
              </Button>
            )}
          </div>
        </section>
      )}

      <div className="h-20" />
    </main>
  );
}

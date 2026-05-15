"use client";

import type { ChangeEvent, ReactNode, RefObject } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Link as LinkIcon,
  Loader2,
  Mail,
  MapPin,
  Medal,
  Pencil,
  Phone,
} from "lucide-react";

import LocationAutocomplete from "@/components/location/LocationAutocomplete";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  Achievement,
  AvatarViewState,
  EducationItem,
  JobSeekerProfile,
  LicenseCertification,
  ProfileLink,
  ResumeViewState,
  WorkExperience,
} from "./profile-types";
import { buildLocation, getInitials, getVisibility } from "./profile-utils";

type ProfileInfoSectionProps = {
  profile: JobSeekerProfile;
  avatarView: AvatarViewState;
  resumeView: ResumeViewState;
  workExperience: WorkExperience[];
  education: EducationItem[];
  licenses: LicenseCertification[];
  achievements: Achievement[];
  links: ProfileLink[];
  avatarInputRef: RefObject<HTMLInputElement | null>;
  uploadingAvatar: boolean;
  onAvatarUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onProfileChange: (profile: JobSeekerProfile) => void;
};

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function buildLocationInput(profile: JobSeekerProfile) {
  const city = normalizeText(profile.city);
  const state = normalizeText(profile.state);
  const zip = normalizeText(profile.zip_code);

  if (!city && !state && !zip) return "";

  const cityState = [city, state].filter(Boolean).join(", ");

  if (zip) {
    return `${cityState} USA ${zip}`.trim();
  }

  return cityState;
}

function parseLocationInput(
  value: string,
  fallback: JobSeekerProfile,
): Pick<JobSeekerProfile, "city" | "state" | "zip_code"> {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return {
      city: null,
      state: null,
      zip_code: null,
    };
  }

  const zipMatch = normalized.match(/\b\d{5}(?:-\d{4})?\b/);
  const stateMatch = normalized.match(/\b[A-Z]{2}\b/);

  const cityPart = normalized
    .replace(/\bUSA\b/gi, "")
    .replace(/\b\d{5}(?:-\d{4})?\b/g, "")
    .replace(/\b[A-Z]{2}\b/g, "")
    .replace(/,/g, "")
    .trim();

  return {
    city: cityPart || fallback.city || null,
    state: stateMatch?.[0] ?? fallback.state ?? null,
    zip_code: zipMatch?.[0] ?? fallback.zip_code ?? null,
  };
}

function hasProfileChanges(
  profile: JobSeekerProfile,
  draft: JobSeekerProfile,
  initialLocationQuery: string,
  locationQuery: string,
) {
  return (
    normalizeText(profile.full_name) !== normalizeText(draft.full_name) ||
    normalizeText(profile.phone) !== normalizeText(draft.phone) ||
    normalizeText(profile.headline) !== normalizeText(draft.headline) ||
    Boolean(profile.open_to_relocation) !== Boolean(draft.open_to_relocation) ||
    getVisibility(profile.visibility) !== getVisibility(draft.visibility) ||
    initialLocationQuery.trim() !== locationQuery.trim()
  );
}

function hasResume(profile: JobSeekerProfile, resumeView: ResumeViewState) {
  return Boolean(profile.resume_url?.trim()) && Boolean(resumeView.href);
}

function getResumeName(profile: JobSeekerProfile) {
  return profile.resume_file_name?.trim() || "Resume uploaded";
}

function compactText(value: string | null | undefined, limit = 180) {
  const text = normalizeText(value);

  if (text.length <= limit) return text;

  return `${text.slice(0, limit).trim()}...`;
}

function formatWorkDates(item: WorkExperience) {
  const start = normalizeText(item.start_date);
  const end = item.is_current ? "Present" : normalizeText(item.end_date);

  if (!start && !end) return "";

  return `${start || "Start"} - ${end || "End"}`;
}

function ProfileAvatar({
  href,
  initials,
  uploading,
  onClick,
  size = "large",
}: {
  href: string | null;
  initials: string;
  uploading?: boolean;
  onClick?: () => void;
  size?: "large" | "medium";
}) {
  const isLarge = size === "large";
  const wrapperClassName = isLarge ? "size-24" : "size-20";
  const imageSize = isLarge ? 96 : 80;
  const isInteractive = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={uploading || !isInteractive}
      className={[
        "group relative grid shrink-0 place-items-center overflow-hidden rounded-full",
        "border border-border bg-[#e9fbf8] text-[#043331]",
        isInteractive ? "transition hover:ring-4 hover:ring-primary/10" : "",
        "disabled:pointer-events-none disabled:opacity-100",
        wrapperClassName,
      ].join(" ")}
      aria-label={isInteractive ? "Change profile photo" : "Profile photo"}
    >
      {href ? (
        <Image
          src={href}
          alt=""
          width={imageSize}
          height={imageSize}
          className="size-full object-cover"
        />
      ) : (
        <span
          className={isLarge ? "text-2xl font-bold" : "text-xl font-bold"}
          aria-hidden="true"
        >
          {initials}
        </span>
      )}

      {isInteractive && (
        <span className="absolute inset-0 hidden place-items-center bg-black/35 text-white group-hover:grid">
          {uploading ? (
            <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          ) : (
            <Pencil aria-hidden="true" className="size-5" />
          )}
        </span>
      )}
    </button>
  );
}

function PreviewSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#f2f2f2] bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>

      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function ProfileInfoSection({
  profile,
  avatarView,
  resumeView,
  workExperience,
  education,
  licenses,
  achievements,
  links,
  avatarInputRef,
  uploadingAvatar,
  onAvatarUpload,
  onProfileChange,
}: ProfileInfoSectionProps) {
  const [open, setOpen] = useState(false);
  const [employerPreviewOpen, setEmployerPreviewOpen] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [locationQuery, setLocationQuery] = useState("");
  const [initialLocationQuery, setInitialLocationQuery] = useState("");

  useEffect(() => {
    if (!open) return;

    const nextLocation = buildLocationInput(profile);

    setDraft(profile);
    setLocationQuery(nextLocation);
    setInitialLocationQuery(nextLocation);
  }, [open, profile]);

  const initials = getInitials(profile);
  const draftInitials = getInitials(draft);
  const location = buildLocation(profile);
  const visibility = getVisibility(profile.visibility);
  const isPublic = visibility === "public";

  const canSave =
    normalizeText(draft.full_name).length > 0 &&
    hasProfileChanges(profile, draft, initialLocationQuery, locationQuery);

  const openAvatarPicker = () => {
    avatarInputRef.current?.click();
  };

  const save = () => {
    if (!canSave) return;

    const parsedLocation = parseLocationInput(locationQuery, draft);

    onProfileChange({
      ...draft,
      ...parsedLocation,
    });

    setOpen(false);
  };

  const toggleVisibility = () => {
    onProfileChange({
      ...profile,
      visibility: isPublic ? "private" : "public",
    });
  };

  return (
    <>
      <section
        className="border-b border-border bg-background"
        aria-labelledby="profile-info-heading"
      >
        <div className="bg-gradient-to-r from-cyan-50 via-white to-orange-50 px-4 pb-12 pt-12">
          <div className="mx-auto max-w-5xl">
            <input
              ref={avatarInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="sr-only"
              onChange={onAvatarUpload}
            />

            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-start">
                <ProfileAvatar
                  href={avatarView.href}
                  initials={initials}
                  uploading={uploadingAvatar}
                  onClick={openAvatarPicker}
                />

                <div className="min-w-0">
                  <div className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-border">
                    Job seeker profile
                  </div>

                  <h1
                    id="profile-info-heading"
                    className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
                  >
                    {profile.full_name || "Your name"}
                  </h1>

                  {profile.headline && (
                    <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                      {profile.headline}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground">
                    {location && (
                      <span className="inline-flex items-center gap-2">
                        <MapPin aria-hidden="true" className="size-4" />
                        {location}
                      </span>
                    )}

                    {profile.email && (
                      <span className="inline-flex items-center gap-2">
                        <Mail aria-hidden="true" className="size-4" />
                        {profile.email}
                      </span>
                    )}

                    {profile.phone && (
                      <span className="inline-flex items-center gap-2">
                        <Phone aria-hidden="true" className="size-4" />
                        {profile.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

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

            <div className="mt-8 border border-[#f2f2f2] bg-white/90 p-5 shadow-none backdrop-blur [border-radius:3px]">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      "grid size-11 shrink-0 place-items-center rounded-2xl",
                      isPublic
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-muted text-muted-foreground",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {isPublic ? (
                      <Eye className="size-5" />
                    ) : (
                      <EyeOff className="size-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">
                        Your profile is {isPublic ? "public" : "private"}
                      </p>

                      {isPublic && (
                        <BadgeCheck
                          aria-hidden="true"
                          className="size-4 text-emerald-700"
                        />
                      )}
                    </div>

                    <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                      {isPublic
                        ? "Employers can find your profile and contact you about relevant opportunities."
                        : "Only employers you apply to can see your application details."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEmployerPreviewOpen(true)}
                    className="border border-[#f2f2f2] px-5 font-semibold shadow-none [border-radius:3px]"
                  >
                    View as Employer
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={toggleVisibility}
                    className="font-semibold [border-radius:3px]"
                  >
                    {isPublic ? "Set to Private" : "Set to Public"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[86vh] max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-0 shadow-2xl">
          <div className="border-b border-border px-7 py-6">
            <DialogTitle className="text-3xl font-bold tracking-tight">
              About Me
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              Update your profile photo, contact details, location, and profile
              visibility.
            </DialogDescription>
          </div>

          <div className="space-y-8 px-7 py-6">
            <section aria-labelledby="photo-heading">
              <div className="flex items-center gap-4">
                <ProfileAvatar
                  href={avatarView.href}
                  initials={draftInitials}
                  uploading={uploadingAvatar}
                  onClick={openAvatarPicker}
                  size="medium"
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={openAvatarPicker}
                  disabled={uploadingAvatar}
                  className="rounded-full px-5 font-semibold"
                >
                  {uploadingAvatar ? (
                    <>
                      <Loader2
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Pencil aria-hidden="true" className="size-4" />
                      Change photo
                    </>
                  )}
                </Button>
              </div>
            </section>

            <section aria-labelledby="contact-heading">
              <h2
                id="contact-heading"
                className="text-xl font-bold tracking-tight"
              >
                Contact information
              </h2>

              <div className="mt-5 grid gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full name *</Label>
                  <Input
                    id="fullName"
                    value={draft.full_name ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, full_name: event.target.value })
                    }
                    autoComplete="name"
                    className="h-12"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <p className="text-base font-medium text-foreground">
                    {draft.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You may change your email in Account Settings.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    value={draft.phone ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, phone: event.target.value })
                    }
                    autoComplete="tel"
                    placeholder="+1 555-012-4890"
                    className="h-12"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-end justify-between gap-4">
                    <Label htmlFor="headline">Headline</Label>
                    <span className="text-xs text-muted-foreground">
                      {(draft.headline ?? "").length}/100
                    </span>
                  </div>

                  <textarea
                    id="headline"
                    value={draft.headline ?? ""}
                    maxLength={100}
                    onChange={(event) =>
                      setDraft({ ...draft, headline: event.target.value })
                    }
                    placeholder="Tell us about yourself"
                    className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />

                  <p className="text-xs text-muted-foreground">Optional</p>
                </div>
              </div>
            </section>

            <section aria-labelledby="location-heading">
              <h2
                id="location-heading"
                className="text-xl font-bold tracking-tight"
              >
                Location
              </h2>

              <div className="mt-5 space-y-1.5">
                <Label htmlFor="locationInput">
                  Postal Code or City, State
                </Label>

                <LocationAutocomplete
                  id="locationInput"
                  value={locationQuery}
                  placeholder="Postal Code or City, State"
                  onValueChange={(value) => {
                    const parsedLocation = parseLocationInput(value, draft);

                    setLocationQuery(value);
                    setDraft({
                      ...draft,
                      ...parsedLocation,
                    });
                  }}
                  onLocationSelect={(selectedLocation) => {
                    setLocationQuery(selectedLocation.label);
                    setDraft({
                      ...draft,
                      city: selectedLocation.city,
                      state: selectedLocation.state,
                      zip_code: selectedLocation.zip_code,
                    });
                  }}
                  onClear={() => {
                    setDraft({
                      ...draft,
                      city: null,
                      state: null,
                      zip_code: null,
                    });
                  }}
                />
              </div>

              <fieldset className="mt-5">
                <legend className="text-sm font-semibold">
                  Are you open to relocation?
                </legend>

                <div className="mt-3 flex flex-col gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="openToRelocation"
                      checked={Boolean(draft.open_to_relocation)}
                      onChange={() =>
                        setDraft({ ...draft, open_to_relocation: true })
                      }
                      className="accent-primary"
                    />
                    Yes
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="openToRelocation"
                      checked={!draft.open_to_relocation}
                      onChange={() =>
                        setDraft({ ...draft, open_to_relocation: false })
                      }
                      className="accent-primary"
                    />
                    No
                  </label>
                </div>
              </fieldset>
            </section>

            <section aria-labelledby="visibility-heading">
              <h2
                id="visibility-heading"
                className="text-xl font-bold tracking-tight"
              >
                Profile visibility
              </h2>

              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    visibility:
                      getVisibility(draft.visibility) === "public"
                        ? "private"
                        : "public",
                  })
                }
                className="mt-3 flex w-full items-start gap-3 rounded-2xl border border-border bg-white p-4 text-left transition hover:bg-muted/40"
              >
                <div
                  className={[
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    getVisibility(draft.visibility) === "public"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-muted text-muted-foreground",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {getVisibility(draft.visibility) === "public" ? (
                    <Eye className="size-5" />
                  ) : (
                    <EyeOff className="size-5" />
                  )}
                </div>

                <span>
                  <span className="block text-sm font-semibold">
                    Your profile is{" "}
                    {getVisibility(draft.visibility) === "public"
                      ? "public"
                      : "private"}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                    {getVisibility(draft.visibility) === "public"
                      ? "Employers may discover your profile and contact you about relevant opportunities."
                      : "Only employers you apply to can see your application details."}
                  </span>
                </span>
              </button>
            </section>
          </div>

          <div className="sticky bottom-0 border-t border-border bg-background px-7 py-5">
            <Button
              type="button"
              className="w-full bg-[#087f73] text-white hover:bg-[#066d63] disabled:bg-[#087f73]/40"
              size="lg"
              onClick={save}
              disabled={!canSave}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={employerPreviewOpen} onOpenChange={setEmployerPreviewOpen}>
        <DialogContent className="max-h-[86vh] max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-0 shadow-2xl">
          <div className="border-b border-border px-6 py-5">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Employer preview
            </DialogTitle>

            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              This is the candidate snapshot employers see before reviewing your
              full profile.
            </DialogDescription>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="rounded-xl border border-[#f2f2f2] bg-white p-4">
              <div className="flex items-start gap-4">
                <ProfileAvatar
                  href={avatarView.href}
                  initials={initials}
                  size="medium"
                />

                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold tracking-tight">
                    {profile.full_name || "Your name"}
                  </h3>

                  {profile.headline && (
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {profile.headline}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    {location && <span>{location}</span>}

                    {location && <span aria-hidden="true">·</span>}

                    {profile.open_to_relocation ? (
                      <span>Willing to relocate</span>
                    ) : (
                      <span>Open to local opportunities</span>
                    )}
                  </div>

                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {isPublic ? (
                      <>
                        <Eye aria-hidden="true" className="size-3.5" />
                        Public profile
                      </>
                    ) : (
                      <>
                        <EyeOff aria-hidden="true" className="size-3.5" />
                        Private profile
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {hasResume(profile, resumeView) && (
              <PreviewSection
                icon={<FileText aria-hidden="true" className="size-4" />}
                title="Resume"
              >
                <p className="text-sm font-medium text-foreground">
                  {getResumeName(profile)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Employers can review the uploaded resume with this profile.
                </p>
              </PreviewSection>
            )}

            {(profile.executive_summary || profile.objective) && (
              <PreviewSection
                icon={<BadgeCheck aria-hidden="true" className="size-4" />}
                title={
                  profile.executive_summary ? "Executive summary" : "Objective"
                }
              >
                <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {compactText(
                    profile.executive_summary || profile.objective,
                    220,
                  )}
                </p>
              </PreviewSection>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <PreviewSection
                icon={<Medal aria-hidden="true" className="size-4" />}
                title="Top skills"
              >
                <div className="flex flex-wrap gap-2">
                  {profile.skills.slice(0, 10).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-[#f2f2f2] bg-white px-3 py-1 text-xs font-semibold text-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </PreviewSection>
            )}

            {workExperience.length > 0 && (
              <PreviewSection
                icon={
                  <BriefcaseBusiness aria-hidden="true" className="size-4" />
                }
                title="Recent work experience"
              >
                <div className="space-y-3">
                  {workExperience.slice(0, 2).map((item) => (
                    <div key={item.id}>
                      <p className="text-sm font-semibold text-foreground">
                        {item.title || "Job title"}
                      </p>

                      {item.company && (
                        <p className="mt-0.5 text-sm text-foreground">
                          {item.company}
                        </p>
                      )}

                      {formatWorkDates(item) && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatWorkDates(item)}
                        </p>
                      )}

                      {item.description && (
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {compactText(item.description, 130)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </PreviewSection>
            )}

            {education.length > 0 && (
              <PreviewSection
                icon={<GraduationCap aria-hidden="true" className="size-4" />}
                title="Education"
              >
                <div className="space-y-3">
                  {education.slice(0, 2).map((item) => (
                    <div key={item.id}>
                      <p className="text-sm font-semibold text-foreground">
                        {item.school_name || "School"}
                      </p>

                      {item.degree && (
                        <p className="mt-0.5 text-sm text-foreground">
                          {item.degree}
                        </p>
                      )}

                      {(item.start_year ||
                        item.end_year ||
                        item.is_current) && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.start_year ? item.start_year : ""}
                          {item.start_year || item.end_year || item.is_current
                            ? " - "
                            : ""}
                          {item.is_current
                            ? "Present"
                            : item.end_year
                              ? item.end_year
                              : ""}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </PreviewSection>
            )}

            {licenses.length > 0 && (
              <PreviewSection
                icon={<Award aria-hidden="true" className="size-4" />}
                title="Licenses and certificates"
              >
                <div className="space-y-2">
                  {licenses.slice(0, 2).map((item) => (
                    <div key={item.id}>
                      <p className="text-sm font-semibold text-foreground">
                        {item.name || "License or certificate"}
                      </p>

                      {item.issue_year && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.issue_year}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </PreviewSection>
            )}

            {achievements.length > 0 && (
              <PreviewSection
                icon={<Award aria-hidden="true" className="size-4" />}
                title="Achievements"
              >
                <div className="space-y-2">
                  {achievements.slice(0, 2).map((item) => (
                    <div key={item.id}>
                      <p className="text-sm font-semibold text-foreground">
                        {item.title || "Achievement"}
                      </p>
                    </div>
                  ))}
                </div>
              </PreviewSection>
            )}

            {links.length > 0 && (
              <PreviewSection
                icon={<LinkIcon aria-hidden="true" className="size-4" />}
                title="Professional links"
              >
                <div className="space-y-2">
                  {links.slice(0, 3).map((item) => (
                    <div key={item.id}>
                      <p className="text-sm font-semibold text-foreground">
                        {item.label || "Professional link"}
                      </p>

                      {item.url && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {item.url}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </PreviewSection>
            )}

            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-700">Profile Tip</p>
              <p className="mt-1 text-sm leading-6 text-foreground">
                Add work history, skills, and a resume to give employers enough
                context to contact you confidently.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                onClick={() => setEmployerPreviewOpen(false)}
                className="bg-[#087f73] px-6 text-white hover:bg-[#066d63]"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

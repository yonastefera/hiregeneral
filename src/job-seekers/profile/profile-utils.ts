import type {
  EducationItem,
  JobSeekerProfile,
  JobSeekerProfileUpdate,
  ProfileFormErrors,
  ProfileVisibility,
} from "./profile-types";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export const ACCEPTED_RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;
export const ACCEPTED_AVATAR_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
] as const;

export function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getInitials(profile: JobSeekerProfile) {
  if (profile.full_name?.trim()) {
    return profile.full_name
      .split(" ")
      .filter(Boolean)
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return profile.email?.slice(0, 2).toUpperCase() ?? "??";
}

export function normalizeNullableText(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

export function getSafeSkills(skills: string[] | null | undefined) {
  return Array.isArray(skills) ? skills : [];
}

export function getVisibility(
  value: string | null | undefined,
): ProfileVisibility {
  return value === "public" ? "public" : "private";
}

export function buildLocation(profile: JobSeekerProfile) {
  const cityStateZip = [profile.city, profile.state, profile.zip_code]
    .filter(Boolean)
    .join(", ");

  return cityStateZip || profile.location || "";
}

export function getProfileUpdate(
  profile: JobSeekerProfile,
): JobSeekerProfileUpdate {
  const city = normalizeNullableText(profile.city);
  const state = normalizeNullableText(profile.state);
  const zipCode = normalizeNullableText(profile.zip_code);

  return {
    full_name: normalizeNullableText(profile.full_name),
    headline: normalizeNullableText(profile.headline),
    location: normalizeNullableText(
      [city, state, zipCode].filter(Boolean).join(", "),
    ),
    city,
    state,
    zip_code: zipCode,
    phone: normalizeNullableText(profile.phone),
    resume_url: profile.resume_url,
    avatar_url: profile.avatar_url ?? null,
    skills: getSafeSkills(profile.skills),
    additional_info: normalizeNullableText(profile.additional_info),
    executive_summary: normalizeNullableText(profile.executive_summary),
    objective: normalizeNullableText(profile.objective),
    open_to_relocation: Boolean(profile.open_to_relocation),
    minimum_desired_pay: normalizeNullableText(profile.minimum_desired_pay),
    level_of_experience: normalizeNullableText(profile.level_of_experience),
    highest_degree: normalizeNullableText(profile.highest_degree),
    industry: normalizeNullableText(profile.industry),
    gender: normalizeNullableText(profile.gender),
    gender_self_describe:
      profile.gender === "self_describe"
        ? normalizeNullableText(profile.gender_self_describe)
        : null,
    ethnicity: normalizeNullableText(profile.ethnicity),
    ethnicity_self_describe:
      profile.ethnicity === "self_describe"
        ? normalizeNullableText(profile.ethnicity_self_describe)
        : null,
    veteran_status: normalizeNullableText(profile.veteran_status),
    disability_status: normalizeNullableText(profile.disability_status),
    visibility: getVisibility(profile.visibility),
  };
}

export function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop();

  return extension ? `.${extension.toLowerCase()}` : "";
}

export function isAcceptedResumeFile(file: File) {
  const extension = getFileExtension(file.name);

  return ACCEPTED_RESUME_EXTENSIONS.includes(
    extension as (typeof ACCEPTED_RESUME_EXTENSIONS)[number],
  );
}

export function isAcceptedAvatarFile(file: File) {
  const extension = getFileExtension(file.name);

  return ACCEPTED_AVATAR_EXTENSIONS.includes(
    extension as (typeof ACCEPTED_AVATAR_EXTENSIONS)[number],
  );
}

export function validateResumeFile(file: File): string | null {
  if (!isAcceptedResumeFile(file)) {
    return "Resume must be a PDF, DOC, or DOCX file.";
  }

  if (file.size > MAX_RESUME_BYTES) {
    return "Resume must be under 5 MB.";
  }

  return null;
}

export function validateAvatarFile(file: File): string | null {
  if (!isAcceptedAvatarFile(file)) {
    return "Profile photo must be JPG, PNG, or WEBP.";
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return "Profile photo must be under 2 MB.";
  }

  return null;
}

export function validateProfile(profile: JobSeekerProfile): ProfileFormErrors {
  const errors: ProfileFormErrors = {};

  if (profile.full_name && profile.full_name.length > 120) {
    errors.full_name = "Full name must be 120 characters or fewer.";
  }

  if (profile.headline && profile.headline.length > 100) {
    errors.headline = "Headline must be 100 characters or fewer.";
  }

  if (profile.city && profile.city.length > 100) {
    errors.city = "City must be 100 characters or fewer.";
  }

  if (profile.zip_code && profile.zip_code.length > 20) {
    errors.zip_code = "ZIP code must be 20 characters or fewer.";
  }

  if (profile.phone && profile.phone.length > 40) {
    errors.phone = "Phone number must be 40 characters or fewer.";
  }

  if (profile.executive_summary && profile.executive_summary.length > 1200) {
    errors.executive_summary =
      "Executive summary must be 1,200 characters or fewer.";
  }

  if (profile.objective && profile.objective.length > 1200) {
    errors.objective = "Objective must be 1,200 characters or fewer.";
  }

  if (
    profile.gender === "self_describe" &&
    !profile.gender_self_describe?.trim()
  ) {
    errors.gender_self_describe =
      "Describe your gender or choose another option.";
  }

  if (
    profile.ethnicity === "self_describe" &&
    !profile.ethnicity_self_describe?.trim()
  ) {
    errors.ethnicity_self_describe =
      "Describe your ethnicity or choose another option.";
  }

  return errors;
}

export function isPublicUrl(value: string | null | undefined) {
  return Boolean(value?.startsWith("http://") || value?.startsWith("https://"));
}

export function getResumeLabel(profile: JobSeekerProfile) {
  if (!profile.resume_url) return "No resume uploaded yet.";

  if (profile.resume_file_name) return profile.resume_file_name;

  if (isPublicUrl(profile.resume_url)) return "View uploaded resume";

  return profile.resume_url.split("/").pop() ?? "View uploaded resume";
}

export function getDisplayDate(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatEducationDates(education: EducationItem) {
  if (education.is_current) {
    return education.start_year
      ? `${education.start_year} – Present`
      : "Currently enrolled";
  }

  if (education.start_year && education.end_year) {
    return `${education.start_year} – ${education.end_year}`;
  }

  if (education.start_year) return String(education.start_year);
  if (education.end_year) return String(education.end_year);

  return null;
}

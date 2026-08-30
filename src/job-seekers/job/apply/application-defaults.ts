import type { ProfileLink } from "@/job-seekers/profile/profile-types";

export type ApplicationDefaults = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  yearsExp: string;
  resumePath: string | null;
  resumeName: string | null;
};

type ProfileDefaultsSource = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  level_of_experience: string | null;
  profile_links: unknown;
  resume_url: string | null;
  resume_file_name: string | null;
};

function linksFrom(value: unknown): ProfileLink[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (link): link is ProfileLink =>
      typeof link === "object" &&
      link !== null &&
      typeof (link as ProfileLink).label === "string" &&
      typeof (link as ProfileLink).url === "string",
  );
}

function experienceRange(level: string | null) {
  const normalized = level?.toLowerCase() ?? "";
  if (/executive|director|principal|10\+|8\+/.test(normalized)) return "8+";
  if (/senior|5[-–]7|5\+/.test(normalized)) return "5-7";
  if (/mid|intermediate|2[-–]4/.test(normalized)) return "2-4";
  if (/entry|junior|intern|0[-–]1/.test(normalized)) return "0-1";
  return "";
}

export function buildApplicationDefaults(
  profile: ProfileDefaultsSource | null,
  authenticatedEmail: string,
  userId: string,
): ApplicationDefaults {
  const links = linksFrom(profile?.profile_links);
  const findLink = (label: string) =>
    links.find((link) => link.label.trim().toLowerCase() === label)?.url ?? "";
  const resumePath =
    profile?.resume_url?.startsWith(`${userId}/`) === true
      ? profile.resume_url
      : null;

  return {
    fullName: profile?.full_name?.trim() ?? "",
    email: profile?.email?.trim() || authenticatedEmail,
    phone: profile?.phone?.trim() ?? "",
    location: profile?.location?.trim() ?? "",
    linkedin: findLink("linkedin"),
    portfolio: findLink("professional website") || findLink("website"),
    yearsExp: experienceRange(profile?.level_of_experience ?? null),
    resumePath,
    resumeName: resumePath
      ? profile?.resume_file_name?.trim() || "Saved resume"
      : null,
  };
}

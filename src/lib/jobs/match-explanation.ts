import type { Job } from "@/lib/db/types";

export type MatchProfile = {
  headline: string | null;
  level_of_experience: string | null;
  location: string | null;
  skills: string[];
};

export type JobMatchExplanation = {
  label: "Strong match" | "Good match" | "Potential match";
  reasons: string[];
  score: number;
};

function normalized(value: string | null | undefined) {
  return (
    value
      ?.toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}+#.]+/gu, " ")
      .trim() ?? ""
  );
}

function terms(value: string | null | undefined) {
  return new Set(
    normalized(value)
      .split(" ")
      .filter((term) => term.length > 2),
  );
}

function intersection(left: string[], right: string[]) {
  const expected = new Set(right.map(normalized));
  return left.filter((value) => expected.has(normalized(value)));
}

export function explainJobMatch(
  profile: MatchProfile,
  job: Pick<Job, "title" | "skills" | "location" | "experience_level">,
): JobMatchExplanation | null {
  const reasons: string[] = [];
  let score = 0;

  const skillMatches = intersection(profile.skills, job.skills ?? []);
  if (skillMatches.length) {
    score += Math.min(55, 20 + skillMatches.length * 12);
    reasons.push(
      `${skillMatches.slice(0, 3).join(", ")} ${skillMatches.length === 1 ? "skill matches" : "skills match"}`,
    );
  }

  const headlineTerms = terms(profile.headline);
  const titleTerms = terms(job.title);
  const titleMatches = [...titleTerms].filter((term) =>
    headlineTerms.has(term),
  );
  if (titleMatches.length) {
    score += Math.min(25, 12 + titleMatches.length * 5);
    reasons.push("Role title aligns with your profile");
  }

  const profileLocation = normalized(profile.location);
  const jobLocation = normalized(job.location);
  if (
    profileLocation &&
    (jobLocation.includes(profileLocation) || jobLocation.includes("remote"))
  ) {
    score += 10;
    reasons.push(
      jobLocation.includes("remote")
        ? "Remote-friendly location"
        : "Location aligns",
    );
  }

  if (
    profile.level_of_experience &&
    job.experience_level &&
    normalized(job.experience_level).includes(
      normalized(profile.level_of_experience),
    )
  ) {
    score += 10;
    reasons.push("Experience level aligns");
  }

  if (!reasons.length) return null;

  return {
    score: Math.min(100, score),
    label:
      score >= 70
        ? "Strong match"
        : score >= 45
          ? "Good match"
          : "Potential match",
    reasons: reasons.slice(0, 3),
  };
}

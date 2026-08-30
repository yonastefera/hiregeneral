import type { Job } from "@/lib/db/types";

export type ApplicationAssistantProfile = {
  headline: string | null;
  skills: string[];
};

export type ApplicationAssistantResult = {
  matchedSkills: string[];
  prompts: string[];
  starter: string;
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}+#.]+/gu, " ")
    .trim();
}

function uniqueClean(values: string[], limit: number) {
  const seen = new Set<string>();

  return values
    .map((value) => value.trim())
    .filter((value) => {
      const key = normalize(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

export function buildApplicationAssistant(
  profile: ApplicationAssistantProfile,
  job: Pick<Job, "title" | "company_name" | "skills" | "requirements">,
): ApplicationAssistantResult {
  const profileSkills = uniqueClean(profile.skills, 30);
  const requiredSkills = new Set((job.skills ?? []).map(normalize));
  const matchedSkills = profileSkills
    .filter((skill) => requiredSkills.has(normalize(skill)))
    .slice(0, 5);
  const headline = profile.headline?.trim() || null;
  const prompts = [
    matchedSkills.length > 0
      ? `Add one specific outcome that demonstrates ${matchedSkills.slice(0, 3).join(", ")}.`
      : "Connect one verified skill from your background to a requirement in this role.",
    "Include a measurable result only if you can verify the number.",
    `Explain briefly why this ${job.title.trim()} role interests you.`,
  ];
  const evidence = [
    headline ? `My profile describes my background as ${headline}.` : null,
    matchedSkills.length > 0
      ? `My listed skills include ${matchedSkills.join(", ")}.`
      : null,
  ].filter((value): value is string => Boolean(value));

  return {
    matchedSkills,
    prompts,
    starter: [
      `I am interested in the ${job.title.trim()} role at ${job.company_name.trim()}.`,
      ...evidence,
    ].join(" "),
  };
}

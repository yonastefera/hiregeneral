import mammoth from "mammoth";
import { extractText } from "unpdf";

const MAX_EXTRACTED_TEXT_LENGTH = 200_000;

export type ResumeSuggestions = {
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  portfolio: string | null;
  yearsExperience: "0-1" | "2-4" | "5-7" | "8+" | null;
};

export async function extractResumeText(
  bytes: Uint8Array,
  fileName: string,
): Promise<string> {
  const extension = fileName.split(".").pop()?.toLowerCase();
  let text: string;

  if (extension === "pdf") {
    const result = await extractText(bytes, { mergePages: true });
    text = Array.isArray(result.text) ? result.text.join("\n") : result.text;
  } else if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    text = result.value;
  } else {
    throw new Error("Only PDF and DOCX resumes can be parsed.");
  }

  return text.slice(0, MAX_EXTRACTED_TEXT_LENGTH);
}

function firstMatch(text: string, pattern: RegExp) {
  return text.match(pattern)?.[0]?.trim() ?? null;
}

function normalizeUrl(value: string | null) {
  if (!value) return null;
  const trimmed = value.replace(/[),.;]+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function parseResumeSuggestions(text: string): ResumeSuggestions {
  const email = firstMatch(text, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phone = firstMatch(
    text,
    /(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/,
  );
  const linkedin = normalizeUrl(
    firstMatch(
      text,
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w%-]+\/?/i,
    ),
  );
  const portfolio = normalizeUrl(
    firstMatch(
      text,
      /(?:https?:\/\/)?(?:www\.)?(?:github\.com\/[\w.-]+|[\w-]+\.(?:dev|io|me)(?:\/[\w./-]*)?)/i,
    ),
  );
  const years = [
    ...text.matchAll(/(\d{1,2})(?:\+)?\s+years?(?:\s+of)?\s+experience/gi),
  ].map((match) => Number(match[1]));
  const highestYears = years.length ? Math.max(...years) : null;
  const yearsExperience =
    highestYears === null
      ? null
      : highestYears >= 8
        ? "8+"
        : highestYears >= 5
          ? "5-7"
          : highestYears >= 2
            ? "2-4"
            : "0-1";

  return { email, phone, linkedin, portfolio, yearsExperience };
}

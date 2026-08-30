import { z } from "zod";

export const SCORECARD_RECOMMENDATIONS = [
  "strong_yes",
  "yes",
  "mixed",
  "no",
  "strong_no",
] as const;

const criterionSchema = z.object({
  name: z.string().trim().min(1).max(80),
  rating: z.number().int().min(1).max(5),
  note: z.string().trim().max(1000).default(""),
});

export const interviewScorecardSchema = z.object({
  interviewRound: z.string().trim().min(1).max(80),
  recommendation: z.enum(SCORECARD_RECOMMENDATIONS),
  overallRating: z.number().int().min(1).max(5),
  criteria: z.array(criterionSchema).min(1).max(12),
  summary: z.string().trim().max(3000).nullable().optional(),
});

export type InterviewScorecardInput = z.infer<typeof interviewScorecardSchema>;

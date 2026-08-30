import { z } from "zod";

export const EMPLOYER_APPLICATION_STATUSES = [
  "reviewing",
  "interview",
  "offer",
  "rejected",
] as const;

export const employerApplicationUpdateSchema = z.object({
  status: z.enum(EMPLOYER_APPLICATION_STATUSES),
  note: z.string().trim().max(1000).nullable().optional(),
});

export type EmployerApplicationStatus =
  (typeof EMPLOYER_APPLICATION_STATUSES)[number];

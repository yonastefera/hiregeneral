import { z } from "zod";

import { legalPolicyRelease } from "@/legal/policy-release";

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email());

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH)
  .max(PASSWORD_MAX_LENGTH);

export const publicRoleSchema = z.enum(["job_seeker", "recruiter"]);

export const signupSchema = z
  .object({
    email: emailSchema,
    fullName: z.string().trim().min(1).max(120).optional(),
    password: passwordSchema,
    role: publicRoleSchema,
  })
  .strict();

export const passwordResetSchema = z.object({ email: emailSchema }).strict();

export const emailOtpRequestSchema = z.object({ email: emailSchema }).strict();

export const emailOtpVerifySchema = z
  .object({
    email: emailSchema,
    token: z
      .string()
      .trim()
      .regex(/^\d{6}$/),
  })
  .strict();

export const roleSelectionSchema = z
  .object({
    role: publicRoleSchema,
    fullName: z.string().trim().max(120).optional(),
    legalAcceptance: z
      .object({
        termsVersion: z.literal(legalPolicyRelease.termsVersion),
        privacyVersion: z.literal(legalPolicyRelease.privacyVersion),
      })
      .strict()
      .optional(),
  })
  .strict();

export const passwordUpdateSchema = z
  .object({
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .strict()
  .refine((value) => value.password === value.passwordConfirmation, {
    message: "Passwords do not match.",
    path: ["passwordConfirmation"],
  });

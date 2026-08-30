import { z } from "zod";

export const addTeamMemberSchema = z.object({
  email: z.email().trim().toLowerCase().max(254),
  role: z.enum(["admin", "interviewer"]),
});

export const removeTeamMemberSchema = z.object({ memberId: z.uuid() });

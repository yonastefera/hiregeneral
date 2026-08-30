import { z } from "zod";

export const alertFrequencySchema = z.enum(["off", "daily", "weekly"]);

export const savedSearchFieldsSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    query: z.string().trim().max(200).default(""),
    location: z.string().trim().max(160).default(""),
    postedDays: z.number().int().min(1).max(3650).default(30),
    distanceMiles: z.number().int().min(1).max(100).default(100),
    workMode: z.enum(["", "Remote", "Hybrid", "On-site"]).default(""),
    easyApply: z.boolean().default(false),
    alertFrequency: alertFrequencySchema.default("weekly"),
  })
  .strict();

export const updateSavedSearchSchema = savedSearchFieldsSchema.partial();

export type SavedSearchFields = z.infer<typeof savedSearchFieldsSchema>;

export function toSavedSearchInsert(fields: SavedSearchFields, userId: string) {
  return {
    user_id: userId,
    name: fields.name,
    query: fields.query,
    location: fields.location,
    posted_days: fields.postedDays,
    distance_miles: fields.distanceMiles,
    work_mode: fields.workMode,
    easy_apply: fields.easyApply,
    alert_frequency: fields.alertFrequency,
  };
}

export function toSavedSearchUpdate(
  fields: z.infer<typeof updateSavedSearchSchema>,
) {
  return {
    ...(fields.name === undefined ? {} : { name: fields.name }),
    ...(fields.query === undefined ? {} : { query: fields.query }),
    ...(fields.location === undefined ? {} : { location: fields.location }),
    ...(fields.postedDays === undefined
      ? {}
      : { posted_days: fields.postedDays }),
    ...(fields.distanceMiles === undefined
      ? {}
      : { distance_miles: fields.distanceMiles }),
    ...(fields.workMode === undefined ? {} : { work_mode: fields.workMode }),
    ...(fields.easyApply === undefined ? {} : { easy_apply: fields.easyApply }),
    ...(fields.alertFrequency === undefined
      ? {}
      : { alert_frequency: fields.alertFrequency }),
    updated_at: new Date().toISOString(),
  };
}

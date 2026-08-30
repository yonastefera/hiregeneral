import { z } from "zod";

export const PIPELINE_APPLICATION_STATUSES = [
  "reviewing",
  "interview",
  "offer",
  "rejected",
] as const;

export type PipelineApplicationStatus =
  (typeof PIPELINE_APPLICATION_STATUSES)[number];

export type PipelineStage = {
  id: string | null;
  name: string;
  position: number;
  applicationStatus: PipelineApplicationStatus;
};

export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  { id: null, name: "Reviewing", position: 0, applicationStatus: "reviewing" },
  { id: null, name: "Interview", position: 1, applicationStatus: "interview" },
  { id: null, name: "Offer", position: 2, applicationStatus: "offer" },
  {
    id: null,
    name: "Not selected",
    position: 3,
    applicationStatus: "rejected",
  },
];

const pipelineStageSchema = z.object({
  id: z.uuid().nullable(),
  name: z.string().trim().min(1).max(60),
  position: z.number().int().min(0).max(11),
  applicationStatus: z.enum(PIPELINE_APPLICATION_STATUSES),
});

export const pipelineConfigurationSchema = z
  .object({ stages: z.array(pipelineStageSchema).min(2).max(12) })
  .superRefine(({ stages }, context) => {
    const names = stages.map((stage) => stage.name.toLowerCase());
    const positions = stages.map((stage) => stage.position);
    const ids = stages.flatMap((stage) => (stage.id ? [stage.id] : []));
    if (new Set(names).size !== names.length) {
      context.addIssue({
        code: "custom",
        message: "Stage names must be unique.",
      });
    }
    if (
      new Set(positions).size !== positions.length ||
      [...positions]
        .sort((a, b) => a - b)
        .some((value, index) => value !== index)
    ) {
      context.addIssue({
        code: "custom",
        message: "Stage order must be contiguous.",
      });
    }
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        message: "Stage identifiers must be unique.",
      });
    }
  });

export const moveToPipelineStageSchema = z.object({
  stageId: z.uuid(),
  note: z.string().trim().max(1000).nullable().optional(),
});

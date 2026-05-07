import { greenhouseAdapter } from "./greenhouse";
import type { JobSourceType } from "./job-sources";
import { leverAdapter } from "./lever";
import type { JobSourceAdapter } from "./source";
import { workdayAdapter } from "./workday";

const adapters = new Map<JobSourceType, JobSourceAdapter>([
  [greenhouseAdapter.type, greenhouseAdapter],
  [leverAdapter.type, leverAdapter],
  [workdayAdapter.type, workdayAdapter],
]);

export function getJobSourceAdapter(sourceType: JobSourceType) {
  return adapters.get(sourceType) ?? null;
}

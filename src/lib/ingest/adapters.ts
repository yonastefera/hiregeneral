import { greenhouseAdapter } from "./greenhouse";
import type { JobSourceType } from "./job-sources";
import { leverAdapter } from "./lever";
import { oracleHcmAdapter } from "./oracle-hcm";
import type { JobSourceAdapter } from "./source";
import { workdayAdapter } from "./workday";

const adapters = new Map<JobSourceType, JobSourceAdapter>([
  [greenhouseAdapter.type, greenhouseAdapter],
  [leverAdapter.type, leverAdapter],
  [oracleHcmAdapter.type, oracleHcmAdapter],
  [workdayAdapter.type, workdayAdapter],
]);

export function getJobSourceAdapter(sourceType: JobSourceType) {
  return adapters.get(sourceType) ?? null;
}

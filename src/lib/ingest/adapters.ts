import { ashbyAdapter } from "./ashby";
import { greenhouseAdapter } from "./greenhouse";
import type { JobSourceType } from "./job-sources";
import { leverAdapter } from "./lever";
import { oracleHcmAdapter } from "./oracle-hcm";
import { phenomAdapter } from "./phenom";
import { scraperAdapter } from "./scraper";
import type { JobSourceAdapter } from "./source";
import { successFactorsAdapter } from "./successfactors";
import { workdayAdapter } from "./workday";

const adapters = new Map<JobSourceType, JobSourceAdapter>([
  [ashbyAdapter.type, ashbyAdapter],
  [greenhouseAdapter.type, greenhouseAdapter],
  [leverAdapter.type, leverAdapter],
  [oracleHcmAdapter.type, oracleHcmAdapter],
  [phenomAdapter.type, phenomAdapter],
  [scraperAdapter.type, scraperAdapter],
  [successFactorsAdapter.type, successFactorsAdapter],
  [workdayAdapter.type, workdayAdapter],
]);

export function getJobSourceAdapter(sourceType: JobSourceType) {
  return adapters.get(sourceType) ?? null;
}

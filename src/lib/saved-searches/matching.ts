export type AlertSearch = {
  easy_apply: boolean;
  location: string;
  query: string;
  work_mode: string;
};

export type AlertJob = {
  apply_url: string | null;
  category: string | null;
  company_name: string;
  description: string;
  location: string;
  skills: string[];
  title: string;
  work_mode: string;
};

function normalized(value: string | null | undefined) {
  return value?.toLocaleLowerCase().replace(/\s+/g, " ").trim() ?? "";
}

function queryTerms(query: string) {
  return normalized(query)
    .split(/[^\p{L}\p{N}+#.]+/u)
    .filter((term) => term.length > 1);
}

export function matchesSavedSearch(search: AlertSearch, job: AlertJob) {
  if (
    search.work_mode &&
    normalized(job.work_mode) !== normalized(search.work_mode)
  ) {
    return false;
  }
  if (search.easy_apply && job.apply_url?.trim()) return false;

  const expectedLocation = normalized(search.location);
  if (
    expectedLocation &&
    !normalized(job.location).includes(expectedLocation)
  ) {
    return false;
  }

  const terms = queryTerms(search.query);
  if (!terms.length) return true;

  const searchable = normalized(
    [
      job.title,
      job.company_name,
      job.category,
      job.location,
      job.skills.join(" "),
      job.description,
    ].join(" "),
  );

  return terms.every((term) => searchable.includes(term));
}

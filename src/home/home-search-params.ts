import type { SelectedKeyword, SelectedLocation } from "./HomeSearchForm";

interface BuildJobsSearchParamsInput {
  query: string;
  selectedKeyword: SelectedKeyword | null;
  locationQuery: string;
  selectedLocation: SelectedLocation | null;
}

function setKeywordSearchParam(params: URLSearchParams, value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) return;
  params.set("query", trimmedValue);
}

export function buildJobsSearchParams({
  query,
  selectedKeyword,
  locationQuery,
  selectedLocation,
}: BuildJobsSearchParamsInput) {
  const params = new URLSearchParams();

  const trimmedQuery = query.trim();
  const trimmedLocation = locationQuery.trim();

  if (selectedKeyword?.term) {
    setKeywordSearchParam(params, selectedKeyword.term);
  } else {
    setKeywordSearchParam(params, trimmedQuery);
  }

  if (selectedLocation) {
    params.set("city", selectedLocation.city);
    params.set("state", selectedLocation.state);
    params.set(
      "location",
      `${selectedLocation.city}, ${selectedLocation.state}`,
    );

    if (selectedLocation.zip_code) {
      params.set("zip", selectedLocation.zip_code);
    }
  } else if (trimmedLocation) {
    params.set("location", trimmedLocation);
  }

  return params;
}

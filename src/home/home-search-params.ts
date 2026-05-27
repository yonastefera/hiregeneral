import type { SelectedKeyword, SelectedLocation } from "./HomeSearchForm";

interface BuildJobsSearchParamsInput {
  query: string;
  selectedKeyword: SelectedKeyword | null;
  locationQuery: string;
  selectedLocation: SelectedLocation | null;
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

  if (selectedKeyword) {
    params.set("q", selectedKeyword.term);
  } else if (trimmedQuery) {
    params.set("q", trimmedQuery);
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

export type LocationSuggestion = {
  id: string;
  label: string;
  city: string;
  state: string;
  zip_code: string | null;
  country: string;
};

export type LocationSearchResponse = {
  locations?: LocationSuggestion[];
};

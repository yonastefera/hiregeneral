export const US_STATE_ABBREVIATIONS: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

export const US_STATE_NAMES_BY_ABBR = Object.fromEntries(
  Object.entries(US_STATE_ABBREVIATIONS).map(([name, abbr]) => [abbr, name]),
) as Record<string, string>;

export function normalizeUsStateRegion(region: string | null): string | null {
  if (!region) return null;

  const trimmedRegion = region.trim();

  if (!trimmedRegion) return null;

  if (trimmedRegion.length === 2) {
    return trimmedRegion.toUpperCase();
  }

  const matchedStateName = Object.keys(US_STATE_ABBREVIATIONS).find(
    (stateName) => stateName.toLowerCase() === trimmedRegion.toLowerCase(),
  );

  return matchedStateName
    ? US_STATE_ABBREVIATIONS[matchedStateName]
    : trimmedRegion;
}

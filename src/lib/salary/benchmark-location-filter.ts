export type BenchmarkLocationConstraint =
  | { kind: "national" }
  | { kind: "candidates"; filter: string };

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function escapeFilterValue(value: string) {
  return value.replace(/[%_]/g, "\\$&").replace(/,/g, " ");
}

export function buildBenchmarkLocationConstraint(input: {
  location: string;
  city: string;
  stateAbbr: string;
  stateName: string;
}): BenchmarkLocationConstraint {
  const normalizedLocation = normalize(input.location);

  if (
    !normalizedLocation ||
    normalizedLocation === "remote" ||
    normalizedLocation === "united states"
  ) {
    return { kind: "national" };
  }

  const filters = new Set(["area_type.eq.N"]);
  const city = escapeFilterValue(input.city.trim());
  const stateAbbr = escapeFilterValue(input.stateAbbr.trim().toUpperCase());
  const stateName = escapeFilterValue(input.stateName.trim());

  if (stateAbbr) filters.add(`state_code.eq.${stateAbbr}`);
  if (city) filters.add(`area_name.ilike.%${city}%`);
  if (stateName) filters.add(`area_name.ilike.%${stateName}%`);

  return { kind: "candidates", filter: Array.from(filters).join(",") };
}

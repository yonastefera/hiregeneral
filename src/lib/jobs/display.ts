export function listingTitle(title: string) {
  const [primary] = title.split(",");
  const cleaned = primary
    .replace(
      /\s+-\s+(?:remote|hybrid|onsite|on-site|[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})$/i,
      "",
    )
    .trim();

  return cleaned.length >= 3 ? cleaned : title;
}

function isLocationPart(value: string) {
  const part = value.trim();

  if (!part) return false;

  return (
    /\b[A-Z]{2}\b/.test(part) ||
    /\b(remote|virtual|united states|usa)\b/i.test(part) ||
    /(?:corp|office|center|street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?)$/i.test(
      part,
    )
  );
}

function firstReadableLocation(parts: string[]) {
  const [first, second] = parts;

  if (!first) return "";

  if (second && /^[A-Z]{2}$/.test(second.trim())) {
    return `${first.trim()}, ${second.trim()}`;
  }

  return first.trim();
}

export function listingLocation(location: string) {
  const cleaned = location.replace(/\s+/g, " ").trim();

  if (cleaned.length <= 80) return cleaned;

  const parts = cleaned
    .split(/\s*,\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 4) return cleaned;

  const locationParts = parts.filter(isLocationPart);
  const count = Math.max(locationParts.length, parts.length);
  const first = firstReadableLocation(parts);

  if (!first) return cleaned;

  return `${first}, ${count - 1} locations`;
}

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

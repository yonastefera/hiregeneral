type ListingIdentity = {
  id: string;
  company_name: string;
  title: string;
  location: string;
};

function normalizeIdentityPart(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export function dedupeJobListings<T extends ListingIdentity>(rows: T[]) {
  const seenIds = new Set<string>();
  const seenListings = new Set<string>();

  return rows.filter((row) => {
    const listingKey = [row.company_name, row.title, row.location]
      .map(normalizeIdentityPart)
      .join("\u0000");

    if (seenIds.has(row.id) || seenListings.has(listingKey)) return false;

    seenIds.add(row.id);
    seenListings.add(listingKey);
    return true;
  });
}

export function diversifyJobListings<T extends ListingIdentity>(rows: T[]) {
  const uniqueRows = dedupeJobListings(rows);
  const companies = new Map<string, T[]>();

  for (const row of uniqueRows) {
    const companyKey = normalizeIdentityPart(row.company_name) || row.id;
    const companyRows = companies.get(companyKey) ?? [];
    companyRows.push(row);
    companies.set(companyKey, companyRows);
  }

  const diversified: T[] = [];
  let companyOffset = 0;
  let addedInRound = true;

  while (addedInRound) {
    addedInRound = false;

    for (const companyRows of companies.values()) {
      const row = companyRows[companyOffset];
      if (!row) continue;
      diversified.push(row);
      addedInRound = true;
    }

    companyOffset += 1;
  }

  return diversified;
}

export function limitJobListingsPerCompany<T extends ListingIdentity>(
  rows: T[],
  limit: number,
) {
  const companyCounts = new Map<string, number>();

  return diversifyJobListings(rows).filter((row) => {
    const companyKey = normalizeIdentityPart(row.company_name) || row.id;
    const count = companyCounts.get(companyKey) ?? 0;
    if (count >= limit) return false;

    companyCounts.set(companyKey, count + 1);
    return true;
  });
}

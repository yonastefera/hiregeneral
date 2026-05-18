export function getCompanyInitials(company: string) {
  return company
    .split(" ")
    .map((word) => word[0])
    .join("");
}

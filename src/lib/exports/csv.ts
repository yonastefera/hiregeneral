const SPREADSHEET_FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = SPREADSHEET_FORMULA_PREFIX.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function rowsToCsv(
  headers: readonly string[],
  rows: readonly (readonly (string | number | null | undefined)[])[],
) {
  return [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}

export type WorkHistoryEntry = {
  start_date?: unknown;
  end_date?: unknown;
  is_current?: unknown;
};

export type CareerGap = {
  from: string;
  to: string;
  months: number;
};

function date(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function analyzeRecordedWorkHistory(
  value: unknown,
  now = new Date(),
): { roleCount: number; gaps: CareerGap[]; longestGapMonths: number } {
  if (!Array.isArray(value)) {
    return { roleCount: 0, gaps: [], longestGapMonths: 0 };
  }

  const intervals = value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }
      const history = entry as WorkHistoryEntry;
      const start = date(history.start_date);
      const end = history.is_current === true ? now : date(history.end_date);
      if (!start || !end || end < start) return null;
      return { start, end };
    })
    .filter((entry): entry is { start: Date; end: Date } => Boolean(entry))
    .sort((left, right) => left.start.getTime() - right.start.getTime());

  const merged: { start: Date; end: Date }[] = [];
  for (const interval of intervals) {
    const previous = merged.at(-1);
    if (!previous || interval.start > previous.end) {
      merged.push({ ...interval });
    } else if (interval.end > previous.end) {
      previous.end = interval.end;
    }
  }

  const gaps: CareerGap[] = [];
  for (let index = 1; index < merged.length; index += 1) {
    const previous = merged[index - 1];
    const next = merged[index];
    const days =
      (next.start.getTime() - previous.end.getTime()) / (24 * 60 * 60 * 1000);
    if (days < 60) continue;
    gaps.push({
      from: previous.end.toISOString(),
      to: next.start.toISOString(),
      months: Math.max(2, Math.round(days / 30.4375)),
    });
  }

  return {
    roleCount: intervals.length,
    gaps,
    longestGapMonths: Math.max(0, ...gaps.map((gap) => gap.months)),
  };
}

/**
 * Shared Date Utilities
 * Ensures single source of truth for calendar day differences using the user's local date.
 *
 * Requirements:
 * - Card, dashboard, and countdown must show the same number.
 * - Computed using the user's local date (year, month, day), NOT UTC midnight.
 * - Consistent around midnight (e.g. 23:59:59 vs 00:00:01).
 */

export function computeDaysLeft(
  targetDateStr: string | Date | null | undefined,
  referenceDate?: Date
): number {
  if (!targetDateStr) return 0;

  let targetYear: number;
  let targetMonth: number;
  let targetDay: number;

  if (typeof targetDateStr === 'string') {
    // Strip ISO time/timezones if present (e.g., '2026-10-25' or '2026-10-25T00:00:00Z')
    const cleanStr = targetDateStr.split('T')[0].trim();
    const parts = cleanStr.split('-').map(Number);
    if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
      return 0;
    }
    targetYear = parts[0];
    targetMonth = parts[1] - 1; // 0-indexed month
    targetDay = parts[2];
  } else if (targetDateStr instanceof Date) {
    targetYear = targetDateStr.getFullYear();
    targetMonth = targetDateStr.getMonth();
    targetDay = targetDateStr.getDate();
  } else {
    return 0;
  }

  // Construct local date at 00:00:00 local time
  const targetLocal = new Date(targetYear, targetMonth, targetDay, 0, 0, 0, 0);

  // Reference date in user's local timezone (defaults to now)
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  const currentLocal = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0, 0);

  // Calculate calendar day difference
  const diffMs = targetLocal.getTime() - currentLocal.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

export function formatDaysLeftLabel(daysLeft: number): string {
  if (daysLeft === 0) return 'Exam today!';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
}

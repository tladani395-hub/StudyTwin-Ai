import test from 'node:test';
import assert from 'node:assert/strict';

// Test implementation of computeDaysLeft logic
function computeDaysLeft(targetDateStr, referenceDate) {
  if (!targetDateStr) return 0;

  let targetYear, targetMonth, targetDay;

  if (typeof targetDateStr === 'string') {
    const cleanStr = targetDateStr.split('T')[0].trim();
    const parts = cleanStr.split('-').map(Number);
    if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
      return 0;
    }
    targetYear = parts[0];
    targetMonth = parts[1] - 1;
    targetDay = parts[2];
  } else if (targetDateStr instanceof Date) {
    targetYear = targetDateStr.getFullYear();
    targetMonth = targetDateStr.getMonth();
    targetDay = targetDateStr.getDate();
  } else {
    return 0;
  }

  const targetLocal = new Date(targetYear, targetMonth, targetDay, 0, 0, 0, 0);
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  const currentLocal = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0, 0);

  const diffMs = targetLocal.getTime() - currentLocal.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

test('Date Bug: Midnight stability and local date consistency', async (t) => {
  const targetExam = '2026-10-25';

  await t.test('shows identical days left at 00:00:01 and 23:59:59 on the same local day', () => {
    // 1 second after midnight on Oct 10
    const justAfterMidnight = new Date(2026, 9, 10, 0, 0, 1);
    // 1 second before midnight on Oct 10
    const justBeforeMidnight = new Date(2026, 9, 10, 23, 59, 59);

    const daysEarly = computeDaysLeft(targetExam, justAfterMidnight);
    const daysLate = computeDaysLeft(targetExam, justBeforeMidnight);

    console.log(`[Test] 2026-10-10 00:00:01 -> Days Left: ${daysEarly}`);
    console.log(`[Test] 2026-10-10 23:59:59 -> Days Left: ${daysLate}`);

    assert.equal(daysEarly, 15, 'Should be exactly 15 days at start of day');
    assert.equal(daysLate, 15, 'Should be exactly 15 days at end of day before midnight');
    assert.equal(daysEarly, daysLate, 'Card, dashboard and countdown must show the same number');
  });

  await t.test('properly decrements by 1 immediately after midnight crossing', () => {
    const beforeMidnight = new Date(2026, 9, 10, 23, 59, 59);
    const afterMidnight = new Date(2026, 9, 11, 0, 0, 1);

    const daysBefore = computeDaysLeft(targetExam, beforeMidnight);
    const daysAfter = computeDaysLeft(targetExam, afterMidnight);

    console.log(`[Test] Before midnight (Oct 10 23:59:59): ${daysBefore} days`);
    console.log(`[Test] After midnight (Oct 11 00:00:01): ${daysAfter} days`);

    assert.equal(daysBefore, 15);
    assert.equal(daysAfter, 14);
    assert.equal(daysBefore - daysAfter, 1, 'Days left decrements by exactly 1 across midnight');
  });

  await t.test('handles exam day (0 days) and past dates properly', () => {
    const examDay = new Date(2026, 9, 25, 14, 30, 0);
    const pastExam = new Date(2026, 9, 28, 9, 0, 0);

    assert.equal(computeDaysLeft(targetExam, examDay), 0, 'On exam day, days left should be 0');
    assert.equal(computeDaysLeft(targetExam, pastExam), 0, 'After exam day, days left should clamp to 0');
  });
});

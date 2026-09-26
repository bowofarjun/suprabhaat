/**
 * Date and Time utilities for formatting and timezones (IST).
 */

/**
 * Returns a filesystem-safe date-time stamp in IST timezone.
 * Format: YYYY-MM-DD_HH-mm-ss_IST
 * e.g. 2026-09-26_18-28-15_IST
 */
export function getFormattedDateTimeStamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  const lookup = {};
  for (const p of parts) {
    lookup[p.type] = p.value;
  }

  return `${lookup.year}-${lookup.month}-${lookup.day}_${lookup.hour}-${lookup.minute}-${lookup.second}_IST`;
}

/**
 * Returns a human-friendly display date and time in IST.
 * e.g. 26 Sep 2026, 06:28 PM IST
 */
export function formatDisplayDateTime(date = new Date()) {
  const formatted = new Date(date).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  return `${formatted} IST`;
}

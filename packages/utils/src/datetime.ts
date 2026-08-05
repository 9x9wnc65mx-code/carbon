import {
  type CalendarDate,
  now,
  parseAbsolute,
  toCalendarDate,
  today
} from "@internationalized/date";

/**
 * ISO 8601 week number (1-53). Week 1 is the week containing the year's first
 * Thursday. Pure UTC arithmetic on the date parts — no timezone dependency.
 */
function weekNumber(date: CalendarDate): number {
  const d = new Date(Date.UTC(date.year, date.month - 1, date.day));
  const dayNum = d.getUTCDay() || 7; // Sunday → 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // shift to the week's Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * The one sanctioned way to derive dates and times in server code.
 *
 * Every derivation method takes a mandatory IANA timezone — resolved from
 * `company.timezone` (ledger-scoped: accounting periods, posting dates,
 * sequence date tokens) or `location.timezone` (operational: scheduling,
 * shifts, MES) — so "which calendar day is it?" is never answered implicitly
 * by the process timezone. Client components displaying dates in the user's
 * browser timezone keep using `@internationalized/date` directly.
 */
export const datetime = {
  /** UTC instant string for timestamp columns (createdAt/updatedAt). The only timezone-free method. */
  timestamp: () => new Date().toISOString(),

  /** Current moment as a ZonedDateTime in the given business timezone. */
  now: (tz: string) => now(tz),

  /** Today as a CalendarDate in the given business timezone. */
  today: (tz: string) => today(tz),

  /** The business day a stored UTC instant falls on in the given timezone. */
  businessDay: (instant: string, tz: string) =>
    toCalendarDate(parseAbsolute(instant, tz)),

  weekNumber
};

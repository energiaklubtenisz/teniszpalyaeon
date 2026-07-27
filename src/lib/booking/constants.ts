export const BOOKING_TIMEZONE = "Europe/Budapest";

/** Opening hour inclusive (local). */
export const OPEN_HOUR = 8;

/**
 * Standard closing hour for bookings that start before the late-evening window.
 * Bookings must end by this hour unless the start is at/after LATE_EVENING_START_HOUR.
 */
export const STANDARD_CLOSE_HOUR = 20;

/**
 * Absolute closing hour (local). Bookings must end by this hour.
 * Ends after STANDARD_CLOSE_HOUR are only allowed for late-evening starts.
 */
export const CLOSE_HOUR = 21;

/** Starts at or after this hour may end up to CLOSE_HOUR (20:30 / 21:00). */
export const LATE_EVENING_START_HOUR = 19;

/** Minimum booking length in minutes. */
export const MIN_DURATION_MINUTES = 60;

/** Slot grid step in minutes (:00 / :30). */
export const SLOT_STEP_MINUTES = 30;

/** How far ahead users may book, in calendar days from today. */
export const MAX_BOOKING_DAYS_AHEAD = 30;

/** One-time court hire rate (HUF / hour). */
export const HOURLY_RATE_HUF = 5000;

export const COURT_LAYOUT: readonly (readonly [number, number])[] = [
  [1, 2],
  [3, 4],
  [5, 6],
  [7, 8],
] as const;

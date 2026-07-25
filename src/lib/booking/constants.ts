export const BOOKING_TIMEZONE = "Europe/Budapest";

/** Opening hour inclusive (local). */
export const OPEN_HOUR = 8;

/** Closing hour exclusive for starts; bookings must end by this hour (local). */
export const CLOSE_HOUR = 20;

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

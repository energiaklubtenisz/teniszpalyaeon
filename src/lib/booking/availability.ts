import {
  CLOSE_HOUR,
  MIN_DURATION_MINUTES,
  OPEN_HOUR,
} from "@/lib/booking/constants";
import {
  budapestLocalToUtc,
  getBoundaryLabels,
  isSlotInPast,
  labelToMinutes,
  maxEndMinutesForStart,
  minutesToLabel,
  parseBookingTimestamp,
  rangesOverlap,
  type TimeLabel,
} from "@/lib/booking/time";

export type BusyInterval = {
  startsAt: string;
  endsAt: string;
};

const CLOSE_MINUTES = CLOSE_HOUR * 60;
const LAST_START_MINUTES = CLOSE_MINUTES - MIN_DURATION_MINUTES;

export function rangeHasBusy(
  dateKey: string,
  start: TimeLabel,
  end: TimeLabel,
  busy: BusyInterval[],
): boolean {
  const rangeStart = budapestLocalToUtc(dateKey, start);
  const rangeEnd = budapestLocalToUtc(dateKey, end);
  return busy.some((interval) =>
    rangesOverlap(
      rangeStart,
      rangeEnd,
      parseBookingTimestamp(interval.startsAt),
      parseBookingTimestamp(interval.endsAt),
    ),
  );
}

/** True if a minimum-length (1 hour) booking can start at this boundary. */
export function canStartOneHourBooking(
  dateKey: string,
  label: TimeLabel,
  busy: BusyInterval[],
  now?: Date,
): boolean {
  const minutes = labelToMinutes(label);
  if (minutes < OPEN_HOUR * 60) return false;
  if (minutes > LAST_START_MINUTES) return false;
  if (isSlotInPast(dateKey, label, now)) return false;

  const minEndMinutes = minutes + MIN_DURATION_MINUTES;
  if (minEndMinutes > maxEndMinutesForStart(minutes)) return false;

  const end = minutesToLabel(minEndMinutes);
  return !rangeHasBusy(dateKey, label, end, busy);
}

/**
 * A day is fully booked when no contiguous 1-hour window remains.
 * Isolated half-hour gaps between bookings do not count as available.
 */
export function isDayFullyBooked(
  dateKey: string,
  busy: BusyInterval[],
  now?: Date,
): boolean {
  const starts = getBoundaryLabels().filter(
    (label) => labelToMinutes(label) <= LAST_START_MINUTES,
  );

  return !starts.some((label) =>
    canStartOneHourBooking(dateKey, label, busy, now),
  );
}

/**
 * Day is fully booked only when every court has no remaining 1-hour window.
 * Half-hour gaps on a court still leave that court fully booked for the day.
 */
export function isDayFullyBookedAcrossCourts(
  dateKey: string,
  courtIds: string[],
  busyByCourtId: Record<string, BusyInterval[]>,
  now?: Date,
): boolean {
  if (courtIds.length === 0) return true;

  return courtIds.every((courtId) =>
    isDayFullyBooked(dateKey, busyByCourtId[courtId] ?? [], now),
  );
}

export function groupBusyByCourtId(
  rows: Array<{ court_id: string; starts_at: string; ends_at: string }>,
): Record<string, BusyInterval[]> {
  const result: Record<string, BusyInterval[]> = {};
  for (const row of rows) {
    const list = result[row.court_id] ?? [];
    list.push({ startsAt: row.starts_at, endsAt: row.ends_at });
    result[row.court_id] = list;
  }
  return result;
}

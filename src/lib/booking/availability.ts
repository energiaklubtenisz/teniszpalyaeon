import {
  CLOSE_HOUR,
  MIN_DURATION_MINUTES,
  OPEN_HOUR,
} from "@/lib/booking/constants";
import {
  budapestLocalToUtc,
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
  isCoachBooking?: boolean;
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

export function groupBusyByCourtId(
  rows: Array<{ court_id: string; starts_at: string; ends_at: string; is_coach_booking?: boolean }>,
): Record<string, BusyInterval[]> {
  const result: Record<string, BusyInterval[]> = {};
  for (const row of rows) {
    const list = result[row.court_id] ?? [];
    list.push({
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      isCoachBooking: Boolean(row.is_coach_booking),
    });
    result[row.court_id] = list;
  }
  return result;
}

/** True if at least one court can host a 1-hour booking starting here. */
export function canStartOneHourBookingOnAnyCourt(
  dateKey: string,
  label: TimeLabel,
  courtIds: string[],
  busyByCourtId: Record<string, BusyInterval[]>,
  now?: Date,
): boolean {
  if (courtIds.length === 0) return false;
  return courtIds.some((courtId) =>
    canStartOneHourBooking(
      dateKey,
      label,
      busyByCourtId[courtId] ?? [],
      now,
    ),
  );
}

/** True if at least one court is free for the whole range. */
export function rangeFreeOnAnyCourt(
  dateKey: string,
  start: TimeLabel,
  end: TimeLabel,
  courtIds: string[],
  busyByCourtId: Record<string, BusyInterval[]>,
): boolean {
  if (courtIds.length === 0) return false;
  return courtIds.some(
    (courtId) => !rangeHasBusy(dateKey, start, end, busyByCourtId[courtId] ?? []),
  );
}

/** True when every court is busy for this half-hour segment. */
export function segmentBusyOnAllCourts(
  dateKey: string,
  start: TimeLabel,
  end: TimeLabel,
  courtIds: string[],
  busyByCourtId: Record<string, BusyInterval[]>,
): boolean {
  if (courtIds.length === 0) return true;
  return courtIds.every((courtId) =>
    rangeHasBusy(dateKey, start, end, busyByCourtId[courtId] ?? []),
  );
}

import { TZDate } from "@date-fns/tz";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isBefore,
  startOfDay,
} from "date-fns";

import {
  BOOKING_TIMEZONE,
  CLOSE_HOUR,
  HOURLY_RATE_HUF,
  LATE_EVENING_START_HOUR,
  MAX_BOOKING_DAYS_AHEAD,
  MIN_DURATION_MINUTES,
  OPEN_HOUR,
  SLOT_STEP_MINUTES,
  STANDARD_CLOSE_HOUR,
} from "@/lib/booking/constants";

export type TimeLabel = `${string}:${string}`;

export type BookingWindow = {
  startsAt: Date;
  endsAt: Date;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function minutesToLabel(totalMinutes: number): TimeLabel {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${pad2(hours)}:${pad2(minutes)}` as TimeLabel;
}

export function labelToMinutes(label: TimeLabel): number {
  const [hours, minutes] = label.split(":").map(Number);
  return hours * 60 + minutes;
}

export function getBoundaryLabels(): TimeLabel[] {
  const labels: TimeLabel[] = [];
  for (
    let minutes = OPEN_HOUR * 60;
    minutes <= CLOSE_HOUR * 60;
    minutes += SLOT_STEP_MINUTES
  ) {
    labels.push(minutesToLabel(minutes));
  }
  return labels;
}

export function nowInBudapest(): TZDate {
  return TZDate.tz(BOOKING_TIMEZONE);
}

export function parseDateKey(dateKey: string): {
  year: number;
  monthIndex: number;
  day: number;
} {
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, monthIndex: month - 1, day };
}

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function budapestDateKey(date: Date = nowInBudapest()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function budapestLocalToUtc(
  dateKey: string,
  timeLabel: TimeLabel,
): Date {
  const { year, monthIndex, day } = parseDateKey(dateKey);
  const totalMinutes = labelToMinutes(timeLabel);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const zoned = new TZDate(
    year,
    monthIndex,
    day,
    hours,
    minutes,
    0,
    0,
    BOOKING_TIMEZONE,
  );
  return new Date(zoned.getTime());
}

export function formatBudapestTime(date: Date): TimeLabel {
  const parts = new Intl.DateTimeFormat("hu-HU", {
    timeZone: BOOKING_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}` as TimeLabel;
}

export function isHalfHourAligned(date: Date): boolean {
  const label = formatBudapestTime(date);
  const minutes = labelToMinutes(label) % 60;
  return minutes === 0 || minutes === 30;
}

export function getBookableDateKeys(from: Date = nowInBudapest()): string[] {
  const todayKey = budapestDateKey(from);
  const { year, monthIndex, day } = parseDateKey(todayKey);
  const start = new TZDate(year, monthIndex, day, 12, 0, 0, 0, BOOKING_TIMEZONE);

  return Array.from({ length: MAX_BOOKING_DAYS_AHEAD + 1 }, (_, index) => {
    const next = addDays(start, index);
    return budapestDateKey(next);
  });
}

export function isDateKeyBookable(
  dateKey: string,
  from: Date = nowInBudapest(),
): boolean {
  return getBookableDateKeys(from).includes(dateKey);
}

export function durationMinutes(start: TimeLabel, end: TimeLabel): number {
  return labelToMinutes(end) - labelToMinutes(start);
}

/** Latest allowed end time (minutes from midnight) for a given start. */
export function maxEndMinutesForStart(startMinutes: number): number {
  if (startMinutes >= LATE_EVENING_START_HOUR * 60) {
    return CLOSE_HOUR * 60;
  }
  return STANDARD_CLOSE_HOUR * 60;
}

export function isValidBookingRange(start: TimeLabel, end: TimeLabel): boolean {
  const duration = durationMinutes(start, end);
  if (duration < MIN_DURATION_MINUTES) return false;
  if (labelToMinutes(start) < OPEN_HOUR * 60) return false;
  if (labelToMinutes(end) > maxEndMinutesForStart(labelToMinutes(start))) {
    return false;
  }
  if (labelToMinutes(start) % SLOT_STEP_MINUTES !== 0) return false;
  if (labelToMinutes(end) % SLOT_STEP_MINUTES !== 0) return false;
  return true;
}

export function calculateOneTimePriceHuf(
  start: TimeLabel,
  end: TimeLabel,
): number {
  return Math.round((durationMinutes(start, end) / 60) * HOURLY_RATE_HUF);
}

export function formatPriceHuf(amount: number): string {
  return `${amount.toLocaleString("hu-HU")} Ft`;
}

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function isSlotInPast(
  dateKey: string,
  startLabel: TimeLabel,
  now: Date = nowInBudapest(),
): boolean {
  return isBefore(budapestLocalToUtc(dateKey, startLabel), now);
}

export function monthMatrix(anchor: Date): (Date | null)[][] {
  const first = startOfDay(anchor);
  const year = first.getFullYear();
  const month = first.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function buildWindow(
  dateKey: string,
  start: TimeLabel,
  end: TimeLabel,
): BookingWindow {
  return {
    startsAt: budapestLocalToUtc(dateKey, start),
    endsAt: budapestLocalToUtc(dateKey, end),
  };
}

export function shiftMonth(anchor: Date, delta: number): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
}

export function daysFromToday(
  dateKey: string,
  todayKey = budapestDateKey(),
): number {
  const today = parseDateKey(todayKey);
  const target = parseDateKey(dateKey);
  return differenceInCalendarDays(
    new Date(target.year, target.monthIndex, target.day),
    new Date(today.year, today.monthIndex, today.day),
  );
}

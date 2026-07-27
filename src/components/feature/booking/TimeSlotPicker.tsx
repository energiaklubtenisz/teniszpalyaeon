"use client";

import type { BusyInterval } from "@/actions/booking";
import { booking } from "@/content/booking";
import {
  CLOSE_HOUR,
  MIN_DURATION_MINUTES,
} from "@/lib/booking/constants";
import {
  budapestLocalToUtc,
  durationMinutes,
  getBoundaryLabels,
  isSlotInPast,
  isValidBookingRange,
  labelToMinutes,
  maxEndMinutesForStart,
  minutesToLabel,
  rangesOverlap,
  type TimeLabel,
} from "@/lib/booking/time";
import { cn } from "@/lib/utils";

import styles from "./booking.module.css";

type TimeSlotPickerProps = {
  dateKey: string;
  busy: BusyInterval[];
  startLabel: TimeLabel | null;
  endLabel: TimeLabel | null;
  onChange: (start: TimeLabel | null, end: TimeLabel | null) => void;
};

const CLOSE_MINUTES = CLOSE_HOUR * 60;
const LAST_START_MINUTES = CLOSE_MINUTES - MIN_DURATION_MINUTES;

function rangeHasBusy(
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
      new Date(interval.startsAt),
      new Date(interval.endsAt),
    ),
  );
}

function canStartAt(
  dateKey: string,
  label: TimeLabel,
  busy: BusyInterval[],
): boolean {
  const minutes = labelToMinutes(label);
  if (minutes > LAST_START_MINUTES) return false;
  if (isSlotInPast(dateKey, label)) return false;

  const minEndMinutes = minutes + MIN_DURATION_MINUTES;
  if (minEndMinutes > maxEndMinutesForStart(minutes)) return false;

  const end = minutesToLabel(minEndMinutes);
  return !rangeHasBusy(dateKey, label, end, busy);
}

function canEndAt(
  dateKey: string,
  start: TimeLabel,
  end: TimeLabel,
  busy: BusyInterval[],
): boolean {
  const startMinutes = labelToMinutes(start);
  const endMinutes = labelToMinutes(end);
  if (endMinutes - startMinutes < MIN_DURATION_MINUTES) return false;
  if (endMinutes > maxEndMinutesForStart(startMinutes)) return false;
  return !rangeHasBusy(dateKey, start, end, busy);
}

export function TimeSlotPicker({
  dateKey,
  busy,
  startLabel,
  endLabel,
  onChange,
}: TimeSlotPickerProps) {
  const boundaries = getBoundaryLabels();

  const selectAsStart = (label: TimeLabel) => {
    const minutes = labelToMinutes(label);
    if (!canStartAt(dateKey, label, busy)) return;

    if (minutes === LAST_START_MINUTES) {
      onChange(label, minutesToLabel(CLOSE_MINUTES));
      return;
    }
    onChange(label, null);
  };

  const handleSelect = (label: TimeLabel) => {
    const minutes = labelToMinutes(label);
    const isClose = minutes === CLOSE_MINUTES;

    if (startLabel && label === startLabel) {
      onChange(null, null);
      return;
    }

    if (endLabel && label === endLabel) {
      onChange(startLabel, null);
      return;
    }

    if (!startLabel || (startLabel && endLabel)) {
      if (isClose) return;
      selectAsStart(label);
      return;
    }

    const startMinutes = labelToMinutes(startLabel);

    if (minutes < startMinutes) {
      if (isClose) return;
      selectAsStart(label);
      return;
    }

    if (!canEndAt(dateKey, startLabel, label, busy)) return;
    onChange(startLabel, label);
  };

  const valid =
    startLabel && endLabel ? isValidBookingRange(startLabel, endLabel) : false;

  return (
    <div className={styles.timeBlock}>
      <div className={styles.legend}>
        <span>
          <i className={cn(styles.swatch, styles.swatchFree)} />{" "}
          {booking.steps.time.available}
        </span>
        <span>
          <i className={cn(styles.swatch, styles.swatchPast)} />{" "}
          {booking.steps.time.past}
        </span>
      </div>

      <p className={styles.timeHint}>
        {!startLabel
          ? booking.steps.time.hintStart
          : !endLabel
            ? booking.steps.time.hintEnd
            : `${booking.steps.time.selected}: ${startLabel}–${endLabel} (${durationMinutes(startLabel, endLabel) / 60} óra)`}
      </p>

      <div className={styles.timeGrid} role="group" aria-label={booking.steps.time.title}>
        {boundaries.map((label) => {
          const minutes = labelToMinutes(label);
          const isClose = minutes === CLOSE_MINUTES;
          const past = !isClose && isSlotInPast(dateKey, label);
          const selectingEnd = Boolean(startLabel && !endLabel);
          const startMinutes = startLabel ? labelToMinutes(startLabel) : null;

          let disabled = past;

          if (selectingEnd && startMinutes !== null) {
            if (label === startLabel) {
              disabled = false;
            } else if (minutes < startMinutes) {
              disabled = !canStartAt(dateKey, label, busy);
            } else {
              disabled = !canEndAt(dateKey, startLabel!, label, busy);
            }
          } else if (!startLabel || (startLabel && endLabel)) {
            disabled = isClose || !canStartAt(dateKey, label, busy);
          }

          const inSelection =
            startLabel &&
            endLabel &&
            minutes >= labelToMinutes(startLabel) &&
            minutes < labelToMinutes(endLabel);
          const isStart = startLabel === label;
          const isEnd = endLabel === label;
          const next = boundaries.find(
            (item) => labelToMinutes(item) === minutes + 30,
          );
          const segmentBusy =
            !isClose && next && rangeHasBusy(dateKey, label, next, busy);

          return (
            <button
              key={label}
              type="button"
              disabled={disabled}
              className={cn(
                styles.timeCell,
                disabled && styles.timePast,
                segmentBusy && !selectingEnd && !disabled && styles.timeBooked,
                inSelection && styles.timeSelected,
                isStart && styles.timeStartOnly,
                isEnd && styles.timeSelected,
              )}
              onClick={() => handleSelect(label)}
            >
              {label}
            </button>
          );
        })}
      </div>

      {startLabel && endLabel && !valid ? (
        <p className={styles.inlineError}>{booking.errors.invalidRange}</p>
      ) : null}
    </div>
  );
}

"use client";

import type { BusyInterval } from "@/actions/booking";
import { booking } from "@/content/booking";
import { MIN_DURATION_MINUTES } from "@/lib/booking/constants";
import {
  budapestLocalToUtc,
  durationMinutes,
  getBoundaryLabels,
  isSlotInPast,
  isValidBookingRange,
  labelToMinutes,
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

export function TimeSlotPicker({
  dateKey,
  busy,
  startLabel,
  endLabel,
  onChange,
}: TimeSlotPickerProps) {
  const boundaries = getBoundaryLabels();

  const handleSelect = (label: TimeLabel) => {
    if (!startLabel || (startLabel && endLabel)) {
      if (labelToMinutes(label) >= 20 * 60) return;
      if (isSlotInPast(dateKey, label)) return;
      onChange(label, null);
      return;
    }

    const startMinutes = labelToMinutes(startLabel);
    const endMinutes = labelToMinutes(label);

    if (endMinutes <= startMinutes) {
      if (isSlotInPast(dateKey, label) || labelToMinutes(label) >= 20 * 60) return;
      onChange(label, null);
      return;
    }

    if (endMinutes - startMinutes < MIN_DURATION_MINUTES) return;
    if (rangeHasBusy(dateKey, startLabel, label, busy)) return;
    onChange(startLabel, label);
  };

  const valid =
    startLabel && endLabel ? isValidBookingRange(startLabel, endLabel) : false;

  return (
    <div className={styles.timeBlock}>
      <div className={styles.legend}>
        <span>
          <i className={cn(styles.swatch, styles.swatchFree)} /> {booking.steps.time.available}
        </span>
        <span>
          <i className={cn(styles.swatch, styles.swatchBooked)} /> {booking.steps.time.booked}
        </span>
        <span>
          <i className={cn(styles.swatch, styles.swatchPast)} /> {booking.steps.time.past}
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
          const isClose = minutes === 20 * 60;
          const past = !isClose && isSlotInPast(dateKey, label);
          const selectingEnd = Boolean(startLabel && !endLabel);

          let disabled = past;
          if (!selectingEnd && isClose) disabled = true;
          if (selectingEnd && startLabel) {
            const startMinutes = labelToMinutes(startLabel);
            const tooShort = minutes - startMinutes < MIN_DURATION_MINUTES;
            const beforeOrEqual = minutes <= startMinutes;
            const overlaps =
              minutes > startMinutes &&
              rangeHasBusy(dateKey, startLabel, label, busy);
            disabled = beforeOrEqual || tooShort || overlaps;
          } else if (!startLabel) {
            disabled = past || isClose || minutes + MIN_DURATION_MINUTES > 20 * 60;
          }

          const inSelection =
            startLabel &&
            endLabel &&
            minutes >= labelToMinutes(startLabel) &&
            minutes < labelToMinutes(endLabel);
          const isStart = startLabel === label && !endLabel;
          const isEnd = endLabel === label;
          const next = boundaries.find((item) => labelToMinutes(item) === minutes + 30);
          const segmentBusy =
            !isClose && next && rangeHasBusy(dateKey, label, next, busy);

          return (
            <button
              key={label}
              type="button"
              disabled={disabled}
              className={cn(
                styles.timeCell,
                past && styles.timePast,
                segmentBusy && !selectingEnd && styles.timeBooked,
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

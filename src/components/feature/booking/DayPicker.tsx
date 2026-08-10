"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { booking } from "@/content/booking";
import {
  budapestDateKey,
  isDateKeyBookable,
  monthMatrix,
  shiftMonth,
  toDateKey,
} from "@/lib/booking/time";
import { cn } from "@/lib/utils";

import styles from "./booking.module.css";

type DayPickerProps = {
  selectedDateKey: string | null;
  onSelect: (dateKey: string) => void;
};

export function DayPicker({ selectedDateKey, onSelect }: DayPickerProps) {
  const todayKey = budapestDateKey();
  const [anchor, setAnchor] = useState(() => {
    const key = selectedDateKey ?? todayKey;
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1);
  });

  const weeks = useMemo(() => monthMatrix(anchor), [anchor]);
  const label = format(anchor, "yyyy. MMMM", { locale: hu });

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Előző hónap"
          onClick={() => setAnchor((current) => shiftMonth(current, -1))}
        >
          <ChevronLeft size={18} />
        </button>
        <p className={styles.calendarMonth}>{label}</p>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Következő hónap"
          onClick={() => setAnchor((current) => shiftMonth(current, 1))}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className={styles.weekdayRow} aria-hidden>
        {booking.steps.day.weekdays.map((day) => (
          <span key={day} className={styles.weekday}>
            {day}
          </span>
        ))}
      </div>

      <div className={styles.dayGrid}>
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            if (!day) {
              return (
                <span
                  key={`empty-${weekIndex}-${dayIndex}`}
                  className={styles.dayEmpty}
                />
              );
            }
            const dateKey = toDateKey(day);
            const bookable = isDateKeyBookable(dateKey);
            const selected = dateKey === selectedDateKey;
            const isToday = dateKey === todayKey;

            return (
              <button
                key={dateKey}
                type="button"
                disabled={!bookable}
                className={cn(
                  styles.dayCell,
                  isToday && styles.dayToday,
                  selected && styles.daySelected,
                  !bookable && styles.dayDisabled,
                )}
                aria-pressed={selected}
                onClick={() => onSelect(dateKey)}
              >
                {day.getDate()}
              </button>
            );
          }),
        )}
      </div>

      <div className={styles.legend}>
        <span>
          <i className={cn(styles.swatch, styles.swatchFree)} />{" "}
          {booking.steps.day.available}
        </span>
      </div>
    </div>
  );
}

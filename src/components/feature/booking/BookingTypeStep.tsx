"use client";

import { booking } from "@/content/booking";
import {
  calculateOneTimePriceHuf,
  formatPriceHuf,
  type TimeLabel,
} from "@/lib/booking/time";
import { cn } from "@/lib/utils";

import styles from "./booking.module.css";

export type BookingTypeChoice = "season_pass" | "one_time";

type BookingTypeStepProps = {
  value: BookingTypeChoice | null;
  startLabel: TimeLabel;
  endLabel: TimeLabel;
  onChange: (value: BookingTypeChoice) => void;
};

export function BookingTypeStep({
  value,
  startLabel,
  endLabel,
  onChange,
}: BookingTypeStepProps) {
  const oneTimePrice = calculateOneTimePriceHuf(startLabel, endLabel);

  return (
    <div className={styles.typeList} role="radiogroup" aria-label={booking.steps.type.title}>
      <button
        type="button"
        role="radio"
        aria-checked={value === "season_pass"}
        className={cn(
          styles.typeOption,
          value === "season_pass" && styles.typeOptionSelected,
        )}
        onClick={() => onChange("season_pass")}
      >
        <span className={styles.typeTitle}>{booking.steps.type.seasonPass.title}</span>
        <span className={styles.typeBody}>{booking.steps.type.seasonPass.body}</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={value === "one_time"}
        className={cn(
          styles.typeOption,
          value === "one_time" && styles.typeOptionSelected,
        )}
        onClick={() => onChange("one_time")}
      >
        <span className={styles.typeTitle}>{booking.steps.type.oneTime.title}</span>
        <span className={styles.typeBody}>{booking.steps.type.oneTime.body}</span>
        <span className={styles.typePrice}>Összesen: {formatPriceHuf(oneTimePrice)}</span>
      </button>
    </div>
  );
}

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
export type PlayerCountChoice = 2 | 4;

type BookingTypeStepProps = {
  value: BookingTypeChoice | null;
  playerCount: PlayerCountChoice | null;
  guestPlayerNames: string[];
  bookerName: string | null;
  startLabel: TimeLabel;
  endLabel: TimeLabel;
  onChangeType: (value: BookingTypeChoice) => void;
  onChangePlayers: (value: PlayerCountChoice) => void;
  onChangeGuestName: (index: number, value: string) => void;
};

export function BookingTypeStep({
  value,
  playerCount,
  guestPlayerNames,
  bookerName,
  startLabel,
  endLabel,
  onChangeType,
  onChangePlayers,
  onChangeGuestName,
}: BookingTypeStepProps) {
  const oneTimePrice = calculateOneTimePriceHuf(startLabel, endLabel);
  const guestSlots = playerCount ? playerCount - 1 : 0;

  return (
    <div className={styles.typeBlock}>
      <div
        className={styles.typeList}
        role="radiogroup"
        aria-label={booking.steps.type.title}
      >
        <button
          type="button"
          role="radio"
          aria-checked={value === "season_pass"}
          className={cn(
            styles.typeOption,
            value === "season_pass" && styles.typeOptionSelected,
          )}
          onClick={() => onChangeType("season_pass")}
        >
          <span className={styles.typeTitle}>
            {booking.steps.type.seasonPass.title}
          </span>
          <span className={styles.typeBody}>
            {booking.steps.type.seasonPass.body}
          </span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={value === "one_time"}
          className={cn(
            styles.typeOption,
            value === "one_time" && styles.typeOptionSelected,
          )}
          onClick={() => onChangeType("one_time")}
        >
          <span className={styles.typeTitle}>
            {booking.steps.type.oneTime.title}
          </span>
          <span className={styles.typeBody}>
            {booking.steps.type.oneTime.body}
          </span>
          <span className={styles.typePrice}>
            Összesen: {formatPriceHuf(oneTimePrice)}
          </span>
        </button>
      </div>

      <div className={styles.playersBlock}>
        <p className={styles.playersTitle}>{booking.steps.type.players.title}</p>
        <p className={styles.playersHint}>{booking.steps.type.players.hint}</p>
        <div
          className={styles.playersList}
          role="radiogroup"
          aria-label={booking.steps.type.players.title}
        >
          <button
            type="button"
            role="radio"
            aria-checked={playerCount === 2}
            className={cn(
              styles.playerOption,
              playerCount === 2 && styles.playerOptionSelected,
            )}
            onClick={() => onChangePlayers(2)}
          >
            {booking.steps.type.players.two}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={playerCount === 4}
            className={cn(
              styles.playerOption,
              playerCount === 4 && styles.playerOptionSelected,
            )}
            onClick={() => onChangePlayers(4)}
          >
            {booking.steps.type.players.four}
          </button>
        </div>
      </div>

      {playerCount ? (
        <div className={styles.namesBlock}>
          <p className={styles.playersTitle}>{booking.steps.type.names.title}</p>
          <p className={styles.playersHint}>{booking.steps.type.names.hint}</p>

          <label className={styles.nameField}>
            <span className={styles.nameLabel}>
              {booking.steps.type.names.bookerLabel}
            </span>
            <input
              className={cn(styles.nameInput, styles.nameInputReadonly)}
              type="text"
              value={bookerName ?? booking.steps.type.names.bookerFallback}
              disabled
              tabIndex={-1}
            />
          </label>

          {Array.from({ length: guestSlots }, (_, index) => (
            <label key={index} className={styles.nameField}>
              <span className={styles.nameLabel}>
                {booking.steps.type.names.guestLabel.replace(
                  "{n}",
                  String(index + 2),
                )}
              </span>
              <input
                className={styles.nameInput}
                type="text"
                autoComplete="name"
                placeholder={booking.steps.type.names.guestPlaceholder}
                value={guestPlayerNames[index] ?? ""}
                onChange={(event) =>
                  onChangeGuestName(index, event.target.value)
                }
              />
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

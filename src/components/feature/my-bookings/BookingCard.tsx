"use client";

import { CalendarDays, ChevronDown, Clock } from "lucide-react";
import { useId, useState } from "react";

import type { UserBooking } from "@/actions/booking";
import { myBookings } from "@/content/my-bookings";
import {
  formatBudapestDateLabel,
  formatBudapestTime,
  formatPriceHuf,
  parseBookingTimestamp,
} from "@/lib/booking/time";
import { cn } from "@/lib/utils";

import styles from "./my-bookings.module.css";

type BookingCardProps = {
  booking: UserBooking;
  bookerName: string | null;
  muted?: boolean;
};

export function BookingCard({
  booking,
  bookerName,
  muted = false,
}: BookingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();

  const startsAt = parseBookingTimestamp(booking.startsAt);
  const endsAt = parseBookingTimestamp(booking.endsAt);
  const isCoach = Boolean(booking.isCoachBooking);
  const isSeasonPass = !isCoach && booking.bookingType === "season_pass";
  const typeLabel = isCoach
    ? "Edzői foglalás"
    : isSeasonPass
    ? myBookings.card.type.seasonPass
    : myBookings.card.type.oneTime;
  const typeBadge = isCoach
    ? "Edzés"
    : isSeasonPass
    ? myBookings.card.typeBadge.seasonPass
    : myBookings.card.typeBadge.oneTime;
  const courtBadge =
    booking.courtNumbers && booking.courtNumbers.length > 1
      ? booking.courtNumbers.join(", ")
      : String(booking.court.number);
  const courtLabel =
    booking.courtNumbers && booking.courtNumbers.length > 1
      ? booking.court.name
      : myBookings.card.courtLabel.replace("{n}", String(booking.court.number));
  const playersLabel = myBookings.card.playersCount.replace(
    "{n}",
    String(booking.playerCount),
  );
  const names = [
    bookerName?.trim() || myBookings.card.bookerFallback,
    ...booking.guestPlayerNames.map((name) => name.trim()).filter(Boolean),
  ].join(", ");
  const priceLabel = isCoach
    ? "—"
    : isSeasonPass || booking.priceHuf == null
    ? myBookings.card.priceFree
    : formatPriceHuf(booking.priceHuf);
  const timeRange = `${formatBudapestTime(startsAt)}–${formatBudapestTime(endsAt)}`;

  return (
    <article
      className={cn(
        styles.card,
        muted && styles.cardMuted,
        expanded && styles.cardExpanded,
      )}
    >
      <div className={styles.cardAccent} aria-hidden />

      <div className={styles.cardBody}>
        <header className={styles.cardHeader}>
          <div className={styles.cardIdentity}>
            <span className={styles.courtBadge}>{courtBadge}</span>
            <div className={styles.cardTitles}>
              <h3 className={styles.courtName}>{booking.court.name}</h3>
              <p className={styles.courtMeta}>{courtLabel}</p>
            </div>
          </div>
          <span
            className={cn(
              styles.typeBadge,
              isCoach
                ? styles.typeBadgeCoach
                : isSeasonPass
                ? styles.typeBadgeSeason
                : styles.typeBadgeOneTime,
            )}
          >
            {typeBadge}
          </span>
        </header>

        <div className={styles.cardSchedule}>
          <p className={styles.scheduleRow}>
            <CalendarDays className={styles.scheduleIcon} aria-hidden />
            <span>{formatBudapestDateLabel(startsAt)}</span>
          </p>
          <p className={styles.scheduleRow}>
            <Clock className={styles.scheduleIcon} aria-hidden />
            <span className={styles.timeRange}>{timeRange}</span>
          </p>
        </div>

        <button
          type="button"
          className={styles.toggle}
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => {
            setExpanded((open) => !open);
          }}
        >
          <span>
            {expanded ? myBookings.card.collapse : myBookings.card.expand}
          </span>
          <ChevronDown
            className={cn(styles.toggleIcon, expanded && styles.toggleIconOpen)}
            aria-hidden
          />
        </button>

        <div
          id={detailsId}
          className={cn(styles.details, expanded && styles.detailsOpen)}
        >
          <div className={styles.detailsInner}>
            <dl className={styles.detailsList}>
              <div>
                <dt>{myBookings.card.labels.type}</dt>
                <dd>{typeLabel}</dd>
              </div>
              {!isCoach && (
                <div>
                  <dt>{myBookings.card.labels.players}</dt>
                  <dd>{playersLabel}</dd>
                </div>
              )}
              {!isCoach && (
                <div>
                  <dt>{myBookings.card.labels.playerNames}</dt>
                  <dd>{names}</dd>
                </div>
              )}
              <div>
                <dt>{myBookings.card.labels.price}</dt>
                <dd>{priceLabel}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </article>
  );
}

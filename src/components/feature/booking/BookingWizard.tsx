"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

import {
  createBooking,
  getCourtsAvailabilityForWindow,
  type CourtOption,
} from "@/actions/booking";
import { booking } from "@/content/booking";
import {
  calculateOneTimePriceHuf,
  formatPriceHuf,
  isValidBookingRange,
  parseDateKey,
  type TimeLabel,
} from "@/lib/booking/time";
import { cn } from "@/lib/utils";

import {
  BookingTypeStep,
  type BookingTypeChoice,
  type PlayerCountChoice,
} from "./BookingTypeStep";
import { CourtSchematic } from "./CourtSchematic";
import { DayPicker } from "./DayPicker";
import { TimeSlotPicker } from "./TimeSlotPicker";
import styles from "./booking.module.css";

type StepId = "day" | "time" | "court" | "type" | "confirm";

const STEPS: StepId[] = ["day", "time", "court", "type", "confirm"];

type BookingWizardProps = {
  courts: CourtOption[];
  isAuthenticated: boolean;
  bookerName: string | null;
  onSuccess: () => void;
};

function formatDateLabel(dateKey: string): string {
  const { year, monthIndex, day } = parseDateKey(dateKey);
  return format(new Date(year, monthIndex, day), "yyyy. MMMM d. (EEEE)", {
    locale: hu,
  });
}

function guestNamesComplete(
  playerCount: PlayerCountChoice | null,
  guestPlayerNames: string[],
): boolean {
  if (!playerCount) return false;
  const expected = playerCount - 1;
  if (guestPlayerNames.length !== expected) return false;
  return guestPlayerNames.every((name) => name.trim().length >= 2);
}

export function BookingWizard({
  courts,
  isAuthenticated,
  bookerName,
  onSuccess,
}: BookingWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [furthestStepIndex, setFurthestStepIndex] = useState(0);
  const [courtId, setCourtId] = useState<string | null>(null);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [startLabel, setStartLabel] = useState<TimeLabel | null>(null);
  const [endLabel, setEndLabel] = useState<TimeLabel | null>(null);
  const [bookingType, setBookingType] = useState<BookingTypeChoice | null>(null);
  const [playerCount, setPlayerCount] = useState<PlayerCountChoice | null>(null);
  const [guestPlayerNames, setGuestPlayerNames] = useState<string[]>([]);
  const [availabilityByCourtId, setAvailabilityByCourtId] = useState<
    Record<string, boolean>
  >({});
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const step = STEPS[stepIndex];
  const selectedCourt = useMemo(
    () => courts.find((court) => court.id === courtId) ?? null,
    [courts, courtId],
  );

  useEffect(() => {
    if (
      step !== "court" ||
      !dateKey ||
      !startLabel ||
      !endLabel ||
      !isValidBookingRange(startLabel, endLabel)
    ) {
      return;
    }

    let cancelled = false;
    setLoadingAvailability(true);
    setAvailabilityError(null);

    void getCourtsAvailabilityForWindow(dateKey, startLabel, endLabel).then(
      (result) => {
        if (cancelled) return;
        setLoadingAvailability(false);
        if (!result.success) {
          setAvailabilityByCourtId({});
          setAvailabilityError(result.error);
          return;
        }

        const next: Record<string, boolean> = {};
        for (const row of result.data) {
          next[row.courtId] = row.available;
        }
        setAvailabilityByCourtId(next);
        setCourtId((current) =>
          current && next[current] === false ? null : current,
        );
      },
    );

    return () => {
      cancelled = true;
    };
  }, [step, dateKey, startLabel, endLabel]);

  const canGoNext = (() => {
    switch (step) {
      case "day":
        return Boolean(dateKey);
      case "time":
        return Boolean(
          startLabel && endLabel && isValidBookingRange(startLabel, endLabel),
        );
      case "court":
        return Boolean(courtId && availabilityByCourtId[courtId] === true);
      case "type":
        return Boolean(
          bookingType &&
            playerCount &&
            guestNamesComplete(playerCount, guestPlayerNames),
        );
      default:
        return false;
    }
  })();

  const goNext = () => {
    if (!canGoNext) return;
    setSubmitError(null);
    const next = Math.min(stepIndex + 1, STEPS.length - 1);
    setStepIndex(next);
    setFurthestStepIndex((furthest) => Math.max(furthest, next));
  };

  const goBack = () => {
    setSubmitError(null);
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const handleConfirm = () => {
    if (!isAuthenticated) {
      setSubmitError(booking.errors.auth);
      return;
    }
    if (
      !courtId ||
      !dateKey ||
      !startLabel ||
      !endLabel ||
      !bookingType ||
      !playerCount ||
      !guestNamesComplete(playerCount, guestPlayerNames)
    ) {
      setSubmitError(
        !guestNamesComplete(playerCount, guestPlayerNames)
          ? booking.errors.guestNames
          : booking.errors.generic,
      );
      return;
    }

    startTransition(async () => {
      setSubmitError(null);
      const result = await createBooking({
        courtId,
        dateKey,
        startLabel,
        endLabel,
        bookingType,
        playerCount,
        guestPlayerNames: guestPlayerNames.map((name) => name.trim()),
      });
      if (!result.success) {
        setSubmitError(result.error);
        return;
      }
      onSuccess();
    });
  };

  const goToStep = (index: number) => {
    if (index < 0 || index >= STEPS.length) return;
    if (index > furthestStepIndex) return;
    if (index === stepIndex) return;
    setSubmitError(null);
    setStepIndex(index);
  };

  const priceLabel =
    bookingType === "season_pass"
      ? booking.steps.confirm.priceFree
      : startLabel && endLabel
        ? formatPriceHuf(calculateOneTimePriceHuf(startLabel, endLabel))
        : "—";

  const playersLabel =
    playerCount === 2
      ? booking.steps.type.players.two
      : playerCount === 4
        ? booking.steps.type.players.four
        : "—";

  return (
    <div className={styles.wizard}>
      <ol className={styles.progress} aria-label="Foglalási lépések">
        {STEPS.map((id, index) => {
          const isCurrent = index === stepIndex;
          const isReached = index <= furthestStepIndex;
          const isDone = index < stepIndex;
          const canJump = isReached && !isCurrent;

          return (
            <li key={id} className={styles.progressItemWrap}>
              <button
                type="button"
                className={cn(
                  styles.progressItem,
                  isCurrent && styles.progressCurrent,
                  (isDone || (isReached && !isCurrent)) && styles.progressDone,
                  canJump && styles.progressClickable,
                )}
                disabled={!canJump}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`${index + 1}. ${booking.steps[id].shortTitle}`}
                onClick={() => goToStep(index)}
              >
                <span className={styles.progressIndex}>{index + 1}</span>
                <span className={styles.progressLabel}>
                  {booking.steps[id].shortTitle}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {!isAuthenticated ? (
        <aside className={styles.authBanner}>
          <p>
            <strong>{booking.loginRequired.title}</strong> —{" "}
            {booking.loginRequired.body}
          </p>
          <div className={styles.authLinks}>
            <Link href="/login" className={styles.authLink}>
              {booking.loginRequired.login}
            </Link>
            <Link href="/register" className={styles.authLinkMuted}>
              {booking.loginRequired.register}
            </Link>
          </div>
        </aside>
      ) : null}

      <section className={styles.stepPanel} aria-labelledby="booking-step-title">
        <h2 id="booking-step-title" className={styles.stepTitle}>
          {booking.steps[step].title}
        </h2>
        <p className={styles.stepLead}>{booking.steps[step].lead}</p>
        <p className={styles.stepLead}>{booking.steps[step].lead2}</p>

        {step === "day" ? (
          <DayPicker
            selectedDateKey={dateKey}
            onSelect={(key) => {
              setDateKey(key);
              setStartLabel(null);
              setEndLabel(null);
              setCourtId(null);
              setBookingType(null);
              setPlayerCount(null);
              setGuestPlayerNames([]);
              setAvailabilityByCourtId({});
            }}
          />
        ) : null}

        {step === "time" && dateKey ? (
          <TimeSlotPicker
            dateKey={dateKey}
            busy={[]}
            startLabel={startLabel}
            endLabel={endLabel}
            onChange={(start, end) => {
              setStartLabel(start);
              setEndLabel(end);
              setCourtId(null);
              setBookingType(null);
              setPlayerCount(null);
              setGuestPlayerNames([]);
              setAvailabilityByCourtId({});
            }}
          />
        ) : null}

        {step === "court" ? (
          <>
            {loadingAvailability ? (
              <p className={styles.muted}>{booking.steps.court.loading}</p>
            ) : null}
            {availabilityError ? (
              <p className={styles.inlineError}>{availabilityError}</p>
            ) : null}
            {!loadingAvailability && !availabilityError ? (
              <CourtSchematic
                courts={courts}
                selectedCourtId={courtId}
                availabilityByCourtId={availabilityByCourtId}
                onSelect={(id) => {
                  setCourtId(id);
                  setBookingType(null);
                  setPlayerCount(null);
                  setGuestPlayerNames([]);
                }}
              />
            ) : null}
          </>
        ) : null}

        {step === "type" && startLabel && endLabel ? (
          <BookingTypeStep
            value={bookingType}
            playerCount={playerCount}
            guestPlayerNames={guestPlayerNames}
            bookerName={bookerName}
            startLabel={startLabel}
            endLabel={endLabel}
            onChangeType={setBookingType}
            onChangePlayers={(count) => {
              setPlayerCount(count);
              setGuestPlayerNames(Array.from({ length: count - 1 }, () => ""));
            }}
            onChangeGuestName={(index, value) => {
              setGuestPlayerNames((current) => {
                const next = [...current];
                next[index] = value;
                return next;
              });
            }}
          />
        ) : null}

        {step === "confirm" ? (
          <dl className={styles.summary}>
            <div>
              <dt>{booking.steps.confirm.court}</dt>
              <dd>{selectedCourt?.name ?? "—"}</dd>
            </div>
            <div>
              <dt>{booking.steps.confirm.date}</dt>
              <dd>{dateKey ? formatDateLabel(dateKey) : "—"}</dd>
            </div>
            <div>
              <dt>{booking.steps.confirm.time}</dt>
              <dd>
                {startLabel && endLabel ? `${startLabel}–${endLabel}` : "—"}
              </dd>
            </div>
            <div>
              <dt>{booking.steps.confirm.type}</dt>
              <dd>
                {bookingType === "season_pass"
                  ? booking.steps.type.seasonPass.title
                  : booking.steps.type.oneTime.title}
              </dd>
            </div>
            <div>
              <dt>{booking.steps.confirm.players}</dt>
              <dd>{playersLabel}</dd>
            </div>
            <div>
              <dt>{booking.steps.confirm.playerNames}</dt>
              <dd>
                {[
                  bookerName ?? booking.steps.type.names.bookerFallback,
                  ...guestPlayerNames.map((name) => name.trim()).filter(Boolean),
                ].join(", ")}
              </dd>
            </div>
            <div>
              <dt>{booking.steps.confirm.price}</dt>
              <dd>{priceLabel}</dd>
            </div>
            {bookingType === "one_time" ? (
              <p className={styles.paymentNote}>
                {booking.steps.confirm.paymentNote}
              </p>
            ) : null}
          </dl>
        ) : null}

        {submitError ? <p className={styles.inlineError}>{submitError}</p> : null}

        <div
          className={cn(
            styles.actions,
            stepIndex === 0 && styles.actionsSingle,
          )}
        >
          {stepIndex > 0 ? (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={goBack}
            >
              {booking.nav.back}
            </button>
          ) : null}

          {step === "confirm" ? (
            <button
              type="button"
              className={styles.primaryButton}
              disabled={isPending || !isAuthenticated}
              onClick={handleConfirm}
            >
              {isPending
                ? booking.steps.confirm.submitting
                : booking.steps.confirm.submit}
            </button>
          ) : (
            <button
              type="button"
              className={styles.primaryButton}
              disabled={!canGoNext}
              onClick={goNext}
            >
              {booking.nav.next}
            </button>
          )}
        </div>
      </section>

      <aside className={styles.helpCard}>
        <div>
          <p className={styles.helpTitle}>{booking.help.title}</p>
          <p className={styles.helpBody}>{booking.help.body}</p>
        </div>
        <Link href={booking.help.href} className={styles.helpLink}>
          {booking.help.cta}
        </Link>
      </aside>
    </div>
  );
}

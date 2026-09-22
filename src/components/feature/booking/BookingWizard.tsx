"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  HelpCircle,
  LayoutGrid,
  Users,
} from "lucide-react";

import {
  createBooking,
  getBusyIntervalsForDate,
  getCourtsAvailabilityForWindow,
  type CourtOption,
} from "@/actions/booking";
import { booking } from "@/content/booking";
import type { BusyInterval } from "@/lib/booking/availability";
import {
  calculateOneTimePriceHuf,
  formatDateKeyLabel,
  formatPriceHuf,
  isValidBookingRange,
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

const STEP_ICONS = {
  day: CalendarDays,
  time: Clock3,
  court: LayoutGrid,
  type: Users,
  confirm: CheckCircle2,
} as const;

type BookingWizardProps = {
  courts: CourtOption[];
  isAuthenticated: boolean;
  bookerName: string | null;
  onSuccess: () => void;
};

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
  const [coachBookingByCourtId, setCoachBookingByCourtId] = useState<
    Record<string, boolean>
  >({});
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [dayBusyByCourtId, setDayBusyByCourtId] = useState<
    Record<string, BusyInterval[]>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const step = STEPS[stepIndex];
  const selectedCourt = useMemo(
    () => courts.find((court) => court.id === courtId) ?? null,
    [courts, courtId],
  );

  const courtIds = useMemo(() => courts.map((court) => court.id), [courts]);

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
          setCoachBookingByCourtId({});
          setAvailabilityError(result.error);
          return;
        }

        const next: Record<string, boolean> = {};
        const nextCoach: Record<string, boolean> = {};
        for (const row of result.data) {
          next[row.courtId] = row.available;
          nextCoach[row.courtId] = Boolean(row.isCoachBooking);
        }
        setAvailabilityByCourtId(next);
        setCoachBookingByCourtId(nextCoach);
        setCourtId((current) =>
          current && next[current] === false ? null : current,
        );
      },
    );

    return () => {
      cancelled = true;
    };
  }, [step, dateKey, startLabel, endLabel]);

  useEffect(() => {
    if (step !== "time" || !dateKey) {
      return;
    }

    let cancelled = false;
    void getBusyIntervalsForDate(dateKey).then((result) => {
      if (cancelled) return;
      if (!result.success) {
        setDayBusyByCourtId({});
        return;
      }
      setDayBusyByCourtId(result.data.busyByCourtId);
    });

    return () => {
      cancelled = true;
    };
  }, [step, dateKey]);

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

    const hasTime = Boolean(
      startLabel && endLabel && isValidBookingRange(startLabel, endLabel),
    );
    if (index >= 2 && !hasTime) {
      setSubmitError(null);
      setStepIndex(1);
      return;
    }

    setSubmitError(null);
    setStepIndex(index);
  };

  const applyTimeChange = (
    start: TimeLabel | null,
    end: TimeLabel | null,
  ) => {
    setStartLabel(start);
    setEndLabel(end);
    setCourtId(null);
    setBookingType(null);
    setPlayerCount(null);
    setGuestPlayerNames([]);
    setAvailabilityByCourtId({});
    setSubmitError(null);

    const complete =
      Boolean(start) &&
      Boolean(end) &&
      isValidBookingRange(start as TimeLabel, end as TimeLabel);

    if (!complete) {
      setFurthestStepIndex((furthest) => Math.min(furthest, 1));
      setStepIndex((current) => Math.min(current, 1));
    }
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
    <div className={styles.dashboard}>
      <aside className={styles.sidebar} aria-label="Foglalási lépések">
        <p className={styles.sidebarLabel}>Lépések</p>
        <ol className={styles.progress}>
          {STEPS.map((id, index) => {
            const isCurrent = index === stepIndex;
            const isReached = index <= furthestStepIndex;
            const isDone = index < stepIndex;
            const canJump = isReached && !isCurrent;
            const Icon = STEP_ICONS[id];

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
                  <span className={styles.progressIcon}>
                    <Icon size={18} aria-hidden />
                  </span>
                  <span className={styles.progressLabel}>
                    {booking.steps[id].shortTitle}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className={styles.sidebarActions}>
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
              disabled={isPending}
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
      </aside>

      <section className={styles.mainPanel} aria-labelledby="booking-step-title">
        <div className={styles.stepPanel}>
          <div className={styles.stepHeader}>
            <h2 id="booking-step-title" className={styles.stepTitle}>
              {booking.steps[step].title}
            </h2>
            <p className={styles.stepLead}>{booking.steps[step].lead}</p>
            {booking.steps[step].lead2 ? (
              <p className={styles.stepLead}>{booking.steps[step].lead2}</p>
            ) : null}
          </div>

          <div className={styles.stepBody}>
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
              setDayBusyByCourtId({});
              setFurthestStepIndex(0);
            }}
          />
        ) : null}

        {step === "time" && dateKey ? (
          <TimeSlotPicker
            dateKey={dateKey}
            courtIds={courtIds}
            busyByCourtId={dayBusyByCourtId}
            startLabel={startLabel}
            endLabel={endLabel}
            onChange={applyTimeChange}
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
                    coachBookingByCourtId={coachBookingByCourtId}
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
                  <dd>{dateKey ? formatDateKeyLabel(dateKey) : "—"}</dd>
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

            {submitError ? (
              <p className={styles.inlineError}>{submitError}</p>
            ) : null}
          </div>

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
                disabled={isPending}
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
        </div>
      </section>

      <aside className={styles.sidePanel}>
        <div className={styles.summaryCard}>
          <p className={styles.sideCardTitle}>Kiválasztás</p>
          <dl className={styles.sideSummary}>
            <div>
              <dt>Nap</dt>
              <dd>{dateKey ? formatDateKeyLabel(dateKey) : "—"}</dd>
            </div>
            <div>
              <dt>Idő</dt>
              <dd>
                {startLabel && endLabel ? `${startLabel}–${endLabel}` : "—"}
              </dd>
            </div>
            <div>
              <dt>Pálya</dt>
              <dd>{selectedCourt?.name ?? "—"}</dd>
            </div>
            <div>
              <dt>Típus</dt>
              <dd>
                {bookingType === "season_pass"
                  ? booking.steps.type.seasonPass.title
                  : bookingType === "one_time"
                    ? booking.steps.type.oneTime.title
                    : "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className={styles.filterCard}>
          <p className={styles.sideCardTitle}>Jelmagyarázat</p>
          <ul className={styles.filterList}>
            <li>
              <span className={cn(styles.filterDot, styles.filterFree)} />
              Szabad
            </li>
            <li>
              <span className={cn(styles.filterDot, styles.filterBusy)} />
              Foglalt
            </li>
            <li>
              <span className={cn(styles.filterDot, styles.filterSelected)} />
              Kiválasztott
            </li>
            <li>
              <span className={cn(styles.filterDot, styles.filterPast)} />
              Elmúlt / zárt
            </li>
          </ul>
        </div>

        <aside className={styles.helpCard}>
          <div className={styles.helpIconWrap}>
            <HelpCircle size={18} aria-hidden />
          </div>
          <div>
            <p className={styles.helpTitle}>{booking.help.title}</p>
            <p className={styles.helpBody}>{booking.help.body}</p>
          </div>
          <Link href={booking.help.href} className={styles.helpLink}>
            {booking.help.cta}
          </Link>
        </aside>
      </aside>
    </div>
  );
}

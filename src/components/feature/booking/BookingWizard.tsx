"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

import {
  createBooking,
  getCourtAvailability,
  type BusyInterval,
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

import { BookingTypeStep, type BookingTypeChoice } from "./BookingTypeStep";
import { CourtSchematic } from "./CourtSchematic";
import { DayPicker } from "./DayPicker";
import { TimeSlotPicker } from "./TimeSlotPicker";
import styles from "./booking.module.css";

type StepId = "court" | "day" | "time" | "type" | "confirm";

const STEPS: StepId[] = ["court", "day", "time", "type", "confirm"];

type BookingWizardProps = {
  courts: CourtOption[];
  isAuthenticated: boolean;
};

function formatDateLabel(dateKey: string): string {
  const { year, monthIndex, day } = parseDateKey(dateKey);
  return format(new Date(year, monthIndex, day), "yyyy. MMMM d. (EEEE)", {
    locale: hu,
  });
}

export function BookingWizard({ courts, isAuthenticated }: BookingWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [courtId, setCourtId] = useState<string | null>(null);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [startLabel, setStartLabel] = useState<TimeLabel | null>(null);
  const [endLabel, setEndLabel] = useState<TimeLabel | null>(null);
  const [bookingType, setBookingType] = useState<BookingTypeChoice | null>(null);
  const [busy, setBusy] = useState<BusyInterval[]>([]);
  const [busyError, setBusyError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingBusy, setLoadingBusy] = useState(false);

  const step = STEPS[stepIndex];
  const selectedCourt = useMemo(
    () => courts.find((court) => court.id === courtId) ?? null,
    [courts, courtId],
  );

  useEffect(() => {
    if (!courtId || !dateKey || step !== "time") return;

    let cancelled = false;
    setLoadingBusy(true);
    setBusyError(null);

    void getCourtAvailability(courtId, dateKey).then((result) => {
      if (cancelled) return;
      setLoadingBusy(false);
      if (!result.success) {
        setBusy([]);
        setBusyError(result.error);
        return;
      }
      setBusy(result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [courtId, dateKey, step]);

  const canGoNext = (() => {
    switch (step) {
      case "court":
        return Boolean(courtId);
      case "day":
        return Boolean(dateKey);
      case "time":
        return Boolean(
          startLabel && endLabel && isValidBookingRange(startLabel, endLabel),
        );
      case "type":
        return Boolean(bookingType);
      default:
        return false;
    }
  })();

  const goNext = () => {
    if (!canGoNext) return;
    setSubmitError(null);
    setStepIndex((index) => Math.min(index + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setSubmitError(null);
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const reset = () => {
    setStepIndex(0);
    setCourtId(null);
    setDateKey(null);
    setStartLabel(null);
    setEndLabel(null);
    setBookingType(null);
    setBusy([]);
    setSubmitError(null);
    setSuccessId(null);
  };

  const handleConfirm = () => {
    if (!isAuthenticated) {
      setSubmitError(booking.errors.auth);
      return;
    }
    if (!courtId || !dateKey || !startLabel || !endLabel || !bookingType) {
      setSubmitError(booking.errors.generic);
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
      });
      if (!result.success) {
        setSubmitError(result.error);
        return;
      }
      setSuccessId(result.data.id);
    });
  };

  if (successId) {
    return (
      <div className={styles.successPanel}>
        <h2 className={styles.stepTitle}>{booking.steps.confirm.success}</h2>
        <p className={styles.stepLead}>{booking.steps.confirm.successBody}</p>
        <button type="button" className={styles.primaryButton} onClick={reset}>
          {booking.steps.confirm.another}
        </button>
      </div>
    );
  }

  const priceLabel =
    bookingType === "season_pass"
      ? booking.steps.confirm.priceFree
      : startLabel && endLabel
        ? formatPriceHuf(calculateOneTimePriceHuf(startLabel, endLabel))
        : "—";

  return (
    <div className={styles.wizard}>
      <ol className={styles.progress} aria-label="Foglalási lépések">
        {STEPS.map((id, index) => (
          <li
            key={id}
            className={cn(
              styles.progressItem,
              index === stepIndex && styles.progressCurrent,
              index < stepIndex && styles.progressDone,
            )}
          >
            <span className={styles.progressIndex}>{index + 1}</span>
            <span className={styles.progressLabel}>{booking.steps[id].title}</span>
          </li>
        ))}
      </ol>

      {!isAuthenticated ? (
        <aside className={styles.authBanner}>
          <p>
            <strong>{booking.loginRequired.title}</strong> — {booking.loginRequired.body}
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

        {step === "court" ? (
          <CourtSchematic
            courts={courts}
            selectedCourtId={courtId}
            onSelect={(id) => {
              setCourtId(id);
              setDateKey(null);
              setStartLabel(null);
              setEndLabel(null);
              setBookingType(null);
            }}
          />
        ) : null}

        {step === "day" ? (
          <DayPicker
            selectedDateKey={dateKey}
            onSelect={(key) => {
              setDateKey(key);
              setStartLabel(null);
              setEndLabel(null);
            }}
          />
        ) : null}

        {step === "time" && dateKey ? (
          <>
            {loadingBusy ? <p className={styles.muted}>Foglaltság betöltése…</p> : null}
            {busyError ? <p className={styles.inlineError}>{busyError}</p> : null}
            <TimeSlotPicker
              dateKey={dateKey}
              busy={busy}
              startLabel={startLabel}
              endLabel={endLabel}
              onChange={(start, end) => {
                setStartLabel(start);
                setEndLabel(end);
              }}
            />
          </>
        ) : null}

        {step === "type" && startLabel && endLabel ? (
          <BookingTypeStep
            value={bookingType}
            startLabel={startLabel}
            endLabel={endLabel}
            onChange={setBookingType}
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
              <dd>{startLabel && endLabel ? `${startLabel}–${endLabel}` : "—"}</dd>
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
              <dt>{booking.steps.confirm.price}</dt>
              <dd>{priceLabel}</dd>
            </div>
            {bookingType === "one_time" ? (
              <p className={styles.paymentNote}>{booking.steps.confirm.paymentNote}</p>
            ) : null}
          </dl>
        ) : null}

        {submitError ? <p className={styles.inlineError}>{submitError}</p> : null}

        <div className={styles.actions}>
          {stepIndex > 0 ? (
            <button type="button" className={styles.secondaryButton} onClick={goBack}>
              {booking.nav.back}
            </button>
          ) : (
            <span />
          )}

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
    </div>
  );
}

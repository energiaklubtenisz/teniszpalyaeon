"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sun,
  Users,
  X,
} from "lucide-react";

import { adminCancelBooking, type AdminBooking } from "@/actions/admin";
import { adminContent } from "@/content/admin";
import styles from "../admin.module.css";

type BookingsScheduleViewProps = {
  bookings: AdminBooking[];
  viewMode: "schedule" | "matrix";
  onMutated?: () => void;
};

// Helper to get today's date in Europe/Budapest wall-clock format YYYY-MM-DD
function getTodayBudapestDateKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Helper to shift dateKey by days without timezone bugs
function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
}

// Formatted Hungarian date: e.g. "2026. szeptember 22., Kedd"
function formatHungarianDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("hu-HU", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

// Generates time labels: 08:00, 08:30, 09:00 ... 20:30
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h <= 20; h++) {
    const padH = String(h).padStart(2, "0");
    slots.push(`${padH}:00`);
    if (h < 20) {
      slots.push(`${padH}:30`);
    }
  }
  return slots;
}

export function BookingsScheduleView({
  bookings,
  viewMode,
  onMutated,
}: BookingsScheduleViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getTodayBudapestDateKey(),
  );
  const [selectedCourtFilter, setSelectedCourtFilter] = useState<
    "all" | number
  >("all");

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isToday = selectedDate === getTodayBudapestDateKey();

  // Filter bookings for selected date
  const dayBookings = useMemo(() => {
    return bookings.filter((b) => b.startsAt.startsWith(selectedDate));
  }, [bookings, selectedDate]);

  // Group bookings by courtNumber (1..8)
  const bookingsByCourt = useMemo(() => {
    const map = new Map<number, AdminBooking[]>();
    for (let c = 1; c <= 8; c++) {
      map.set(c, []);
    }
    for (const b of dayBookings) {
      const courts =
        b.courtNumbers && b.courtNumbers.length > 0
          ? b.courtNumbers
          : [b.courtNumber];
      for (const c of courts) {
        const list = map.get(c) ?? [];
        list.push(b);
        map.set(c, list);
      }
    }
    // Sort each court's bookings chronologically
    for (let c = 1; c <= 8; c++) {
      map.get(c)?.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    }
    return map;
  }, [dayBookings]);

  // Calculate day totals
  const totalDayStats = useMemo(() => {
    let count = 0;
    let totalMinutes = 0;
    for (const b of dayBookings) {
      if (b.status === "confirmed") {
        count++;
        const sH = parseInt(b.startsAt.slice(11, 13), 10);
        const sM = parseInt(b.startsAt.slice(14, 16), 10);
        const eH = parseInt(b.endsAt.slice(11, 13), 10);
        const eM = parseInt(b.endsAt.slice(14, 16), 10);
        const mins = eH * 60 + eM - (sH * 60 + sM);
        const numCourts =
          b.courtNumbers && b.courtNumbers.length > 0
            ? b.courtNumbers.length
            : 1;
        totalMinutes += (mins > 0 ? mins : 60) * numCourts;
      }
    }
    return {
      count,
      hours: Math.round((totalMinutes / 60) * 10) / 10,
    };
  }, [dayBookings]);

  const handleCancelBooking = (bookingIds: string | string[]) => {
    if (!window.confirm(adminContent.database.bookings.actions.confirmCancel)) {
      return;
    }

    const firstId = Array.isArray(bookingIds) ? bookingIds[0] : bookingIds;
    setPendingId(firstId);
    setFeedback(null);

    startTransition(async () => {
      const res = await adminCancelBooking(bookingIds);
      setPendingId(null);
      if (res.success) {
        setFeedback({
          type: "success",
          message: "A foglalás sikeresen lemondva.",
        });
        onMutated?.();
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    });
  };

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  // Courts to display: either all 1..8 or only the selected court
  const displayedCourts = useMemo(() => {
    if (selectedCourtFilter === "all") {
      return [1, 2, 3, 4, 5, 6, 7, 8];
    }
    return [selectedCourtFilter];
  }, [selectedCourtFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Date Navigation & Summary Bar */}
      <div className={styles.scheduleHeaderBar}>
        <div className={styles.dateNavRow}>
          <div className={styles.dateControls}>
            <button
              type="button"
              className={styles.dateNavBtn}
              onClick={() => setSelectedDate((d) => shiftDateKey(d, -1))}
              title={adminContent.database.bookings.dateNav.prevDay}
            >
              <ChevronLeft size={16} aria-hidden />
              <span>Előző</span>
            </button>

            <div className={styles.currentDateBox}>
              <Calendar size={18} color="var(--ink)" aria-hidden />
              <span className={styles.currentDateText}>
                {formatHungarianDate(selectedDate)}
              </span>
              <input
                type="date"
                className={styles.datePickerInput}
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                  }
                }}
                aria-label={adminContent.database.bookings.dateNav.selectDate}
              />
            </div>

            <button
              type="button"
              className={styles.dateNavBtn}
              onClick={() => setSelectedDate((d) => shiftDateKey(d, 1))}
              title={adminContent.database.bookings.dateNav.nextDay}
            >
              <span>Következő</span>
              <ChevronRight size={16} aria-hidden />
            </button>

            {!isToday ? (
              <button
                type="button"
                className={`${styles.dateNavBtn} ${styles.todayBtn}`}
                onClick={() => setSelectedDate(getTodayBudapestDateKey())}
              >
                Ma
              </button>
            ) : null}
          </div>

          {/* Quick Court Filter Pills */}
          {viewMode === "schedule" ? (
            <div className={styles.courtFilterRow} role="group" aria-label="Pálya szűrő">
              <button
                type="button"
                className={`${styles.courtFilterBtn} ${
                  selectedCourtFilter === "all"
                    ? styles.courtFilterBtnActive
                    : ""
                }`}
                onClick={() => setSelectedCourtFilter("all")}
              >
                Összes pálya (8)
              </button>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((courtNum) => {
                const count = (bookingsByCourt.get(courtNum) ?? []).filter(
                  (b) => b.status === "confirmed",
                ).length;
                return (
                  <button
                    key={courtNum}
                    type="button"
                    className={`${styles.courtFilterBtn} ${
                      selectedCourtFilter === courtNum
                        ? styles.courtFilterBtnActive
                        : ""
                    }`}
                    onClick={() => setSelectedCourtFilter(courtNum)}
                  >
                    <span>{courtNum}.</span>
                    {count > 0 ? (
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "0.7rem",
                          opacity: 0.9,
                        }}
                      >
                        ({count})
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className={styles.scheduleSummaryBar}>
          <div className={styles.scheduleStatsBadge}>
            <Clock size={16} aria-hidden />
            <span>
              {totalDayStats.count > 0
                ? adminContent.database.bookings.dateNav.totalDayStats
                    .replace("{count}", String(totalDayStats.count))
                    .replace("{hours}", String(totalDayStats.hours))
                : adminContent.database.bookings.dateNav.noDayBookings}
            </span>
          </div>
        </div>
      </div>

      {feedback ? (
        <div
          className={
            feedback.type === "success" ? styles.alertSuccess : styles.alertError
          }
        >
          {feedback.message}
        </div>
      ) : null}

      {/* VIEW MODE 1: PÁLYÁK SZERINTI MENETREND (KOMPAKT PÁLYASÁVOK) */}
      {viewMode === "schedule" ? (
        <div className={styles.courtStripsList}>
          {displayedCourts.map((courtNum) => {
            const courtBookings = bookingsByCourt.get(courtNum) ?? [];
            const activeBookings = courtBookings.filter(
              (b) => b.status === "confirmed",
            );

            // Total hours for this court
            let courtMins = 0;
            for (const b of activeBookings) {
              const sH = parseInt(b.startsAt.slice(11, 13), 10);
              const sM = parseInt(b.startsAt.slice(14, 16), 10);
              const eH = parseInt(b.endsAt.slice(11, 13), 10);
              const eM = parseInt(b.endsAt.slice(14, 16), 10);
              const mins = eH * 60 + eM - (sH * 60 + sM);
              courtMins += mins > 0 ? mins : 60;
            }
            const courtHours = Math.round((courtMins / 60) * 10) / 10;

            return (
              <div key={courtNum} className={styles.courtStrip}>
                <div className={styles.courtStripHeader}>
                  <div className={styles.courtStripLeft}>
                    <span className={styles.courtNumberBadge}>{courtNum}</span>
                    <span className={styles.courtNameText}>
                      {courtNum}
                      {adminContent.database.bookings.courtCard.courtPrefix}
                    </span>

                    {activeBookings.length > 0 ? (
                      <span
                        className={`${styles.courtOccupancyBadge} ${styles.courtOccupancyBadgeActive}`}
                      >
                        {adminContent.database.bookings.courtCard.bookingsCount
                          .replace("{count}", String(activeBookings.length))
                          .replace("{hours}", String(courtHours))}
                      </span>
                    ) : (
                      <span className={styles.courtOccupancyBadge}>
                        {adminContent.database.bookings.courtCard.freeAllDay}
                      </span>
                    )}
                  </div>

                  {/* Mini Visual Timeline Ribbon (08:00 - 20:00 = 720 minutes) */}
                  <div
                    className={styles.courtTimelineRibbon}
                    title="Aznapi idősávok foglaltsága (08:00 – 20:00)"
                  >
                    {activeBookings.map((b) => {
                      const sH = parseInt(b.startsAt.slice(11, 13), 10);
                      const sM = parseInt(b.startsAt.slice(14, 16), 10);
                      const eH = parseInt(b.endsAt.slice(11, 13), 10);
                      const eM = parseInt(b.endsAt.slice(14, 16), 10);

                      const startMinsFrom8 = (sH - 8) * 60 + sM;
                      const durationMins = (eH - sH) * 60 + (eM - sM);

                      const leftPct = Math.max(
                        0,
                        Math.min(100, (startMinsFrom8 / 720) * 100),
                      );
                      const widthPct = Math.max(
                        2,
                        Math.min(100 - leftPct, (durationMins / 720) * 100),
                      );

                      return (
                        <div
                          key={b.id}
                          className={`${styles.courtTimelineBlock} ${
                            b.bookingType === "season_pass"
                              ? styles.courtTimelineBlockSeason
                              : styles.courtTimelineBlockOneTime
                          }`}
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Compact Bookings List or Free Notice */}
                {courtBookings.length === 0 ? (
                  <div className={styles.compactFreeRow}>
                    <Sun size={15} color="#15803d" aria-hidden />
                    <span>
                      {adminContent.database.bookings.courtCard.noBookingsNotice}
                    </span>
                  </div>
                ) : (
                  <div className={styles.compactRowsList}>
                    {courtBookings.map((b) => {
                      const startTime = b.startsAt.slice(11, 16);
                      const endTime = b.endsAt.slice(11, 16);
                      const isCancelled = b.status === "cancelled";
                      const isPendingItem =
                        isPending &&
                        (pendingId === b.id ||
                          Boolean(
                            b.bookingIds &&
                              pendingId &&
                              b.bookingIds.includes(pendingId),
                          ));

                      return (
                        <div
                          key={b.id}
                          className={`${styles.compactBookingRow} ${
                            isCancelled
                              ? styles.compactBookingRowCancelled
                              : ""
                          }`}
                        >
                          <span className={styles.compactTimePill}>
                            <Clock size={13} aria-hidden />
                            {startTime} – {endTime}
                          </span>

                          <div className={styles.compactUserSection}>
                            <span className={styles.compactUserName}>
                              {b.userName}
                            </span>
                            <span className={styles.compactUserContact}>
                              ({b.userEmail}
                              {b.userPhone ? ` • ${b.userPhone}` : ""})
                            </span>
                          </div>

                          <div className={styles.compactMetaSection}>
                            {isCancelled ? (
                              <span className={styles.badgeCancelled}>
                                Lemondva
                              </span>
                            ) : b.isCoachBooking ? (
                              <span className={styles.badgeCoach}>
                                Edző
                              </span>
                            ) : b.bookingType === "season_pass" ? (
                              <span className={styles.badgeSeason}>
                                Bérletes
                              </span>
                            ) : (
                              <span className={styles.badgeOneTime}>
                                Alkalmi
                              </span>
                            )}

                            {!b.isCoachBooking && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                  color: "var(--graphite)",
                                  fontSize: "0.75rem",
                                }}
                              >
                                <Users size={12} aria-hidden />
                                {b.playerCount} fő
                                {b.guestPlayerNames.length > 0
                                  ? ` (${b.guestPlayerNames.join(", ")})`
                                  : ""}
                              </span>
                            )}

                            <span className={styles.compactPrice}>
                              {b.isCoachBooking
                                ? "—"
                                : b.priceHuf != null
                                ? `${b.priceHuf.toLocaleString("hu-HU")} Ft`
                                : "Bérlet (0 Ft)"}
                            </span>

                            {!isCancelled ? (
                              <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                disabled={isPendingItem}
                                onClick={() =>
                                  handleCancelBooking(
                                    b.bookingIds && b.bookingIds.length > 0
                                      ? b.bookingIds
                                      : b.id,
                                  )
                                }
                                title={
                                  adminContent.database.bookings.actions.cancel
                                }
                                style={{ padding: "0.25rem 0.6rem" }}
                              >
                                <X size={12} aria-hidden />
                                <span>Lemondás</span>
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* VIEW MODE 2: IDŐSÁVOS ÓRAREND (TIMETABLE MATRIX) */}
      {viewMode === "matrix" ? (
        <div className={styles.matrixCard}>
          <table className={styles.matrixTable}>
            <thead>
              <tr>
                <th className={styles.matrixThTime}>Idősáv</th>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((courtNum) => (
                  <th key={courtNum} className={styles.matrixThCourt}>
                    {courtNum}. pálya
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slotTime) => {
                return (
                  <tr key={slotTime} className={styles.matrixRow}>
                    <td className={styles.matrixTdTime}>{slotTime}</td>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((courtNum) => {
                      const courtBookings = bookingsByCourt.get(courtNum) ?? [];
                      const active = courtBookings.find((b) => {
                        const start = b.startsAt.slice(11, 16);
                        const end = b.endsAt.slice(11, 16);
                        return (
                          b.status === "confirmed" &&
                          slotTime >= start &&
                          slotTime < end
                        );
                      });

                      if (!active) {
                        return (
                          <td key={courtNum} className={styles.matrixTdCell}>
                            <span className={styles.matrixCellEmpty}>—</span>
                          </td>
                        );
                      }

                      const isStart = active.startsAt.slice(11, 16) === slotTime;

                      return (
                        <td key={courtNum} className={styles.matrixTdCell}>
                          <div
                            className={`${styles.matrixBlockBooked} ${
                              active.isCoachBooking
                                ? styles.matrixBlockCoach
                                : active.bookingType === "season_pass"
                                ? styles.matrixBlockSeason
                                : styles.matrixBlockOneTime
                            }`}
                          >
                            <span className={styles.matrixBlockName}>
                              {active.userName}
                            </span>
                            {isStart ? (
                              <span className={styles.matrixBlockTime}>
                                {active.startsAt.slice(11, 16)} –{" "}
                                {active.endsAt.slice(11, 16)}
                              </span>
                            ) : null}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

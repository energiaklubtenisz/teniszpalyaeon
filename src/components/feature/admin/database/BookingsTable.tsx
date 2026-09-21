"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, X, Search, Calendar, Users } from "lucide-react";

import { adminCancelBooking, type AdminBooking } from "@/actions/admin";
import { adminContent } from "@/content/admin";
import styles from "../admin.module.css";

type BookingsTableProps = {
  bookings: AdminBooking[];
  onMutated?: () => void;
};

export function BookingsTable({ bookings, onMutated }: BookingsTableProps) {
  const [search, setSearch] = useState("");
  const [courtFilter, setCourtFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "season_pass" | "one_time">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "cancelled">("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "upcoming" | "past" | "today">("all");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nowIso = new Date().toISOString().slice(0, 19);
  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();

    return bookings.filter((b) => {
      // Search
      const matchSearch =
        !q ||
        b.userName.toLowerCase().includes(q) ||
        b.userEmail.toLowerCase().includes(q) ||
        b.guestPlayerNames.some((g) => g.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // Court filter
      if (courtFilter !== "all" && b.courtNumber.toString() !== courtFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && b.bookingType !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && b.status !== statusFilter) {
        return false;
      }

      // Time filter
      if (timeFilter === "upcoming" && b.startsAt < nowIso) return false;
      if (timeFilter === "past" && b.startsAt >= nowIso) return false;
      if (timeFilter === "today" && !b.startsAt.startsWith(todayStr)) return false;

      return true;
    });
  }, [bookings, search, courtFilter, typeFilter, statusFilter, timeFilter, nowIso, todayStr]);

  const handleCancelBooking = (bookingId: string) => {
    if (!window.confirm(adminContent.database.bookings.actions.confirmCancel)) {
      return;
    }

    setPendingBookingId(bookingId);
    setFeedback(null);

    startTransition(async () => {
      const res = await adminCancelBooking(bookingId);
      setPendingBookingId(null);
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

  return (
    <div className={styles.panel}>
      <div className={styles.tableToolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} aria-hidden />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={adminContent.database.bookings.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterRow}>
          <select
            className={styles.filterSelect}
            value={courtFilter}
            onChange={(e) => setCourtFilter(e.target.value)}
            aria-label="Pálya szűrő"
          >
            <option value="all">{adminContent.database.bookings.filters.courtAll}</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((c) => (
              <option key={c} value={c.toString()}>
                {c}
                {adminContent.database.bookings.filters.courtPrefix}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            aria-label="Típus szűrő"
          >
            <option value="all">{adminContent.database.bookings.filters.typeAll}</option>
            <option value="season_pass">{adminContent.database.bookings.filters.typeSeasonPass}</option>
            <option value="one_time">{adminContent.database.bookings.filters.typeOneTime}</option>
          </select>

          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            aria-label="Státusz szűrő"
          >
            <option value="all">{adminContent.database.bookings.filters.statusAll}</option>
            <option value="confirmed">{adminContent.database.bookings.filters.statusConfirmed}</option>
            <option value="cancelled">{adminContent.database.bookings.filters.statusCancelled}</option>
          </select>

          <select
            className={styles.filterSelect}
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as typeof timeFilter)}
            aria-label="Időszak szűrő"
          >
            <option value="all">{adminContent.database.bookings.filters.timeAll}</option>
            <option value="today">{adminContent.database.bookings.filters.timeToday}</option>
            <option value="upcoming">{adminContent.database.bookings.filters.timeUpcoming}</option>
            <option value="past">{adminContent.database.bookings.filters.timePast}</option>
          </select>
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

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>{adminContent.database.bookings.columns.court}</th>
              <th className={styles.th}>{adminContent.database.bookings.columns.time}</th>
              <th className={styles.th}>{adminContent.database.bookings.columns.user}</th>
              <th className={styles.th}>{adminContent.database.bookings.columns.type}</th>
              <th className={styles.th}>{adminContent.database.bookings.columns.players}</th>
              <th className={styles.th}>{adminContent.database.bookings.columns.price}</th>
              <th className={styles.th}>{adminContent.database.bookings.columns.status}</th>
              <th className={styles.th}>{adminContent.database.bookings.columns.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.td}>
                  <div className={styles.emptyState}>
                    <p className={styles.emptyBody}>{adminContent.database.bookings.empty}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking) => {
                const datePart = booking.startsAt.slice(0, 10);
                const startTime = booking.startsAt.slice(11, 16);
                const endTime = booking.endsAt.slice(11, 16);
                const isBookingPending = isPending && pendingBookingId === booking.id;

                return (
                  <tr key={booking.id} className={styles.tr}>
                    <td className={`${styles.td} ${styles.tdStrong}`}>
                      <span className={styles.badgeMember}>
                        {booking.courtNumber}. pálya
                      </span>
                    </td>
                    <td className={styles.td}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontWeight: 500, color: "var(--ink)" }}>
                          {datePart}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--smoke)" }}>
                          {startTime} – {endTime}
                        </span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontWeight: 500, color: "var(--ink)" }}>
                          {booking.userName}
                        </span>
                        <span className={styles.emailText} style={{ fontSize: "0.75rem" }}>
                          {booking.userEmail}
                        </span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      {booking.bookingType === "season_pass" ? (
                        <span className={styles.badgeSeason}>Bérletes</span>
                      ) : (
                        <span className={styles.badgeOneTime}>Alkalmi</span>
                      )}
                    </td>
                    <td className={styles.td}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Users size={12} aria-hidden />
                          <strong>{booking.playerCount} fő</strong>
                        </span>
                        {booking.guestPlayerNames.length > 0 ? (
                          <span style={{ fontSize: "0.75rem", color: "var(--smoke)" }}>
                            {booking.guestPlayerNames.join(", ")}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className={`${styles.td} ${styles.tdStrong}`}>
                      {booking.priceHuf != null
                        ? `${booking.priceHuf.toLocaleString("hu-HU")} Ft`
                        : "—"}
                    </td>
                    <td className={styles.td}>
                      {booking.status === "confirmed" ? (
                        <span className={styles.badgeConfirmed}>
                          <Check size={12} aria-hidden />
                          Megerősítve
                        </span>
                      ) : (
                        <span className={styles.badgeCancelled}>
                          <X size={12} aria-hidden />
                          Lemondva
                        </span>
                      )}
                    </td>
                    <td className={styles.td}>
                      {booking.status === "confirmed" ? (
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          disabled={isBookingPending}
                          onClick={() => handleCancelBooking(booking.id)}
                          title={adminContent.database.bookings.actions.cancel}
                        >
                          <X size={14} aria-hidden />
                          <span>Lemondás</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--smoke)" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

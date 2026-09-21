"use client";

import {
  Activity,
  CalendarCheck,
  CheckCircle2,
  Clock,
  DollarSign,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";

import type { AdminDashboardMetrics } from "@/actions/admin";
import { adminContent } from "@/content/admin";
import styles from "../admin.module.css";

type AdminReportsViewProps = {
  metrics: AdminDashboardMetrics;
};

export function AdminReportsView({ metrics }: AdminReportsViewProps) {
  const maxCourtHours = Math.max(
    ...metrics.courtUtilization.map((c) => c.totalHours),
    1,
  );

  const totalPeakBookings =
    metrics.peakHours.morning +
    metrics.peakHours.afternoon +
    metrics.peakHours.evening;

  const morningPct = totalPeakBookings
    ? Math.round((metrics.peakHours.morning / totalPeakBookings) * 100)
    : 0;
  const afternoonPct = totalPeakBookings
    ? Math.round((metrics.peakHours.afternoon / totalPeakBookings) * 100)
    : 0;
  const eveningPct = totalPeakBookings
    ? Math.round((metrics.peakHours.evening / totalPeakBookings) * 100)
    : 0;

  const totalTypeCount =
    metrics.seasonPassBookingCount + metrics.oneTimeBookingCount;
  const seasonPct = totalTypeCount
    ? Math.round((metrics.seasonPassBookingCount / totalTypeCount) * 100)
    : 0;
  const oneTimePct = totalTypeCount ? 100 - seasonPct : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <header className={styles.header}>
        <h1 className={styles.title}>{adminContent.reports.title}</h1>
        <p className={styles.support}>{adminContent.reports.support}</p>
      </header>

      {/* KPI Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className={styles.statLabel}>{adminContent.reports.kpis.totalBookings}</span>
            <CalendarCheck size={18} color="var(--smoke)" aria-hidden />
          </div>
          <span className={styles.statValue}>{metrics.totalBookings}</span>
          <span style={{ fontSize: "0.75rem", color: "var(--smoke)" }}>
            Ebből jövőbeli aktív: <strong>{metrics.activeBookings}</strong>
          </span>
        </div>

        <div className={styles.statCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className={styles.statLabel}>{adminContent.reports.kpis.totalRevenue}</span>
            <DollarSign size={18} color="var(--smoke)" aria-hidden />
          </div>
          <span className={styles.statValue}>
            {metrics.totalRevenueHuf.toLocaleString("hu-HU")} Ft
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--smoke)" }}>
            {metrics.oneTimeBookingCount} fizetős alkalmi foglalásból
          </span>
        </div>

        <div className={styles.statCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className={styles.statLabel}>{adminContent.reports.kpis.activePasses}</span>
            <Ticket size={18} color="var(--smoke)" aria-hidden />
          </div>
          <span className={styles.statValue}>{metrics.activeSeasonPasses}</span>
          <span style={{ fontSize: "0.75rem", color: "var(--smoke)" }}>
            Éves bérlettel rendelkező tag
          </span>
        </div>

        <div className={styles.statCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className={styles.statLabel}>{adminContent.reports.kpis.totalMembers}</span>
            <Users size={18} color="var(--smoke)" aria-hidden />
          </div>
          <span className={styles.statValue}>{metrics.totalMembers}</span>
          <span style={{ fontSize: "0.75rem", color: "var(--smoke)" }}>
            Regisztrált online felhasználó
          </span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Court Utilization */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>
              {adminContent.reports.charts.courtUtilization}
            </h2>
            <Activity size={18} color="var(--smoke)" aria-hidden />
          </div>

          <div className={styles.utilizationList}>
            {metrics.courtUtilization.map((c) => {
              const fillPct = Math.min(
                100,
                Math.round((c.totalHours / maxCourtHours) * 100),
              );
              const isTopCourt = c.totalHours === maxCourtHours && maxCourtHours > 0;

              return (
                <div key={c.courtId} className={styles.utilizationRow}>
                  <div className={styles.utilizationMeta}>
                    <span className={styles.courtTitle}>
                      {c.courtNumber}. pálya ({c.courtName})
                    </span>
                    <span className={styles.courtHours}>
                      {c.totalHours} óra ({c.bookingCount} foglalás)
                    </span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div
                      className={`${styles.progressFill} ${
                        isTopCourt ? styles.progressFillHighlight : ""
                      }`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peak Hours & Booking Types */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Peak Hours */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h2 className={styles.chartTitle}>
                {adminContent.reports.charts.peakHours}
              </h2>
              <Clock size={18} color="var(--smoke)" aria-hidden />
            </div>

            <div className={styles.peakDistribution}>
              <div className={styles.peakItem}>
                <div className={styles.peakHeader}>
                  <span className={styles.peakLabel}>
                    {adminContent.reports.charts.morning}
                  </span>
                  <span className={styles.peakCount}>
                    {metrics.peakHours.morning} db ({morningPct}%)
                  </span>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${morningPct}%` }}
                  />
                </div>
              </div>

              <div className={styles.peakItem}>
                <div className={styles.peakHeader}>
                  <span className={styles.peakLabel}>
                    {adminContent.reports.charts.afternoon}
                  </span>
                  <span className={styles.peakCount}>
                    {metrics.peakHours.afternoon} db ({afternoonPct}%)
                  </span>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${afternoonPct}%` }}
                  />
                </div>
              </div>

              <div className={styles.peakItem}>
                <div className={styles.peakHeader}>
                  <span className={styles.peakLabel}>
                    {adminContent.reports.charts.evening}
                  </span>
                  <span className={styles.peakCount}>
                    {metrics.peakHours.evening} db ({eveningPct}%)
                  </span>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={`${styles.progressFill} ${styles.progressFillHighlight}`}
                    style={{ width: `${eveningPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Booking Type Ratio Breakdown */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h2 className={styles.chartTitle}>
                {adminContent.reports.charts.bookingTypes}
              </h2>
              <TrendingUp size={18} color="var(--smoke)" aria-hidden />
            </div>

            <div className={styles.ratioBox}>
              <div className={styles.ratioItem}>
                <span className={styles.ratioValue}>
                  {seasonPct}%
                </span>
                <span className={styles.ratioLabel}>
                  {adminContent.reports.charts.seasonPassLabel} (
                  {metrics.seasonPassBookingCount} db)
                </span>
              </div>
              <div
                style={{
                  width: 1,
                  background: "var(--stone)",
                  alignSelf: "stretch",
                }}
              />
              <div className={styles.ratioItem}>
                <span className={styles.ratioValue}>
                  {oneTimePct}%
                </span>
                <span className={styles.ratioLabel}>
                  {adminContent.reports.charts.oneTimeLabel} (
                  {metrics.oneTimeBookingCount} db)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className={styles.panel}>
        <div className={styles.chartHeader}>
          <h2 className={styles.panelTitle}>
            {adminContent.reports.recent.title}
          </h2>
        </div>

        {metrics.recentBookings.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyBody}>
              {adminContent.reports.recent.empty}
            </p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Pálya</th>
                  <th className={styles.th}>Időpont</th>
                  <th className={styles.th}>Foglaló</th>
                  <th className={styles.th}>Típus</th>
                  <th className={styles.th}>Összeg</th>
                  <th className={styles.th}>Státusz</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentBookings.map((b) => (
                  <tr key={b.id} className={styles.tr}>
                    <td className={`${styles.td} ${styles.tdStrong}`}>
                      {b.courtNumber}. pálya
                    </td>
                    <td className={styles.td}>
                      {b.startsAt.slice(0, 10)}{" "}
                      <span style={{ color: "var(--smoke)", fontSize: "0.75rem" }}>
                        ({b.startsAt.slice(11, 16)} – {b.endsAt.slice(11, 16)})
                      </span>
                    </td>
                    <td className={styles.td}>
                      <strong>{b.userName}</strong>{" "}
                      <span style={{ color: "var(--smoke)", fontSize: "0.75rem" }}>
                        ({b.userEmail})
                      </span>
                    </td>
                    <td className={styles.td}>
                      {b.bookingType === "season_pass" ? (
                        <span className={styles.badgeSeason}>Bérletes</span>
                      ) : (
                        <span className={styles.badgeOneTime}>Alkalmi</span>
                      )}
                    </td>
                    <td className={`${styles.td} ${styles.tdStrong}`}>
                      {b.priceHuf != null
                        ? `${b.priceHuf.toLocaleString("hu-HU")} Ft`
                        : "Bérlet"}
                    </td>
                    <td className={styles.td}>
                      {b.status === "confirmed" ? (
                        <span className={styles.badgeConfirmed}>
                          <CheckCircle2 size={12} aria-hidden />
                          Megerősítve
                        </span>
                      ) : (
                        <span className={styles.badgeCancelled}>Lemondva</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Mail,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import {
  getCoachDashboard,
  deactivateSeries,
  addSeriesException,
  removeSeriesException,
  getSeriesExceptions,
  addCoachedPlayer,
  removeCoachedPlayer,
} from "@/actions/coach";
import { getCourts, type CourtOption } from "@/actions/booking";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  DAY_OF_WEEK_LABELS,
  type CoachDashboardData,
  type CoachPlayer,
  type RecurringBookingException,
  type RecurringBookingSeries,
} from "@/types/coach";

import { IntervalBookingWizard } from "./IntervalBookingWizard";
import { PlayerPicker } from "./PlayerPicker";
import styles from "./coach.module.css";

type TabId = "series" | "players" | "stats";

export function CoachDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("series");
  const [dashboard, setDashboard] = useState<CoachDashboardData | null>(null);
  const [courts, setCourts] = useState<CourtOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadDashboard();

    const supabase = createClient();

    // Check user & role immediately in browser
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        window.location.href = "/";
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (prof?.role !== "coach" && prof?.role !== "admin") {
        window.location.href = "/";
      }
    });

    // Listen to auth state changes (e.g. login/logout in another window or tab)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        window.location.href = "/";
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (prof?.role !== "coach" && prof?.role !== "admin") {
        window.location.href = "/";
      }
    });

    // Also check on tab focus or visibility change
    const handleFocus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/";
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (prof?.role !== "coach" && prof?.role !== "admin") {
        window.location.href = "/";
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    const [dashResult, courtsResult] = await Promise.all([
      getCoachDashboard(),
      getCourts(),
    ]);
    if (!dashResult.success) {
      window.location.href = "/";
      return;
    }
    setDashboard(dashResult.data);
    if (courtsResult.success) {
      setCourts(courtsResult.data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <p style={{ textAlign: "center", color: "var(--smoke)", padding: "3rem 0" }}>
          Betöltés...
        </p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className={styles.dashboard}>
        <p className={styles.errorMessage}>{error ?? "Hiba történt."}</p>
      </div>
    );
  }

  const activePlayers = dashboard.players.filter((p) => p.status === "accepted");
  const pendingPlayers = dashboard.players.filter((p) => p.status === "pending");

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <GraduationCap className={styles.headerIcon} />
          <h1 className={styles.title}>Edzői felület</h1>
          {dashboard.coachTitle ? (
            <span className={styles.coachTitle}>{dashboard.coachTitle}</span>
          ) : null}
        </div>
        <p className={styles.subtitle}>
          Ismétlődő foglalások, játékosok és statisztikák kezelése
        </p>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Aktív sorozatok</span>
          <span className={styles.metricValue}>{dashboard.series.length}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Aktív játékosok</span>
          <span className={styles.metricValue}>{activePlayers.length}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Függőben lévő felkérések</span>
          <span className={styles.metricValue}>{pendingPlayers.length}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Közelgő edzések</span>
          <span className={styles.metricValue}>{dashboard.upcomingBookingCount}</span>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={cn(styles.tab, activeTab === "series" && styles.tabActive)}
          onClick={() => setActiveTab("series")}
        >
          <Calendar className={styles.tabIcon} />
          Edzések ({dashboard.series.length})
        </button>
        <button
          type="button"
          className={cn(styles.tab, activeTab === "players" && styles.tabActive)}
          onClick={() => setActiveTab("players")}
        >
          <Users className={styles.tabIcon} />
          Játékosaim ({activePlayers.length})
          {pendingPlayers.length > 0 ? (
            <span style={{
              marginLeft: "0.35rem",
              padding: "0.1rem 0.45rem",
              borderRadius: "9999px",
              background: "#fef08a",
              color: "#854d0e",
              fontSize: "0.7rem",
              fontWeight: 700,
            }}>
              {pendingPlayers.length}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          className={cn(styles.tab, activeTab === "stats" && styles.tabActive)}
          onClick={() => setActiveTab("stats")}
        >
          <BarChart3 className={styles.tabIcon} />
          Statisztikák
        </button>
      </div>

      <div className={styles.panel}>
        {activeTab === "series" ? (
          <SeriesPanel
            series={dashboard.series}
            courts={courts}
            players={dashboard.players}
            onRefresh={loadDashboard}
          />
        ) : null}
        {activeTab === "players" ? (
          <PlayersPanel
            players={dashboard.players}
            onRefresh={loadDashboard}
          />
        ) : null}
        {activeTab === "stats" ? (
          <StatsPanel />
        ) : null}
      </div>
    </div>
  );
}

/* ==========================================
   Series Panel (Beautified Interval Booking)
   ========================================== */

function formatHungarianDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const monthNames = [
    "jan.", "febr.", "márc.", "ápr.", "máj.", "jún.",
    "júl.", "aug.", "szept.", "okt.", "nov.", "dec."
  ];
  const dayNames = [
    "Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"
  ];
  return `${d.getFullYear()}. ${monthNames[d.getMonth()]} ${d.getDate()}. (${dayNames[d.getDay()]})`;
}

function getUpcomingOccurrences(s: RecurringBookingSeries, count = 10): string[] {
  const dates: string[] = [];
  const now = new Date();
  const yNow = now.getFullYear();
  const mNow = String(now.getMonth() + 1).padStart(2, "0");
  const dNow = String(now.getDate()).padStart(2, "0");
  const today = `${yNow}-${mNow}-${dNow}`;

  const startFromStr = s.effectiveFrom > today ? s.effectiveFrom : today;
  const [fy, fm, fd] = startFromStr.split("-").map(Number);
  const [uy, um, ud] = s.effectiveUntil.split("-").map(Number);
  const from = new Date(fy, fm - 1, fd, 12, 0, 0);
  const until = new Date(uy, um - 1, ud, 12, 0, 0);

  const cur = new Date(from);
  while (cur <= until && dates.length < count) {
    if (cur.getDay() === s.dayOfWeek) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, "0");
      const d = String(cur.getDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function SeriesPanel({
  series,
  courts,
  players = [],
  onRefresh,
}: {
  series: RecurringBookingSeries[];
  courts: CourtOption[];
  players?: CoachPlayer[];
  onRefresh: () => void;
}) {
  const [showWizard, setShowWizard] = useState(false);
  const [seriesSuccess, setSeriesSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Exception management state
  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);
  const [exceptions, setExceptions] = useState<RecurringBookingException[]>([]);
  const [newExceptionDate, setNewExceptionDate] = useState("");
  const [loadingExceptions, setLoadingExceptions] = useState(false);

  const courtMap = new Map(courts.map((c) => [c.id, c.name]));

  const handleDeactivate = (seriesId: string) => {
    if (!confirm("Biztosan törli ezt az ismétlődő foglalási sorozatot?")) return;
    startTransition(async () => {
      const result = await deactivateSeries(seriesId);
      if (result.success) {
        onRefresh();
      }
    });
  };

  const handleExpandExceptions = async (seriesId: string) => {
    if (expandedSeriesId === seriesId) {
      setExpandedSeriesId(null);
      return;
    }
    setExpandedSeriesId(seriesId);
    setLoadingExceptions(true);
    const result = await getSeriesExceptions(seriesId);
    if (result.success) {
      setExceptions(result.data);
    }
    setLoadingExceptions(false);
  };

  const handleAddException = (seriesId: string, dateToExclude?: string) => {
    const targetDate = dateToExclude || newExceptionDate;
    if (!targetDate) return;
    startTransition(async () => {
      const result = await addSeriesException(seriesId, targetDate);
      if (result.success) {
        if (!dateToExclude) setNewExceptionDate("");
        const excResult = await getSeriesExceptions(seriesId);
        if (excResult.success) setExceptions(excResult.data);
        onRefresh();
      }
    });
  };

  const handleRemoveException = (exceptionId: string, seriesId: string) => {
    startTransition(async () => {
      const result = await removeSeriesException(exceptionId);
      if (result.success) {
        const excResult = await getSeriesExceptions(seriesId);
        if (excResult.success) setExceptions(excResult.data);
        onRefresh();
      }
    });
  };

  return (
    <>
      {seriesSuccess ? (
        <div
          className={styles.successMessage}
          style={{
            marginBottom: "1rem",
            padding: "0.85rem 1.15rem",
            borderRadius: "14px",
            background: "#f0fdf4",
            border: "1.5px solid #bbf7d0",
            color: "#166534",
            fontSize: "0.85rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{seriesSuccess}</span>
          <button
            type="button"
            onClick={() => setSeriesSuccess(null)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#166534",
              padding: "0.2rem",
            }}
          >
            ✕
          </button>
        </div>
      ) : null}

      {!showWizard ? (
        <div className={styles.buttonRow} style={{ marginBottom: "1.25rem" }}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              setSeriesSuccess(null);
              setShowWizard(true);
            }}
          >
            <Plus size={16} />
            Új ismétlődő foglalás (intervallum)
          </button>
        </div>
      ) : null}

      {showWizard ? (
        <IntervalBookingWizard
          courts={courts}
          players={players}
          onSuccess={(msg) => {
            setShowWizard(false);
            setSeriesSuccess(msg);
            onRefresh();
          }}
          onCancel={() => setShowWizard(false)}
        />
      ) : null}

      {series.length === 0 ? (
        <div className={styles.card}>
          <p className={styles.cardEmpty}>
            Még nincs aktív ismétlődő foglalása. Hozzon létre egyet az „Új ismétlődő foglalás” gombra kattintva!
          </p>
        </div>
      ) : (
        <div className={styles.seriesList}>
          {series.map((s) => {
            const courtNames = (s.courtIds ?? [])
              .map((id) => courtMap.get(id) || "Pálya")
              .join(", ");

            const upcomingDates = getUpcomingOccurrences(s);

            return (
              <div key={s.id}>
                <div className={styles.seriesItem}>
                  <div className={styles.seriesInfo}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span className={styles.seriesTitle}>
                        {s.title || "Névtelen edzés sorozat"}
                      </span>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0.15rem 0.55rem",
                        borderRadius: "9999px",
                        background: "var(--warm-taupe)",
                        border: "1px solid var(--stone)",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}>
                        {DAY_OF_WEEK_LABELS[s.dayOfWeek]}
                      </span>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0.15rem 0.55rem",
                        borderRadius: "9999px",
                        background: "var(--warm-taupe)",
                        border: "1px solid var(--stone)",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "var(--graphite)",
                      }}>
                        {s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem", flexWrap: "wrap", fontSize: "0.75rem", color: "var(--smoke)" }}>
                      <span><strong>Pályák:</strong> {courtNames || "Nincs kijelölt pálya"}</span>
                      <span>•</span>
                      <span><strong>Időszak:</strong> {s.effectiveFrom} → {s.effectiveUntil}</span>
                    </div>
                  </div>

                  <div className={styles.seriesActions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => handleExpandExceptions(s.id)}
                      style={{ fontSize: "0.75rem", padding: "0.35rem 0.85rem" }}
                    >
                      {expandedSeriesId === s.id ? "Alkalmak bezárása" : "Alkalmak és szüneteltetés"}
                    </button>
                    <button
                      type="button"
                      className={cn(styles.iconButton, styles.iconButtonDanger)}
                      title="Sorozat deaktiválása"
                      onClick={() => handleDeactivate(s.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {expandedSeriesId === s.id ? (
                  <div className={styles.card} style={{ marginTop: "0.5rem", background: "var(--eggshell)" }}>
                    <h4 className={styles.cardTitle}>Közelgő edzésalkalmak és szüneteltetés</h4>
                    <p style={{ fontSize: "0.78rem", color: "var(--smoke)", margin: "-0.25rem 0 0.75rem" }}>
                      Egyetlen kattintással kihagyhatja az adott heti alkalmat (felszabadítva a pályát), vagy visszaállíthatja a korábban kihagyott alkalmat.
                    </p>
                    {loadingExceptions ? (
                      <p style={{ color: "var(--smoke)", fontSize: "0.8rem" }}>Betöltés...</p>
                    ) : (
                      <>
                        <div className={styles.occasionList}>
                          {upcomingDates.map((occDate) => {
                            const exc = exceptions.find((e) => e.excludedDate === occDate);
                            const isExcluded = Boolean(exc);
                            return (
                              <div
                                key={occDate}
                                className={cn(
                                  styles.occasionItem,
                                  isExcluded && styles.occasionItemExcluded,
                                )}
                              >
                                <div className={styles.occasionItemLeft}>
                                  <span className={styles.occasionDate}>
                                    {formatHungarianDate(occDate)}
                                  </span>
                                  <span className={styles.occasionTime}>
                                    {s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)}
                                  </span>
                                  <span
                                    className={cn(
                                      styles.occasionStatus,
                                      isExcluded
                                        ? styles.occasionStatusExcluded
                                        : styles.occasionStatusActive,
                                    )}
                                  >
                                    {isExcluded ? "Kihagyva / Szünetel" : "Aktív edzés"}
                                  </span>
                                </div>

                                <div>
                                  {isExcluded && exc ? (
                                    <button
                                      type="button"
                                      className={cn(styles.occasionActionBtn, styles.occasionActionBtnRestore)}
                                      disabled={isPending}
                                      onClick={() => handleRemoveException(exc.id, s.id)}
                                    >
                                      Visszaállítás
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className={cn(styles.occasionActionBtn, styles.occasionActionBtnSkip)}
                                      disabled={isPending}
                                      onClick={() => handleAddException(s.id, occDate)}
                                    >
                                      Alkalom kihagyása
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Fallback / Custom date addition */}
                        <details style={{ marginTop: "1rem", fontSize: "0.78rem" }}>
                          <summary style={{ cursor: "pointer", color: "var(--smoke)", fontWeight: 500 }}>
                            Egyedi dátum megadása kézzel...
                          </summary>
                          <div className={styles.addForm} style={{ marginTop: "0.5rem" }}>
                            <div className={styles.field}>
                              <label className={styles.fieldLabel}>Dátum kihagyása</label>
                              <input
                                type="date"
                                className={styles.fieldInput}
                                value={newExceptionDate}
                                onChange={(e) => setNewExceptionDate(e.target.value)}
                              />
                            </div>
                            <button
                              type="button"
                              className={styles.primaryButton}
                              disabled={!newExceptionDate || isPending}
                              onClick={() => handleAddException(s.id)}
                            >
                              Kihagyás rögzítése
                            </button>
                          </div>
                        </details>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ==========================================
   Players Panel (Search Registered Users & Acceptance)
   ========================================== */

function PlayersPanel({
  players,
  onRefresh,
}: {
  players: CoachPlayer[];
  onRefresh: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [showManualEmail, setShowManualEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activePlayers = players.filter((p) => p.status === "accepted");
  const pendingPlayers = players.filter((p) => p.status === "pending");
  const declinedPlayers = players.filter((p) => p.status === "declined");

  const handleManualAdd = () => {
    if (!email.trim()) return;

    startTransition(async () => {
      setAddError(null);
      setAddSuccess(null);
      const result = await addCoachedPlayer(email.trim());
      if (!result.success) {
        setAddError(result.error);
        return;
      }
      setAddSuccess(
        `Meghívás sikeresen elküldve (${result.data.playerName ?? email}). A felkérés a játékos elfogadására vár.`,
      );
      setEmail("");
      onRefresh();
    });
  };

  const handleRemove = (id: string, name: string | null) => {
    if (!confirm(`Biztosan eltávolítja a listából: ${name ?? "ezt a játékost"}?`)) return;
    startTransition(async () => {
      await removeCoachedPlayer(id);
      onRefresh();
    });
  };

  return (
    <>
      <div className={styles.buttonRow} style={{ marginBottom: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => setShowPicker(!showPicker)}
        >
          <UserPlus size={16} />
          Játékos meghívása felhasználókból
        </button>

        <button
          type="button"
          className={styles.manualEmailToggleBtn}
          onClick={() => setShowManualEmail(!showManualEmail)}
        >
          {showManualEmail ? "E-mailes beviteli mező elrejtése" : "Közvetlen meghívás e-mail címmel"}
        </button>
      </div>

      {showPicker ? (
        <PlayerPicker
          onInvited={() => {
            setShowPicker(false);
            onRefresh();
          }}
          onClose={() => setShowPicker(false)}
        />
      ) : null}

      {showManualEmail ? (
        <div className={styles.card} style={{ marginBottom: "1.5rem" }}>
          <h3 className={styles.cardTitle}>Közvetlen meghívás e-mail cím alapján</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--smoke)", margin: "-0.25rem 0 1rem" }}>
            Adja meg egy regisztrált felhasználó e-mail címét a közvetlen meghíváshoz:
          </p>
          <div className={styles.addForm}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Regisztrált e-mail cím</label>
              <input
                type="email"
                className={styles.fieldInput}
                placeholder="jatekos@email.hu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleManualAdd();
                }}
              />
            </div>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={isPending || !email.trim()}
              onClick={handleManualAdd}
            >
              <Mail size={16} />
              Meghívó küldése
            </button>
          </div>
          {addError ? <p className={styles.errorMessage}>{addError}</p> : null}
          {addSuccess ? <p className={styles.successMessage}>{addSuccess}</p> : null}
        </div>
      ) : null}

      {/* Pending invitations section */}
      {pendingPlayers.length > 0 ? (
        <div className={styles.card} style={{ marginBottom: "1.5rem", border: "1.5px solid #fef08a", background: "#fefce8" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <h3 className={styles.cardTitle} style={{ color: "#854d0e", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={16} />
              Függőben lévő felkérések ({pendingPlayers.length})
            </h3>
            <span style={{ fontSize: "0.75rem", color: "#854d0e" }}>
              A játékosnak el kell fogadnia a meghívást
            </span>
          </div>

          <div className={styles.playerList}>
            {pendingPlayers.map((p) => (
              <div key={p.id} className={styles.playerItem} style={{ background: "#ffffff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "2.25rem",
                    height: "2.25rem",
                    borderRadius: "9999px",
                    background: "#fef08a",
                    color: "#854d0e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                  }}>
                    {p.playerName
                      ? p.playerName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                      : "J"}
                  </div>
                  <div className={styles.playerInfo}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className={styles.playerName}>
                        {p.playerName ?? "Regisztrált játékos"}
                      </span>
                      <span className={styles.badgePending}>
                        <Clock size={10} />
                        Várakozás elfogadásra
                      </span>
                    </div>
                    <span className={styles.playerEmail}>
                      {p.playerEmail ?? "—"} {p.playerPhone ? `• ${p.playerPhone}` : ""}
                    </span>
                  </div>
                </div>
                <div className={styles.playerActions}>
                  <button
                    type="button"
                    className={cn(styles.iconButton, styles.iconButtonDanger)}
                    title="Meghívás visszavonása"
                    onClick={() => handleRemove(p.id, p.playerName)}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Active players section */}
      <div className={styles.card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <h3 className={styles.cardTitle} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={16} color="#16a34a" />
            Aktív játékosaim ({activePlayers.length})
          </h3>
        </div>

        {activePlayers.length === 0 ? (
          <p className={styles.cardEmpty}>
            Még nincs aktív játékosa. Kattintson a fenti „Játékos meghívása felhasználókból” gombra a játékosok kiválasztásához!
          </p>
        ) : (
          <div className={styles.playerList}>
            {activePlayers.map((p) => (
              <div key={p.id} className={styles.playerItem}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "2.25rem",
                    height: "2.25rem",
                    borderRadius: "9999px",
                    background: "var(--stone)",
                    color: "var(--ink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                  }}>
                    {p.playerName
                      ? p.playerName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                      : "J"}
                  </div>
                  <div className={styles.playerInfo}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className={styles.playerName}>
                        {p.playerName ?? "Névtelen játékos"}
                      </span>
                      <span className={styles.badgeAccepted}>
                        <CheckCircle2 size={10} />
                        Aktív
                      </span>
                    </div>
                    <span className={styles.playerEmail}>
                      {p.playerEmail ?? "—"} {p.playerPhone ? `• ${p.playerPhone}` : ""}
                    </span>
                  </div>
                </div>
                <div className={styles.playerActions}>
                  <button
                    type="button"
                    className={cn(styles.iconButton, styles.iconButtonDanger)}
                    title="Játékos eltávolítása"
                    onClick={() => handleRemove(p.id, p.playerName)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Declined players (if any) */}
      {declinedPlayers.length > 0 ? (
        <div className={styles.card} style={{ marginTop: "1rem", opacity: 0.85 }}>
          <h4 className={styles.cardTitle} style={{ fontSize: "0.85rem", color: "var(--smoke)" }}>
            Elutasított felkérések ({declinedPlayers.length})
          </h4>
          <div className={styles.playerList}>
            {declinedPlayers.map((p) => (
              <div key={p.id} className={styles.playerItem}>
                <div className={styles.playerInfo}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className={styles.playerName}>
                      {p.playerName ?? "Játékos"}
                    </span>
                    <span className={styles.badgeDeclined}>Elutasítva</span>
                  </div>
                  <span className={styles.playerEmail}>{p.playerEmail ?? "—"}</span>
                </div>
                <div className={styles.playerActions}>
                  <button
                    type="button"
                    className={cn(styles.iconButton, styles.iconButtonDanger)}
                    title="Eltávolítás"
                    onClick={() => handleRemove(p.id, p.playerName)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ==========================================
   Stats Panel (Work in Progress)
   ========================================== */

function StatsPanel() {
  return (
    <div className={styles.card} style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
      <div
        style={{
          width: "3.75rem",
          height: "3.75rem",
          borderRadius: "9999px",
          background: "var(--warm-taupe)",
          border: "1px solid var(--stone)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem",
          color: "var(--smoke)",
        }}
      >
        <BarChart3 size={28} />
      </div>
      <h3
        className={styles.cardTitle}
        style={{ justifyContent: "center", marginBottom: "0.5rem", fontSize: "1.15rem" }}
      >
        Fejlesztés alatt
      </h3>
      <p
        style={{
          color: "var(--smoke)",
          fontSize: "0.875rem",
          maxWidth: "440px",
          margin: "0 auto",
          lineHeight: 1.6,
        }}
      >
        A részletes játékos-statisztikák és edzésnapló funkció jelenleg fejlesztés alatt áll.
        Hamarosan elérhetővé válik a statisztikai modul!
      </p>
    </div>
  );
}



"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Info,
  Layers,
  RefreshCw,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";

import { createRecurringSeries, type CreateSeriesInput } from "@/actions/coach";
import {
  checkRecurringAvailability,
  materializeRecurringBookings,
  type CheckRecurringAvailabilityResult,
} from "@/actions/coach-booking";
import type { CourtOption } from "@/actions/booking";
import { COURT_LAYOUT } from "@/lib/booking/constants";
import {
  DAY_OF_WEEK_LABELS,
  type CoachPlayer,
  type DayOfWeek,
} from "@/types/coach";
import { cn } from "@/lib/utils";
import styles from "./coach.module.css";

type IntervalBookingWizardProps = {
  courts: CourtOption[];
  players?: CoachPlayer[];
  onSuccess: (message: string) => void;
  onCancel: () => void;
};

const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
];

const DAYS: Array<{ id: DayOfWeek; short: string; label: string }> = [
  { id: 1, short: "Hét", label: "Hétfő" },
  { id: 2, short: "Ked", label: "Kedd" },
  { id: 3, short: "Sze", label: "Szerda" },
  { id: 4, short: "Csü", label: "Csütörtök" },
  { id: 5, short: "Pén", label: "Péntek" },
  { id: 6, short: "Szo", label: "Szombat" },
  { id: 0, short: "Vas", label: "Vasárnap" },
];

function formatHungarianDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const monthNames = [
    "jan.", "febr.", "márc.", "ápr.", "máj.", "jún.",
    "júl.", "aug.", "szept.", "okt.", "nov.", "dec.",
  ];
  const dayNames = [
    "Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat",
  ];
  return `${d.getFullYear()}. ${monthNames[d.getMonth()]} ${d.getDate()}. (${dayNames[d.getDay()]})`;
}

export function IntervalBookingWizard({
  courts,
  players = [],
  onSuccess,
  onCancel,
}: IntervalBookingWizardProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  // Step 1: Date & Time states
  const [title, setTitle] = useState("Heti edzés");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const [effectiveFrom, setEffectiveFrom] = useState(todayStr);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(() => {
    const [fy, fm, fd] = todayStr.split("-").map(Number);
    return new Date(fy, fm - 1, fd, 12, 0, 0).getDay() as DayOfWeek;
  });

  const [effectiveUntil, setEffectiveUntil] = useState(() => {
    const [fy, fm, fd] = todayStr.split("-").map(Number);
    const d = new Date(fy, fm - 1 + 3, fd, 12, 0, 0);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });

  const handleEffectiveFromChange = (newFrom: string) => {
    setEffectiveFrom(newFrom);
    setOccasionCourtOverrides({});
    if (newFrom && /^\d{4}-\d{2}-\d{2}$/.test(newFrom)) {
      const [fy, fm, fd] = newFrom.split("-").map(Number);
      const d = new Date(fy, fm - 1, fd, 12, 0, 0);
      setDayOfWeek(d.getDay() as DayOfWeek);
    }
  };

  const handleDayOfWeekChange = (targetDay: DayOfWeek) => {
    setDayOfWeek(targetDay);
    setOccasionCourtOverrides({});
    // If effectiveFrom is set, snap effectiveFrom forward to match targetDay if it doesn't already
    if (effectiveFrom && /^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) {
      const [fy, fm, fd] = effectiveFrom.split("-").map(Number);
      const cur = new Date(fy, fm - 1, fd, 12, 0, 0);
      if (cur.getDay() !== targetDay) {
        while (cur.getDay() !== targetDay) {
          cur.setDate(cur.getDate() + 1);
        }
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, "0");
        const d = String(cur.getDate()).padStart(2, "0");
        setEffectiveFrom(`${y}-${m}-${d}`);
      }
    }
  };

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  // Step 2 & 3: Court selection & per-occasion conflict management
  const [selectedBaseCourtIds, setSelectedBaseCourtIds] = useState<string[]>([]);
  const [occasionCourtOverrides, setOccasionCourtOverrides] = useState<Record<string, string[]>>({});
  const [skippedDateKeys, setSkippedDateKeys] = useState<string[]>([]);

  // Availability query state
  const [availabilityData, setAvailabilityData] = useState<CheckRecurringAvailabilityResult | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [showAllOccasions, setShowAllOccasions] = useState(false);

  // Compute all occasion dates matching dayOfWeek in the range
  const allOccasionDates = useMemo(() => {
    try {
      if (!effectiveFrom || !effectiveUntil) return [];
      const [fy, fm, fd] = effectiveFrom.split("-").map(Number);
      const [uy, um, ud] = effectiveUntil.split("-").map(Number);
      const from = new Date(fy, fm - 1, fd, 12, 0, 0);
      const until = new Date(uy, um - 1, ud, 12, 0, 0);
      if (until < from) return [];

      const dates: string[] = [];
      const cur = new Date(from);
      while (cur <= until) {
        if (cur.getDay() === dayOfWeek) {
          const y = cur.getFullYear();
          const m = String(cur.getMonth() + 1).padStart(2, "0");
          const d = String(cur.getDate()).padStart(2, "0");
          dates.push(`${y}-${m}-${d}`);
        }
        cur.setDate(cur.getDate() + 1);
      }
      return dates;
    } catch {
      return [];
    }
  }, [effectiveFrom, effectiveUntil, dayOfWeek]);

  // Fetch availability whenever dateKeys or time window change
  const loadAvailability = useCallback(async () => {
    if (allOccasionDates.length === 0 || endTime <= startTime) {
      setAvailabilityData(null);
      return;
    }
    setIsLoadingAvailability(true);
    const result = await checkRecurringAvailability({
      dateKeys: allOccasionDates,
      startTime,
      endTime,
    });
    if (result.success) {
      setAvailabilityData(result.data);
    } else {
      console.error("[IntervalBookingWizard] Availability error:", result.error);
    }
    setIsLoadingAvailability(false);
  }, [allOccasionDates, startTime, endTime]);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  // Map of dateKey -> availability
  const availabilityByDate = useMemo(() => {
    const map = new Map<string, { available: Set<string>; busy: Set<string> }>();
    if (!availabilityData) return map;
    for (const occ of availabilityData.occasions) {
      map.set(occ.dateKey, {
        available: new Set(occ.availableCourtIds),
        busy: new Set(occ.busyCourtIds),
      });
    }
    return map;
  }, [availabilityData]);

  // Court availability summary across all occasions in the range
  const courtSummary = useMemo(() => {
    const summary = new Map<
      string,
      { freeCount: number; busyCount: number; isAlwaysFree: boolean; isAlwaysBusy: boolean }
    >();

    const totalOccasions = allOccasionDates.length;
    for (const court of courts) {
      let freeCount = 0;
      let busyCount = 0;

      for (const dateKey of allOccasionDates) {
        const occ = availabilityByDate.get(dateKey);
        if (occ) {
          if (occ.available.has(court.id)) freeCount++;
          else busyCount++;
        } else {
          freeCount++;
        }
      }

      summary.set(court.id, {
        freeCount,
        busyCount,
        isAlwaysFree: totalOccasions > 0 && freeCount === totalOccasions,
        isAlwaysBusy: totalOccasions > 0 && busyCount === totalOccasions,
      });
    }

    return summary;
  }, [courts, allOccasionDates, availabilityByDate]);

  // Default initial court selection when availability loads if none selected
  useEffect(() => {
    if (selectedBaseCourtIds.length === 0 && courts.length > 0 && availabilityData) {
      // Find the first court that is always free, or at least free on the first occasion
      const firstOccasion = allOccasionDates[0];
      const occAvail = firstOccasion ? availabilityByDate.get(firstOccasion) : null;

      const firstFree = courts.find((c) => {
        const s = courtSummary.get(c.id);
        if (s?.isAlwaysFree) return true;
        if (occAvail?.available.has(c.id)) return true;
        return false;
      });

      if (firstFree) {
        setSelectedBaseCourtIds([firstFree.id]);
      }
    }
  }, [availabilityData, courts, selectedBaseCourtIds.length, allOccasionDates, availabilityByDate, courtSummary]);

  // Players
  const activePlayers = useMemo(
    () => players.filter((p) => p.status === "accepted"),
    [players],
  );

  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId],
    );
  };

  const handleSelectAllPlayers = () => {
    if (selectedPlayerIds.length === activePlayers.length) {
      setSelectedPlayerIds([]);
    } else {
      setSelectedPlayerIds(activePlayers.map((p) => p.playerId));
    }
  };

  const handleApplyPreset = (months: number) => {
    const [fy, fm, fd] = (effectiveFrom || todayStr).split("-").map(Number);
    const until = new Date(fy, fm - 1 + months, fd, 12, 0, 0);
    const y = until.getFullYear();
    const m = String(until.getMonth() + 1).padStart(2, "0");
    const d = String(until.getDate()).padStart(2, "0");
    setEffectiveUntil(`${y}-${m}-${d}`);
    setOccasionCourtOverrides({});
  };

  const handleSetSeasonEnd = () => {
    const [fy] = (effectiveFrom || todayStr).split("-").map(Number);
    setEffectiveUntil(`${fy}-10-31`);
    setOccasionCourtOverrides({});
  };

  // Court toggle in Step 2
  const handleBaseCourtToggle = (courtId: string) => {
    const summary = courtSummary.get(courtId);
    // Disallow choosing courts that are completely busy on all occasions
    if (summary?.isAlwaysBusy) {
      return;
    }

    setSelectedBaseCourtIds((prev) => {
      const next = prev.includes(courtId)
        ? prev.filter((id) => id !== courtId)
        : [...prev, courtId];
      return next;
    });

    // Reset occasion overrides when base courts are changed
    setOccasionCourtOverrides({});
  };

  // Calculate detailed status for each occasion
  const occasionStatuses = useMemo(() => {
    return allOccasionDates.map((dateKey, index) => {
      const isSkipped = skippedDateKeys.includes(dateKey);
      const assignedCourtIds = occasionCourtOverrides[dateKey] ?? selectedBaseCourtIds;
      const occAvail = availabilityByDate.get(dateKey);

      const conflicts: string[] = [];
      if (!isSkipped && occAvail) {
        for (const cId of assignedCourtIds) {
          if (occAvail.busy.has(cId)) {
            conflicts.push(cId);
          }
        }
      }

      // Available alternative courts for this date (excluding currently assigned)
      const availableAlternatives = courts.filter((c) => {
        if (assignedCourtIds.includes(c.id)) return false;
        if (!occAvail) return true;
        return occAvail.available.has(c.id);
      });

      const isResolved = conflicts.length === 0 || isSkipped;

      return {
        occasionIndex: index + 1,
        dateKey,
        isSkipped,
        assignedCourtIds,
        conflictingCourtIds: conflicts,
        isResolved,
        availableAlternatives,
        hasOverride: Boolean(occasionCourtOverrides[dateKey]),
      };
    });
  }, [
    allOccasionDates,
    skippedDateKeys,
    occasionCourtOverrides,
    selectedBaseCourtIds,
    availabilityByDate,
    courts,
  ]);

  // Filter occasions that currently have conflicts
  const conflictedOccasions = useMemo(
    () => occasionStatuses.filter((s) => !s.isResolved),
    [occasionStatuses],
  );

  const resolvedConflictCount = useMemo(
    () =>
      occasionStatuses.filter(
        (s) => s.hasOverride && s.isResolved && !s.isSkipped,
      ).length,
    [occasionStatuses],
  );

  // Handle replacing a conflicting court on a specific occasion
  const handleReplaceCourtForOccasion = (
    dateKey: string,
    conflictingCourtId: string,
    replacementCourtId: string,
  ) => {
    setOccasionCourtOverrides((prev) => {
      const currentAssigned = prev[dateKey] ?? [...selectedBaseCourtIds];
      const nextAssigned = currentAssigned.map((id) =>
        id === conflictingCourtId ? replacementCourtId : id,
      );
      return {
        ...prev,
        [dateKey]: nextAssigned,
      };
    });
  };

  // Handle skipping an occasion
  const handleToggleSkipOccasion = (dateKey: string) => {
    setSkippedDateKeys((prev) =>
      prev.includes(dateKey)
        ? prev.filter((d) => d !== dateKey)
        : [...prev, dateKey],
    );
  };

  const courtsByNumber = useMemo(() => {
    return new Map(courts.map((c) => [c.number, c]));
  }, [courts]);

  const courtById = useMemo(() => {
    return new Map(courts.map((c) => [c.id, c]));
  }, [courts]);

  // Validation
  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;
    if (selectedBaseCourtIds.length === 0) return false;
    if (endTime <= startTime) return false;
    if (effectiveUntil < effectiveFrom) return false;
    if (allOccasionDates.length === 0) return false;
    if (conflictedOccasions.length > 0) return false;
    return true;
  }, [
    title,
    selectedBaseCourtIds.length,
    endTime,
    startTime,
    effectiveUntil,
    effectiveFrom,
    allOccasionDates.length,
    conflictedOccasions.length,
  ]);

  const handleSubmit = () => {
    if (!canSubmit) {
      if (conflictedOccasions.length > 0) {
        setFormError(
          `Kérjük, oldja fel a fennmaradó ${conflictedOccasions.length} alkalom ütközését a folytatáshoz.`,
        );
      } else if (selectedBaseCourtIds.length === 0) {
        setFormError("Válasszon legalább egy pályát az edzéshez.");
      } else {
        setFormError("Kérjük, ellenőrizze a megadott adatokat.");
      }
      return;
    }

    setFormError(null);

    startTransition(async () => {
      const input: CreateSeriesInput = {
        title: title.trim(),
        dayOfWeek,
        startTime,
        endTime,
        courtIds: selectedBaseCourtIds,
        effectiveFrom,
        effectiveUntil,
        playerIds: selectedPlayerIds,
      };

      const result = await createRecurringSeries(input);
      if (!result.success) {
        setFormError(result.error);
        return;
      }

      // Materialize future bookings with per-occasion court overrides and skipped dates
      const matResult = await materializeRecurringBookings(
        result.data.id,
        effectiveFrom,
        effectiveUntil,
        occasionCourtOverrides,
        skippedDateKeys,
      );

      const msg = matResult.success
        ? `Ismétlődő edzés sikeresen rögzítve! ${matResult.data.createdCount} foglalás generálva a kiválasztott szabad pályákra.`
        : "Ismétlődő edzés létrehozva! (A foglalások generálása a háttérben fut le).";

      onSuccess(msg);
    });
  };

  return (
    <div className={styles.wizardCard}>
      {/* Wizard Header */}
      <div className={styles.wizardHeader}>
        <div className={styles.wizardHeaderTitleRow}>
          <div className={styles.wizardBadge}>
            <Sparkles size={14} className="text-[var(--eon-red)]" />
            <span>Új ismétlődő edzéssorozat</span>
          </div>
          <button
            type="button"
            className={styles.wizardCloseBtn}
            onClick={onCancel}
            title="Mégse"
          >
            <X size={18} />
          </button>
        </div>
        <p className={styles.wizardSubtitle}>
          Válassza ki a heti napot és idősávot, majd a rendszer által ellenőrzött szabad pályák közül foglaljon.
        </p>
      </div>

      {formError ? <div className={styles.errorMessage}>{formError}</div> : null}

      <div className={styles.wizardBody}>
        {/* ==========================================
            Section 1: Date & Time Selection (FIRST)
            ========================================== */}
        <div className={styles.wizardSection}>
          <div className={styles.wizardSectionHeader}>
            <span className={styles.sectionStepNumber}>1</span>
            <div>
              <h4 className={styles.sectionTitle}>Edzés adatai és heti időpontja</h4>
              <p className={styles.sectionDesc}>
                Először adja meg az edzés nevét, a heti edzésnapot, valamint az idősávot és időszakot.
              </p>
            </div>
          </div>

          {/* Title */}
          <div className={styles.field} style={{ marginBottom: "1.25rem" }}>
            <label className={styles.fieldLabel}>Edzés megnevezése</label>
            <input
              type="text"
              className={styles.customInput}
              placeholder="pl. Csütörtöki versenyzői edzés"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Day of Week */}
          <div className={styles.field} style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <label className={styles.fieldLabel} style={{ marginBottom: 0 }}>Heti edzésnap kiválasztása</label>
              <span style={{ fontSize: "0.75rem", color: "var(--smoke)", fontWeight: 500 }}>
                Kijelölve: <strong style={{ color: "var(--ink)" }}>{DAY_OF_WEEK_LABELS[dayOfWeek]}</strong>
              </span>
            </div>
            <div className={styles.dayPillsGrid}>
              {DAYS.map((d) => {
                const isSelected = dayOfWeek === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    className={`${styles.dayPill} ${isSelected ? styles.dayPillActive : ""}`}
                    onClick={() => handleDayOfWeekChange(d.id)}
                  >
                    <span className={styles.dayPillShort}>{d.short}</span>
                    <span className={styles.dayPillFull}>{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Range */}
          <div className={styles.timeRangeGrid} style={{ marginBottom: "1.25rem" }}>
            <div className={styles.timeSelectCard}>
              <div className={styles.timeCardHeader}>
                <Clock size={14} className="text-[var(--eon-red)]" />
                <span>Kezdés időpontja</span>
              </div>
              <select
                className={styles.customSelect}
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setOccasionCourtOverrides({});
                }}
              >
                {TIME_SLOTS.slice(0, -1).map((t) => (
                  <option key={`start-${t}`} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.timeArrow}>
              <ChevronRight size={20} className="text-[var(--ash)]" />
            </div>

            <div className={styles.timeSelectCard}>
              <div className={styles.timeCardHeader}>
                <Clock size={14} className="text-[var(--graphite)]" />
                <span>Befejezés időpontja</span>
              </div>
              <select
                className={styles.customSelect}
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setOccasionCourtOverrides({});
                }}
              >
                {TIME_SLOTS.filter((t) => t > startTime).map((t) => (
                  <option key={`end-${t}`} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range & Duration */}
          <div className={styles.field} style={{ marginBottom: "1.25rem" }}>
            <label className={styles.fieldLabel}>Érvényességi időszak</label>
            <div className={styles.presetChipsRow}>
              <span className={styles.presetLabel}>Gyors választás:</span>
              <button
                type="button"
                className={styles.presetChip}
                onClick={() => handleApplyPreset(1)}
              >
                1 hónap
              </button>
              <button
                type="button"
                className={styles.presetChip}
                onClick={() => handleApplyPreset(3)}
              >
                3 hónap
              </button>
              <button
                type="button"
                className={styles.presetChip}
                onClick={() => handleApplyPreset(6)}
              >
                Fél év
              </button>
              <button
                type="button"
                className={styles.presetChip}
                onClick={handleSetSeasonEnd}
              >
                Szezon vége (Okt 31)
              </button>
            </div>

            <div className={styles.dateGrid}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  Kezdő dátum ({DAY_OF_WEEK_LABELS[dayOfWeek]})
                </label>
                <input
                  type="date"
                  className={styles.customInput}
                  value={effectiveFrom}
                  min={todayStr}
                  onChange={(e) => handleEffectiveFromChange(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Befejező dátum</label>
                <input
                  type="date"
                  className={styles.customInput}
                  value={effectiveUntil}
                  min={effectiveFrom || todayStr}
                  onChange={(e) => {
                    setEffectiveUntil(e.target.value);
                    setOccasionCourtOverrides({});
                  }}
                />
              </div>
            </div>
          </div>

          {/* Estimated Occasions Banner */}
          <div
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "12px",
              background: "var(--warm-taupe)",
              border: "1px solid var(--stone)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.8125rem",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar size={15} className="text-[var(--graphite)]" />
                <span>
                  <strong>{allOccasionDates.length}</strong> edzésalkalom (minden{" "}
                  {DAY_OF_WEEK_LABELS[dayOfWeek].toLowerCase()}, {startTime}–{endTime})
                </span>
              </div>
              {allOccasionDates.length > 0 ? (
                <div style={{ fontSize: "0.75rem", color: "var(--smoke)", paddingLeft: "1.45rem" }}>
                  Alkalmak dátuma:{" "}
                  {allOccasionDates.slice(0, 6).map((d) => {
                    const [y, m, day] = d.split("-");
                    return `${y}. ${m}. ${day}.`;
                  }).join(", ")}
                  {allOccasionDates.length > 6 ? ` és további ${allOccasionDates.length - 6} alkalom` : ""}
                </div>
              ) : (
                <div style={{ fontSize: "0.75rem", color: "#b91c1c", paddingLeft: "1.45rem" }}>
                  A megadott időszakban nincs {DAY_OF_WEEK_LABELS[dayOfWeek].toLowerCase()}i nap!
                </div>
              )}
            </div>
            {isLoadingAvailability ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--smoke)" }}>
                <span className={styles.loadingSpinnerInline} />
                <span>Pályák ellenőrzése...</span>
              </div>
            ) : (
              <span style={{ color: "#166534", fontWeight: 600 }}>Pályafoglaltság ellenőrizve ✓</span>
            )}
          </div>
        </div>

        {/* ==========================================
            Section 2: Interactive Court Selector (Available Only)
            ========================================== */}
        <div className={styles.wizardSection}>
          <div className={styles.wizardSectionHeader}>
            <span className={styles.sectionStepNumber}>2</span>
            <div style={{ flex: 1 }}>
              <h4 className={styles.sectionTitle}>Pályák kiválasztása</h4>
              <p className={styles.sectionDesc}>
                Csak a szabad pályák közül választhat. A zölddel jelölt pályák az összes alkalmon szabadok, a sárgával jelöltek pedig a legtöbb alkalmon elérhetők.
              </p>
            </div>
          </div>

          <div className={styles.courtSchematicWrapper}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <p className={styles.courtSchematicHint} style={{ margin: 0 }}>← Bejárat / Klub felől</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", fontSize: "0.72rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
                  Mindig szabad
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#eab308" }} />
                  Néhány alkalommal foglalt
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626" }} />
                  Végig foglalt
                </span>
              </div>
            </div>

            <div className={styles.courtLayoutRows}>
              {COURT_LAYOUT.map((pair) => (
                <div key={pair.join("-")} className={styles.courtLayoutPair}>
                  {pair.map((courtNum) => {
                    const court = courtsByNumber.get(courtNum);
                    if (!court) return null;

                    const summary = courtSummary.get(court.id);
                    const isSelected = selectedBaseCourtIds.includes(court.id);
                    const isAlwaysBusy = summary?.isAlwaysBusy ?? false;
                    const isAlwaysFree = summary?.isAlwaysFree ?? false;
                    const busyCount = summary?.busyCount ?? 0;

                    return (
                      <button
                        key={court.id}
                        type="button"
                        disabled={isAlwaysBusy}
                        className={cn(
                          styles.interactiveCourtTile,
                          isSelected && styles.interactiveCourtTileActive,
                          isAlwaysBusy && styles.interactiveCourtTileBusy,
                        )}
                        onClick={() => handleBaseCourtToggle(court.id)}
                        aria-pressed={isSelected}
                      >
                        {/* Availability Badge */}
                        {isAlwaysFree ? (
                          <span className={cn(styles.courtTileAvailabilityBadge, styles.courtBadgeFree)}>
                            Szabad
                          </span>
                        ) : isAlwaysBusy ? (
                          <span className={cn(styles.courtTileAvailabilityBadge, styles.courtBadgeBusy)}>
                            Foglalt
                          </span>
                        ) : busyCount > 0 ? (
                          <span className={cn(styles.courtTileAvailabilityBadge, styles.courtBadgePartial)}>
                            {busyCount} ütközés
                          </span>
                        ) : null}

                        <div className={styles.courtSurfaceMini}>
                          <div className={styles.courtLinesDoubles} />
                          <div className={styles.courtLinesSingles} />
                          <div className={styles.courtNetMini} />
                          <span className={styles.courtTileNumber}>{court.number}</span>
                        </div>
                        <div className={styles.courtTileFooter}>
                          <span>{court.name}</span>
                          {isSelected ? (
                            <div className={styles.courtSelectedCheck}>
                              <Check size={11} />
                            </div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {selectedBaseCourtIds.length === 0 ? (
              <p style={{ marginTop: "0.85rem", fontSize: "0.8rem", color: "var(--eon-red)", fontWeight: 500 }}>
                Kérjük, jelöljön ki legalább egy pályát az edzéshez!
              </p>
            ) : null}
          </div>
        </div>

        {/* ==========================================
            Section 3: Per-Occasion Conflict Checking & Resolution
            ========================================== */}
        {selectedBaseCourtIds.length > 0 && allOccasionDates.length > 0 ? (
          <div className={styles.wizardSection}>
            <div className={styles.wizardSectionHeader}>
              <span className={styles.sectionStepNumber}>3</span>
              <div style={{ flex: 1 }}>
                <h4 className={styles.sectionTitle}>Alkalmak ellenőrzése és ütközések kezelése</h4>
                <p className={styles.sectionDesc}>
                  A rendszer minden egyes edzésalkalmat külön megvizsgál. Ha egy adott héten valamelyik pálya már foglalt, itt választhat helyette másik szabad pályát.
                </p>
              </div>
            </div>

            {conflictedOccasions.length > 0 ? (
              <div className={styles.conflictAlertContainer}>
                <div className={styles.conflictBanner}>
                  <AlertTriangle size={18} className="text-[#c2410c] shrink-0" />
                  <div>
                    <strong>Figyelem: {conflictedOccasions.length} alkalommal ütközés van!</strong>
                    <div style={{ fontWeight: 400, fontSize: "0.78rem", marginTop: "0.15rem" }}>
                      Az alábbi alkalmakon a kiválasztott pálya már foglalt. Kérjük, válasszon egy másik elérhető pályát az adott alkalomra!
                    </div>
                  </div>
                </div>

                {/* Conflicted Occasion Cards */}
                {conflictedOccasions.map((occ) => {
                  return (
                    <div key={occ.dateKey} className={styles.conflictCard}>
                      <div className={styles.conflictCardHeader}>
                        <div className={styles.conflictCardTitleGroup}>
                          <span className={styles.conflictOccasionNumber}>
                            {occ.occasionIndex}. alkalom
                          </span>
                          <span className={styles.conflictOccasionDate}>
                            {formatHungarianDate(occ.dateKey)}
                          </span>
                          <span className={styles.conflictOccasionTime}>
                            {startTime}–{endTime}
                          </span>
                        </div>

                        <button
                          type="button"
                          className={styles.skipOccasionSmallBtn}
                          onClick={() => handleToggleSkipOccasion(occ.dateKey)}
                        >
                          {occ.isSkipped ? "Alkalom visszaállítása" : "Alkalom kihagyása"}
                        </button>
                      </div>

                      {occ.conflictingCourtIds.map((badCourtId) => {
                        const badCourt = courtById.get(badCourtId);
                        return (
                          <div key={badCourtId} style={{ marginTop: "0.5rem" }}>
                            <p className={styles.conflictDescription}>
                              ⚠️ A(z) <strong>{badCourt?.name ?? "pálya"}</strong> ezen a napon már foglalt ebben az idősávban.
                            </p>

                            <div className={styles.conflictReplacementPrompt}>
                              <span>Válasszon másik szabad pályát erre a napra:</span>
                            </div>

                            {occ.availableAlternatives.length > 0 ? (
                              <div className={styles.replacementChipsRow}>
                                {occ.availableAlternatives.map((altCourt) => (
                                  <button
                                    key={altCourt.id}
                                    type="button"
                                    className={styles.courtReplacementChip}
                                    onClick={() =>
                                      handleReplaceCourtForOccasion(
                                        occ.dateKey,
                                        badCourtId,
                                        altCourt.id,
                                      )
                                    }
                                  >
                                    <span>{altCourt.name} kiválasztása</span>
                                    <ChevronRight size={12} />
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: "0.78rem", color: "#991b1b", marginBottom: "0.5rem" }}>
                                Sajnos ezen a napon nincs több szabad pálya. Kérjük, hagyja ki ezt az alkalmat a jobb felső gombbal.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.conflictAllResolvedBanner}>
                <CheckCircle2 size={18} className="text-[#16a34a] shrink-0" />
                <div>
                  <strong>Minden edzésalkalom elérhető a kiválasztott pályákon!</strong>
                  <div style={{ fontWeight: 400, fontSize: "0.78rem", marginTop: "0.15rem" }}>
                    Nincs ütközés: mind a(z) {allOccasionDates.length} alkalom zökkenőmentesen lefoglalható.
                    {resolvedConflictCount > 0 ? ` (${resolvedConflictCount} alkalom egyedi alternatív pályával rögzítve)` : ""}
                  </div>
                </div>
              </div>
            )}

            {/* Expandable Overview of All Occasions */}
            <div className={styles.occasionsOverviewCard}>
              <button
                type="button"
                className={styles.occasionsOverviewToggle}
                onClick={() => setShowAllOccasions(!showAllOccasions)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Calendar size={15} />
                  <span>
                    Összes edzésalkalom részletes áttekintése ({allOccasionDates.length} alkalom)
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  style={{
                    transform: showAllOccasions ? "rotate(180deg)" : "none",
                    transition: "transform 0.15s ease",
                  }}
                />
              </button>

              {showAllOccasions ? (
                <div className={styles.occasionsGrid}>
                  {occasionStatuses.map((occ) => {
                    const courtNames = occ.assignedCourtIds
                      .map((id) => courtById.get(id)?.name ?? "Pálya")
                      .join(", ");

                    return (
                      <div key={occ.dateKey} className={styles.occasionRow}>
                        <div className={styles.occasionRowLeft}>
                          <span className={styles.occasionIndex}>#{occ.occasionIndex}</span>
                          <div>
                            <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                              {formatHungarianDate(occ.dateKey)}
                            </span>
                            <span style={{ color: "var(--smoke)", marginLeft: "0.5rem" }}>
                              {startTime}–{endTime}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          {occ.isSkipped ? (
                            <span style={{ color: "#991b1b", fontWeight: 600, fontSize: "0.72rem" }}>
                              Kihagyva
                            </span>
                          ) : (
                            <div className={styles.occasionRowCourts}>
                              <span
                                className={cn(
                                  styles.occasionCourtTag,
                                  occ.hasOverride && styles.occasionCourtTagOverride,
                                )}
                              >
                                {courtNames}
                              </span>
                              {occ.hasOverride ? (
                                <span style={{ fontSize: "0.68rem", color: "#15803d", fontWeight: 600 }}>
                                  (egyedi pálya)
                                </span>
                              ) : null}
                            </div>
                          )}

                          <button
                            type="button"
                            className={styles.skipOccasionSmallBtn}
                            onClick={() => handleToggleSkipOccasion(occ.dateKey)}
                          >
                            {occ.isSkipped ? "Visszaállítás" : "Kihagyás"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* ==========================================
            Section 4: Coached Players (Optional)
            ========================================== */}
        <div className={styles.wizardSection}>
          <div className={styles.wizardSectionHeader}>
            <span className={styles.sectionStepNumber}>4</span>
            <div>
              <h4 className={styles.sectionTitle}>Résztvevő játékosok kijelölése (opcionális)</h4>
              <p className={styles.sectionDesc}>
                Válassza ki a rendszeres edzésre járó játékosokat. Az edzés automatikusan megjelenik a kijelölt játékosok „Edzéseim” felületén.
              </p>
            </div>
          </div>

          {activePlayers.length > 0 ? (
            <>
              <div className={styles.courtActionsRow} style={{ marginTop: "0.25rem" }}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={handleSelectAllPlayers}
                  style={{ fontSize: "0.75rem", padding: "0.3rem 0.75rem" }}
                >
                  {selectedPlayerIds.length === activePlayers.length
                    ? "Kijelölés törlése"
                    : "Mindenki kijelölése"}
                </button>
                <span className={styles.courtCountBadge}>
                  {selectedPlayerIds.length} / {activePlayers.length} játékos kiválasztva
                </span>
              </div>

              <div className={styles.playerSelectGrid}>
                {activePlayers.map((p) => {
                  const isSelected = selectedPlayerIds.includes(p.playerId);
                  return (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        styles.playerSelectCard,
                        isSelected && styles.playerSelectCardSelected,
                      )}
                      onClick={() => handleTogglePlayer(p.playerId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleTogglePlayer(p.playerId);
                        }
                      }}
                    >
                      <span className={styles.playerSelectCheckbox}>
                        {isSelected ? <Check size={12} strokeWidth={3} /> : null}
                      </span>
                      <div className={styles.playerSelectAvatar}>
                        {p.playerAvatarUrl ? (
                          <img
                            src={p.playerAvatarUrl}
                            alt={p.playerName ?? "Játékos"}
                            className={styles.playerSelectAvatarImg}
                          />
                        ) : (
                          <User size={14} className="text-[var(--smoke)]" />
                        )}
                      </div>
                      <div className={styles.playerSelectInfo}>
                        <span className={styles.playerSelectName}>
                          {p.playerName || "Névtelen játékos"}
                        </span>
                        {p.playerEmail ? (
                          <span className={styles.playerSelectEmail}>
                            {p.playerEmail}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div
              style={{
                padding: "1rem",
                borderRadius: "12px",
                background: "var(--warm-taupe)",
                border: "1px solid var(--stone)",
                color: "var(--smoke)",
                fontSize: "0.8125rem",
                lineHeight: 1.5,
              }}
            >
              Még nincs elfogadott játékosa a „Játékosaim” fülön. Az edzés játékosok nélkül is létrehozható most, és később is hozzárendelhet játékosokat.
            </div>
          )}
        </div>

        {/* ==========================================
            Section 5: Live Summary Preview Card
            ========================================== */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <Layers size={16} className="text-[var(--eon-red)]" />
            <h5 className={styles.summaryTitle}>Összegzés és Megerősítés</h5>
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Heti időpont</span>
              <span className={styles.summaryValue}>
                {DAY_OF_WEEK_LABELS[dayOfWeek]}, {startTime} – {endTime}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Alapértelmezett pályák</span>
              <span className={styles.summaryValue}>
                {selectedBaseCourtIds.length > 0
                  ? selectedBaseCourtIds
                      .map((id) => courtById.get(id)?.name)
                      .join(", ")
                  : "Nincs pálya választva"}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Résztvevő játékosok</span>
              <span className={styles.summaryValue}>
                {selectedPlayerIds.length > 0
                  ? `${selectedPlayerIds.length} játékos kijelölve`
                  : "Nincs játékos kijelölve"}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Időszak</span>
              <span className={styles.summaryValue}>
                {effectiveFrom} → {effectiveUntil}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Alkalmak száma</span>
              <span className={styles.summaryValueHighlight}>
                {allOccasionDates.length - skippedDateKeys.length} aktív alkalom
                {skippedDateKeys.length > 0 ? ` (${skippedDateKeys.length} kihagyva)` : ""}
              </span>
            </div>
            {resolvedConflictCount > 0 ? (
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Egyedi pálya beosztás</span>
                <span style={{ fontSize: "0.85rem", color: "#166534", fontWeight: 600 }}>
                  {resolvedConflictCount} alkalommal alternatív pálya
                </span>
              </div>
            ) : null}
          </div>

          <div className={styles.wizardActions}>
            <button
              type="button"
              className={styles.wizardSubmitBtn}
              onClick={handleSubmit}
              disabled={!canSubmit || isPending}
            >
              {isPending
                ? "Létrehozás és foglalás..."
                : conflictedOccasions.length > 0
                ? `${conflictedOccasions.length} ütközés feloldása szükséges`
                : "Ismétlődő edzés létrehozása"}
            </button>
            <button
              type="button"
              className={styles.wizardCancelBtn}
              onClick={onCancel}
              disabled={isPending}
            >
              Mégse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

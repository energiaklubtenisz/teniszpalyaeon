import type { Database } from "./database.types";

// ==========================================
// Coach–Player Relationship
// ==========================================

export type CoachPlayerStatus = "pending" | "accepted" | "declined";

export type CoachPlayer = {
  id: string;
  coachId: string;
  playerId: string;
  status: CoachPlayerStatus;
  createdAt: string;
  respondedAt: string | null;
  /** Joined from profiles for display */
  playerName: string | null;
  playerEmail: string | null;
  playerPhone: string | null;
  playerAvatarUrl: string | null;
};

export type PlayerCandidate = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
};

// ==========================================
// Recurring Booking Series
// ==========================================

/** Day of week: 0 = Sunday, 1 = Monday, ... 6 = Saturday */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  0: "Vasárnap",
  1: "Hétfő",
  2: "Kedd",
  3: "Szerda",
  4: "Csütörtök",
  5: "Péntek",
  6: "Szombat",
} as const;

export type RecurringBookingSeries = {
  id: string;
  coachId: string;
  title: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm" format
  endTime: string; // "HH:mm" format
  courtIds: string[];
  effectiveFrom: string; // "YYYY-MM-DD"
  effectiveUntil: string; // "YYYY-MM-DD"
  isActive: boolean;
  playerIds?: string[];
  createdAt: string;
  /** Joined court info for display */
  courtNames?: string[];
};

export type RecurringBookingException = {
  id: string;
  seriesId: string;
  excludedDate: string; // "YYYY-MM-DD"
  reason: string | null;
  createdAt: string;
};

// ==========================================
// Notifications
// ==========================================

export type NotificationType =
  | "booking_displaced"
  | "coach_assignment"
  | "coach_invitation"
  | "practice_cancelled"
  | "general";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
};

// ==========================================
// Player Statistics
// ==========================================

export type StatType =
  | "attendance"
  | "match_win"
  | "match_loss"
  | "fitness_score"
  | "notes"
  | string; // extensible

export type PlayerStatistic = {
  id: string;
  coachId: string;
  playerId: string;
  statType: StatType;
  statValue: string;
  notes: string | null;
  recordedAt: string;
  createdAt: string;
};

export const STAT_TYPE_LABELS: Record<string, string> = {
  attendance: "Jelenlét",
  match_win: "Meccs győzelem",
  match_loss: "Meccs vereség",
  fitness_score: "Fitnesz pontszám",
  notes: "Megjegyzés",
} as const;

// ==========================================
// Coach Dashboard aggregate types
// ==========================================

export type CoachDashboardData = {
  series: RecurringBookingSeries[];
  players: CoachPlayer[];
  upcomingBookingCount: number;
  coachTitle: string | null;
};

export type CoachPlayerWithStats = CoachPlayer & {
  totalStats: number;
  lastStatDate: string | null;
};

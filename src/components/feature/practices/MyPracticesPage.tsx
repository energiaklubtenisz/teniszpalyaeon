"use client";

import {
  Calendar,
  Check,
  Dumbbell,
  GraduationCap,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { getMyPractices, type CoachPractice } from "@/actions/coach-booking";
import {
  getPendingInvitationsForPlayer,
  respondToCoachInvitation,
  type PendingInvitation,
} from "@/actions/coach";

import styles from "./practices.module.css";

const MONTH_LABELS = [
  "Jan", "Feb", "Már", "Ápr", "Máj", "Jún",
  "Júl", "Aug", "Sze", "Okt", "Nov", "Dec",
];

const WEEKDAY_LABELS = [
  "Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat",
];

export function MyPracticesPage() {
  const [practices, setPractices] = useState<CoachPractice[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ id: string; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [practicesResult, invResult] = await Promise.all([
      getMyPractices(),
      getPendingInvitationsForPlayer(),
    ]);

    if (practicesResult.success) {
      setPractices(practicesResult.data);
    } else {
      setError(practicesResult.error);
    }

    if (invResult.success) {
      setInvitations(invResult.data);
    }

    setLoading(false);
  };

  const handleRespond = (invitationId: string, accept: boolean) => {
    startTransition(async () => {
      const result = await respondToCoachInvitation(invitationId, accept);
      if (result.success) {
        setActionFeedback({
          id: invitationId,
          message: accept
            ? "Sikeresen elfogadta a felkérést!"
            : "Felkérés elutasítva.",
        });
        setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
        // Refresh practices if accepted
        if (accept) {
          const pResult = await getMyPractices();
          if (pResult.success) setPractices(pResult.data);
        }
      }
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <Dumbbell className={styles.headerIcon} />
          <h1 className={styles.title}>Edzéseim</h1>
        </div>
        <p className={styles.subtitle}>
          Az edzői foglalásokat és felkéréseket itt tekintheti meg
        </p>
      </div>

      {actionFeedback ? (
        <div style={{
          marginBottom: "1.5rem",
          padding: "0.75rem 1rem",
          borderRadius: "12px",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          color: "#166534",
          fontSize: "0.85rem",
          fontWeight: 500,
        }}>
          {actionFeedback.message}
        </div>
      ) : null}

      {invitations.length > 0 ? (
        <div className={styles.invitationSection}>
          <span className={styles.invitationSectionTitle}>
            Függőben lévő edzői felkérések ({invitations.length})
          </span>
          {invitations.map((inv) => (
            <div key={inv.id} className={styles.invitationCard}>
              <div className={styles.invitationLeft}>
                <div className={styles.invitationAvatar}>
                  {inv.coachAvatarUrl ? (
                    <img
                      src={inv.coachAvatarUrl}
                      alt={inv.coachName}
                      className={styles.invitationAvatarImg}
                    />
                  ) : (
                    inv.coachName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  )}
                </div>
                <div className={styles.invitationContent}>
                  <div className={styles.invitationBadge}>
                    <Sparkles size={12} />
                    Új edzői felkérés
                  </div>
                  <h3 className={styles.invitationTitle}>
                    {inv.coachName}
                    {inv.coachTitle ? ` (${inv.coachTitle})` : ""}
                  </h3>
                  <p className={styles.invitationDesc}>
                    Az edző felkérte Önt a játékosai közé. Elfogadást követően az edző edzéseket ütemezhet Önnek és rögzítheti a fejlődését.
                  </p>
                </div>
              </div>
              <div className={styles.invitationActions}>
                <button
                  type="button"
                  className={styles.acceptBtn}
                  disabled={isPending}
                  onClick={() => handleRespond(inv.id, true)}
                >
                  <Check size={14} />
                  Elfogadás
                </button>
                <button
                  type="button"
                  className={styles.declineBtn}
                  disabled={isPending}
                  onClick={() => handleRespond(inv.id, false)}
                >
                  <X size={14} />
                  Elutasítás
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {loading ? (
        <p className={styles.loading}>Betöltés...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : practices.length === 0 ? (
        <div className={styles.empty}>
          <Calendar className={styles.emptyIcon} />
          <p>Nincs közelgő edzés.</p>
          <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
            Ha edző rendelt Önt játékosának, itt fognak megjelenni az edzések.
          </p>
        </div>
      ) : (
        <div className={styles.practiceList}>
          {practices.map((practice) => {
            const date = new Date(practice.startsAt);
            const day = date.getDate();
            const month = MONTH_LABELS[date.getMonth()];
            const weekday = WEEKDAY_LABELS[date.getDay()];
            const startTime = practice.startsAt.slice(11, 16);
            const endTime = practice.endsAt.slice(11, 16);

            return (
              <div key={practice.id} className={styles.practiceCard}>
                <div className={styles.practiceDate}>
                  <span className={styles.practiceDateDay}>{day}</span>
                  <span className={styles.practiceDateMonth}>{month}</span>
                  <span className={styles.practiceDateWeekday}>{weekday}</span>
                </div>
                <div className={styles.practiceInfo}>
                  <span className={styles.practiceTitle}>
                    {practice.seriesTitle ?? "Edzés"}
                  </span>
                  <span className={styles.practiceTime}>
                    {startTime}–{endTime}
                  </span>
                  <span className={styles.practiceMeta}>
                    {practice.courtName}
                  </span>
                  {practice.coachName ? (
                    <span className={styles.practiceCoach}>
                      <GraduationCap className={styles.practiceCoachIcon} />
                      {practice.coachName}
                      {practice.coachTitle ? ` (${practice.coachTitle})` : ""}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

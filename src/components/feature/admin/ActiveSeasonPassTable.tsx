"use client";

import { useState, useTransition } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  AlertCircle,
  X,
} from "lucide-react";

import { revokeSeasonPass, type SeasonPassHolder } from "@/actions/admin";
import { adminContent } from "@/content/admin";

import styles from "./admin.module.css";

type ActiveSeasonPassTableProps = {
  holders: SeasonPassHolder[];
  onRevoked?: () => void;
};

export function ActiveSeasonPassTable({
  holders,
  onRevoked,
}: ActiveSeasonPassTableProps) {
  const { table, revokeSuccess, revokeError } = adminContent.seasonPass;
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredHolders = holders.filter((h) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const emailMatch = h.email.toLowerCase().includes(q);
    const nameMatch = h.fullName ? h.fullName.toLowerCase().includes(q) : false;
    const phoneMatch = h.phone ? h.phone.includes(q) : false;
    return emailMatch || nameMatch || phoneMatch;
  });

  const handleRevoke = (holder: SeasonPassHolder) => {
    if (confirmingId !== holder.id) {
      setConfirmingId(holder.id);
      return;
    }

    setConfirmingId(null);
    setFeedback(null);

    startTransition(async () => {
      const result = await revokeSeasonPass(holder.id);
      if (!result.success) {
        setFeedback({
          type: "error",
          message: result.error || revokeError,
        });
      } else {
        setFeedback({
          type: "success",
          message: revokeSuccess.replace("{email}", result.data.email),
        });
        onRevoked?.();
      }
    });
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("hu-HU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <section
      className={styles.panel}
      aria-labelledby="active-season-pass-table-heading"
    >
      <div className={styles.tableToolbar}>
        <div>
          <h2
            id="active-season-pass-table-heading"
            className={styles.panelTitle}
          >
            {adminContent.seasonPass.sectionTitle}
          </h2>
        </div>

        {holders.length > 0 && (
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} aria-hidden />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={adminContent.seasonPass.searchPlaceholder}
              className={styles.searchInput}
              aria-label="Keresés bérletesek között"
            />
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={
            feedback.type === "success"
              ? styles.alertSuccess
              : styles.alertError
          }
          role={feedback.type === "error" ? "alert" : "status"}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={16} aria-hidden />
          ) : (
            <AlertCircle size={16} aria-hidden />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {holders.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>{table.empty.title}</h3>
          <p className={styles.emptyBody}>{table.empty.body}</p>
        </div>
      ) : filteredHolders.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyBody}>{table.empty.noResults}</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col" className={styles.th}>
                  {table.columns.name}
                </th>
                <th scope="col" className={styles.th}>
                  {table.columns.email}
                </th>
                <th scope="col" className={styles.th}>
                  {table.columns.phone}
                </th>
                <th scope="col" className={styles.th}>
                  {table.columns.status}
                </th>
                <th scope="col" className={styles.th}>
                  {table.columns.addedAt}
                </th>
                <th scope="col" className={styles.th}>
                  {table.columns.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredHolders.map((holder) => {
                const isConfirming = confirmingId === holder.id;
                return (
                  <tr key={holder.id} className={styles.tr}>
                    <td className={`${styles.td} ${styles.tdStrong}`}>
                      {holder.fullName || "—"}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.emailText}>{holder.email}</span>
                    </td>
                    <td className={styles.td}>{holder.phone || "—"}</td>
                    <td className={styles.td}>
                      {holder.isRegistered ? (
                        <span className={styles.badgeActive}>
                          <CheckCircle2 size={12} aria-hidden />
                          {table.status.active}
                        </span>
                      ) : (
                        <span className={styles.badgePending}>
                          <Clock size={12} aria-hidden />
                          {table.status.pending}
                        </span>
                      )}
                    </td>
                    <td className={styles.td}>
                      {formatDate(holder.createdAt)}
                    </td>
                    <td className={styles.td}>
                      {isConfirming ? (
                        <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                          <button
                            type="button"
                            onClick={() => handleRevoke(holder)}
                            disabled={isPending}
                            className={`${styles.revokeBtn} ${styles.revokeBtnConfirm}`}
                            title="Megerősítés: bérlet visszavonása"
                          >
                            <Trash2 size={12} aria-hidden />
                            <span>Megerősítés</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            disabled={isPending}
                            className={styles.revokeBtn}
                            title="Mégsem"
                          >
                            <X size={12} aria-hidden />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRevoke(holder)}
                          disabled={isPending}
                          className={styles.revokeBtn}
                        >
                          <Trash2 size={12} aria-hidden />
                          <span>{table.actions.revoke}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

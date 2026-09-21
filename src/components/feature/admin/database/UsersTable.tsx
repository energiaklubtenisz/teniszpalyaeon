"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Shield, ShieldAlert, User, Search, Ticket } from "lucide-react";

import {
  updateUserRole,
  toggleUserSeasonPassByEmail,
  type AdminUser,
} from "@/actions/admin";
import { adminContent } from "@/content/admin";
import styles from "../admin.module.css";

type UsersTableProps = {
  users: AdminUser[];
  onMutated?: () => void;
};

export function UsersTable({ users, onMutated }: UsersTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "member">("all");
  const [passFilter, setPassFilter] = useState<"all" | "with" | "without">("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      // Search
      const matchSearch =
        !q ||
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // Role filter
      if (roleFilter !== "all" && u.role !== roleFilter) return false;

      // Pass filter
      if (passFilter === "with" && !u.activeSeasonPass) return false;
      if (passFilter === "without" && u.activeSeasonPass) return false;

      return true;
    });
  }, [users, search, roleFilter, passFilter]);

  const handleRoleChange = (userId: string, targetRole: "member" | "admin") => {
    if (!window.confirm(adminContent.database.users.actions.confirmRoleChange)) {
      return;
    }

    setPendingUserId(userId);
    setFeedback(null);

    startTransition(async () => {
      const res = await updateUserRole(userId, targetRole);
      setPendingUserId(null);
      if (res.success) {
        setFeedback({
          type: "success",
          message: `A felhasználó szerepköre sikeresen módosítva: ${targetRole === "admin" ? "Adminisztrátor" : "Tag"}.`,
        });
        onMutated?.();
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    });
  };

  const handlePassToggle = (userId: string, email: string | null, active: boolean) => {
    if (!email) {
      setFeedback({ type: "error", message: "A felhasználóhoz nem tartozik email cím." });
      return;
    }

    setPendingUserId(userId);
    setFeedback(null);

    startTransition(async () => {
      const res = await toggleUserSeasonPassByEmail(email, active);
      setPendingUserId(null);
      if (res.success) {
        setFeedback({
          type: "success",
          message: active
            ? `Bérlet sikeresen aktiválva: ${email}`
            : `Bérlet sikeresen visszavonva: ${email}`,
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
            placeholder={adminContent.database.users.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterRow}>
          <select
            className={styles.filterSelect}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            aria-label="Szerepkör szűrő"
          >
            <option value="all">{adminContent.database.users.filters.allRoles}</option>
            <option value="admin">{adminContent.database.users.filters.onlyAdmin}</option>
            <option value="member">{adminContent.database.users.filters.onlyMember}</option>
          </select>

          <select
            className={styles.filterSelect}
            value={passFilter}
            onChange={(e) => setPassFilter(e.target.value as typeof passFilter)}
            aria-label="Bérlet szűrő"
          >
            <option value="all">{adminContent.database.users.filters.allPass}</option>
            <option value="with">{adminContent.database.users.filters.withPass}</option>
            <option value="without">{adminContent.database.users.filters.withoutPass}</option>
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
              <th className={styles.th}>{adminContent.database.users.columns.name}</th>
              <th className={styles.th}>{adminContent.database.users.columns.email}</th>
              <th className={styles.th}>{adminContent.database.users.columns.phone}</th>
              <th className={styles.th}>{adminContent.database.users.columns.role}</th>
              <th className={styles.th}>{adminContent.database.users.columns.seasonPass}</th>
              <th className={styles.th}>{adminContent.database.users.columns.bookings}</th>
              <th className={styles.th}>{adminContent.database.users.columns.createdAt}</th>
              <th className={styles.th}>{adminContent.database.users.columns.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.td}>
                  <div className={styles.emptyState}>
                    <p className={styles.emptyBody}>{adminContent.database.users.empty}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isUserPending = isPending && pendingUserId === user.id;
                const createdDate = new Date(user.createdAt).toLocaleDateString("hu-HU", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                });

                return (
                  <tr key={user.id} className={styles.tr}>
                    <td className={`${styles.td} ${styles.tdStrong}`}>
                      {user.fullName || "—"}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.emailText}>{user.email || "—"}</span>
                    </td>
                    <td className={styles.td}>{user.phone || "—"}</td>
                    <td className={styles.td}>
                      {user.role === "admin" ? (
                        <span className={styles.badgeAdmin}>
                          <Shield size={12} style={{ marginRight: 4 }} aria-hidden />
                          Admin
                        </span>
                      ) : (
                        <span className={styles.badgeMember}>
                          <User size={12} style={{ marginRight: 4 }} aria-hidden />
                          Tag
                        </span>
                      )}
                    </td>
                    <td className={styles.td}>
                      {user.activeSeasonPass ? (
                        <span className={styles.badgeActive}>
                          <Check size={12} aria-hidden />
                          Bérletes
                        </span>
                      ) : (
                        <span className={styles.badgeMember}>Nincs</span>
                      )}
                    </td>
                    <td className={`${styles.td} ${styles.tdStrong}`}>
                      {user.totalBookings} db
                    </td>
                    <td className={styles.td}>{createdDate}</td>
                    <td className={styles.td}>
                      <div className={styles.actionBtnGroup}>
                        {user.role === "admin" ? (
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            disabled={isUserPending}
                            onClick={() => handleRoleChange(user.id, "member")}
                            title={adminContent.database.users.actions.removeAdmin}
                          >
                            <ShieldAlert size={14} aria-hidden />
                            <span>Jog elvétele</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles.actionBtn}
                            disabled={isUserPending}
                            onClick={() => handleRoleChange(user.id, "admin")}
                            title={adminContent.database.users.actions.makeAdmin}
                          >
                            <Shield size={14} aria-hidden />
                            <span>Legyen Admin</span>
                          </button>
                        )}

                        {user.activeSeasonPass ? (
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            disabled={isUserPending || !user.email}
                            onClick={() => handlePassToggle(user.id, user.email, false)}
                            title={adminContent.database.users.actions.revokePass}
                          >
                            <Ticket size={14} aria-hidden />
                            <span>Bérlet megvonás</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles.actionBtn}
                            disabled={isUserPending || !user.email}
                            onClick={() => handlePassToggle(user.id, user.email, true)}
                            title={adminContent.database.users.actions.givePass}
                          >
                            <Ticket size={14} aria-hidden />
                            <span>Bérlet adás</span>
                          </button>
                        )}
                      </div>
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Users } from "lucide-react";

import type { AdminBooking, AdminUser } from "@/actions/admin";
import { adminContent } from "@/content/admin";
import { UsersTable } from "./UsersTable";
import { BookingsTable } from "./BookingsTable";
import styles from "../admin.module.css";

type AdminDatabaseViewProps = {
  users: AdminUser[];
  bookings: AdminBooking[];
};

export function AdminDatabaseView({ users, bookings }: AdminDatabaseViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"users" | "bookings">("users");

  const refreshData = () => {
    router.refresh();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <header className={styles.header}>
        <h1 className={styles.title}>{adminContent.database.title}</h1>
        <p className={styles.support}>{adminContent.database.support}</p>
      </header>

      {/* Sub-tabs for switching between Users and Bookings */}
      <div className={styles.tabsRow}>
        <div className={styles.subTabs} role="tablist" aria-label="Adatbázis nézetek">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "users"}
            className={`${styles.subTabBtn} ${
              activeTab === "users" ? styles.subTabBtnActive : ""
            }`}
            onClick={() => setActiveTab("users")}
          >
            <Users size={16} aria-hidden />
            <span>{adminContent.database.tabs.users}</span>
            <span className={styles.tabBadge}>{users.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "bookings"}
            className={`${styles.subTabBtn} ${
              activeTab === "bookings" ? styles.subTabBtnActive : ""
            }`}
            onClick={() => setActiveTab("bookings")}
          >
            <Calendar size={16} aria-hidden />
            <span>{adminContent.database.tabs.bookings}</span>
            <span className={styles.tabBadge}>{bookings.length}</span>
          </button>
        </div>
      </div>

      {activeTab === "users" ? (
        <UsersTable users={users} onMutated={refreshData} />
      ) : (
        <BookingsTable bookings={bookings} onMutated={refreshData} />
      )}
    </div>
  );
}

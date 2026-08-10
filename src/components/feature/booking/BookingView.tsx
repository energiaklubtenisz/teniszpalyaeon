"use client";

import { useState } from "react";
import Link from "next/link";

import type { CourtOption } from "@/actions/booking";
import { booking } from "@/content/booking";

import { BookingWizard } from "./BookingWizard";
import styles from "./booking.module.css";

type BookingViewProps = {
  courts: CourtOption[];
  isAuthenticated: boolean;
  bookerName: string | null;
};

export function BookingView({
  courts,
  isAuthenticated,
  bookerName,
}: BookingViewProps) {
  const [succeeded, setSucceeded] = useState(false);

  return (
    <div className={styles.workspace}>
      <header className={styles.workspaceHeader}>
        <div>
          <p className={styles.workspaceEyebrow}>Foglalási rendszer</p>
          <h1 className={styles.workspaceTitle}>
            {succeeded ? booking.steps.confirm.success : booking.title}
          </h1>
          <p className={styles.workspaceLead}>
            {succeeded ? booking.steps.confirm.successBody : booking.lead}
          </p>
        </div>
        {succeeded ? (
          <div className={styles.successActions}>
            <Link href="/" className={styles.secondaryButton}>
              {booking.steps.confirm.home}
            </Link>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setSucceeded(false)}
            >
              {booking.steps.confirm.another}
            </button>
            <Link href={booking.help.href} className={styles.helpTextLink}>
              {booking.steps.confirm.help}
            </Link>
          </div>
        ) : null}
      </header>

      {!succeeded ? (
        <BookingWizard
          courts={courts}
          isAuthenticated={isAuthenticated}
          bookerName={bookerName}
          onSuccess={() => setSucceeded(true)}
        />
      ) : null}
    </div>
  );
}

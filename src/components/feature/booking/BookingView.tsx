"use client";

import { useState } from "react";
import Link from "next/link";

import type { CourtOption } from "@/actions/booking";
import { PageBanner } from "@/components/feature/chrome/PageBanner";
import { booking } from "@/content/booking";
import { assets } from "@/lib/assets";

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
    <>
      <PageBanner
        title={succeeded ? booking.steps.confirm.success : booking.title}
        lead={succeeded ? booking.steps.confirm.successBody : booking.lead}
        imageSrc={succeeded ? undefined : assets.pages.booking}
        imageAlt={succeeded ? undefined : "Pályafoglalás hangulatkép"}
      >
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
      </PageBanner>
      {!succeeded ? (
        <div className={styles.inner}>
          <BookingWizard
            courts={courts}
            isAuthenticated={isAuthenticated}
            bookerName={bookerName}
            onSuccess={() => setSucceeded(true)}
          />
        </div>
      ) : null}
    </>
  );
}

import { redirect } from "next/navigation";

import {
  getBookingSession,
  getCourts,
} from "@/actions/booking";
import { PageBanner } from "@/components/feature/chrome/PageBanner";
import { booking } from "@/content/booking";
import { assets } from "@/lib/assets";

import { BookingView } from "./BookingView";
import styles from "./booking.module.css";

export async function BookingPage() {
  const [courtsResult, session] = await Promise.all([
    getCourts(),
    getBookingSession(),
  ]);

  if (!session.isAuthenticated) {
    redirect("/login");
  }

  if (!courtsResult.success) {
    return (
      <main className={styles.page}>
        <PageBanner
          title={booking.title}
          lead={booking.lead}
          imageSrc={assets.pages.booking}
          imageAlt="Pályafoglalás"
        />
        <div className={styles.inner}>
          <p className={styles.loadError}>{courtsResult.error}</p>
        </div>
      </main>
    );
  }

  if (courtsResult.data.length === 0) {
    return (
      <main className={styles.page}>
        <PageBanner
          title={booking.title}
          lead={booking.lead}
          imageSrc={assets.pages.booking}
          imageAlt="Pályafoglalás"
        />
        <div className={styles.inner}>
          <p className={styles.loadError}>{booking.loadError.empty}</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <BookingView
        courts={courtsResult.data}
        isAuthenticated={session.isAuthenticated}
        bookerName={session.fullName}
      />
    </main>
  );
}

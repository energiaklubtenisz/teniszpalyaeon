import Link from "next/link";

import type { UserBooking } from "@/actions/booking";
import { buttonVariants } from "@/components/ui/button";
import { myBookings } from "@/content/my-bookings";
import { cn } from "@/lib/utils";

import { BookingCard } from "./BookingCard";
import styles from "./my-bookings.module.css";

type MyBookingsPageProps = {
  upcoming: UserBooking[];
  past: UserBooking[];
  bookerName: string | null;
  loadError?: string | null;
};

export function MyBookingsPage({
  upcoming,
  past,
  bookerName,
  loadError = null,
}: MyBookingsPageProps) {
  const isEmpty = upcoming.length === 0 && past.length === 0;

  return (
    <main className={styles.page}>
      <div className={styles.section}>
        <h1 className={styles.title}>{myBookings.title}</h1>
        <p className={styles.support}>{myBookings.support}</p>

        {loadError ? (
          <p className={styles.error} role="alert">
            {loadError}
          </p>
        ) : null}

        {!loadError && isEmpty ? (
          <div className={styles.empty}>
            <h2 className={styles.emptyTitle}>{myBookings.empty.title}</h2>
            <p className={styles.emptyBody}>{myBookings.empty.body}</p>
            <Link
              href={myBookings.empty.href}
              className={cn(buttonVariants({ size: "lg" }), styles.emptyCta)}
            >
              {myBookings.empty.cta}
            </Link>
          </div>
        ) : null}

        {!loadError && upcoming.length > 0 ? (
          <section className={styles.listSection} aria-labelledby="upcoming-heading">
            <h2 id="upcoming-heading" className={styles.sectionTitle}>
              {myBookings.sections.upcoming}
            </h2>
            <ul className={styles.list}>
              {upcoming.map((booking) => (
                <li key={booking.id}>
                  <BookingCard booking={booking} bookerName={bookerName} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!loadError && past.length > 0 ? (
          <section className={styles.listSection} aria-labelledby="past-heading">
            <h2 id="past-heading" className={styles.sectionTitle}>
              {myBookings.sections.past}
            </h2>
            <ul className={styles.list}>
              {past.map((booking) => (
                <li key={booking.id}>
                  <BookingCard
                    booking={booking}
                    bookerName={bookerName}
                    muted
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}

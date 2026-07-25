import { PageBanner } from "@/components/feature/chrome/PageBanner";
import { booking } from "@/content/booking";

import styles from "./booking.module.css";

export async function BookingPage() {
  return (
    <main className={styles.page}>
      <PageBanner title={booking.title} lead={booking.lead} />
    </main>
  );
}

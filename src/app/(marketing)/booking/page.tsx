import type { Metadata } from "next";

import { BookingPage } from "@/components/feature/booking/BookingPage";
import { booking } from "@/content/booking";

export const metadata: Metadata = {
  title: booking.title,
  description: booking.lead,
};

export default function BookingRoute() {
  return <BookingPage />;
}

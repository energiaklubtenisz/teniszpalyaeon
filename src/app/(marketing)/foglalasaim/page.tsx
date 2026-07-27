import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getUserBookings } from "@/actions/booking";
import { MyBookingsPage } from "@/components/feature/my-bookings/MyBookingsPage";
import { myBookings } from "@/content/my-bookings";
import { nowInBudapest } from "@/lib/booking/time";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: myBookings.title,
  description: myBookings.support,
};

export default async function MyBookingsRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [bookingsResult, profileResult] = await Promise.all([
    getUserBookings(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const bookerName = profileResult.data?.full_name?.trim() || null;

  if (!bookingsResult.success) {
    return (
      <MyBookingsPage
        upcoming={[]}
        past={[]}
        bookerName={bookerName}
        loadError={bookingsResult.error}
      />
    );
  }

  const now = nowInBudapest().getTime();
  const upcoming = bookingsResult.data.filter(
    (booking) => new Date(booking.startsAt).getTime() >= now,
  );
  const past = bookingsResult.data
    .filter((booking) => new Date(booking.startsAt).getTime() < now)
    .reverse();

  return (
    <MyBookingsPage
      upcoming={upcoming}
      past={past}
      bookerName={bookerName}
    />
  );
}

import type { Metadata } from "next";

import { getAdminBookingsData, getAdminUsersData } from "@/actions/admin";
import { AdminDatabaseView } from "@/components/feature/admin/database/AdminDatabaseView";

export const metadata: Metadata = {
  title: "Adatbázis — Energia Szabadidősport Klub",
  description: "Felhasználói fiókok és pályafoglalások adminisztrációja.",
};

export default async function AdminDatabasePage() {
  const [usersResult, bookingsResult] = await Promise.all([
    getAdminUsersData(),
    getAdminBookingsData(),
  ]);

  if (!usersResult.success) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-3xl items-center justify-center px-6 py-12">
        <p className="text-center text-lg text-[var(--eon-red)]">
          {usersResult.error}
        </p>
      </div>
    );
  }

  if (!bookingsResult.success) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-3xl items-center justify-center px-6 py-12">
        <p className="text-center text-lg text-[var(--eon-red)]">
          {bookingsResult.error}
        </p>
      </div>
    );
  }

  return (
    <AdminDatabaseView
      users={usersResult.data}
      bookings={bookingsResult.data}
    />
  );
}

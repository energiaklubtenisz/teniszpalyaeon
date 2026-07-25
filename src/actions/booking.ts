"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  buildWindow,
  budapestDateKey,
  calculateOneTimePriceHuf,
  isDateKeyBookable,
  isHalfHourAligned,
  isSlotInPast,
  isValidBookingRange,
  type TimeLabel,
} from "@/lib/booking/time";
import { createClient } from "@/lib/supabase/server";
import {
  actionError,
  actionSuccess,
  type ActionResult,
} from "@/types/action-result";
import type { Database } from "@/types/database.types";

export type CourtOption = {
  id: string;
  number: number;
  name: string;
};

export type BusyInterval = {
  startsAt: string;
  endsAt: string;
};

const timeLabelSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):(00|30)$/, "Érvénytelen időpont");

const createBookingSchema = z.object({
  courtId: z.string().uuid(),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startLabel: timeLabelSchema,
  endLabel: timeLabelSchema,
  bookingType: z.enum(["season_pass", "one_time"]),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export async function getCourts(): Promise<ActionResult<CourtOption[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courts")
    .select("id, number, name")
    .eq("is_active", true)
    .order("number", { ascending: true });

  if (error) {
    return actionError("Nem sikerült betölteni a pályákat.");
  }

  return actionSuccess(data ?? []);
}

export async function getCourtAvailability(
  courtId: string,
  dateKey: string,
): Promise<ActionResult<BusyInterval[]>> {
  if (!z.string().uuid().safeParse(courtId).success) {
    return actionError("Érvénytelen pálya.");
  }
  if (!isDateKeyBookable(dateKey)) {
    return actionError("Ez a nap nem foglalható.");
  }

  const dayStart = buildWindow(dateKey, "08:00", "08:00").startsAt;
  const dayEnd = buildWindow(dateKey, "20:00", "20:00").startsAt;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("starts_at, ends_at")
    .eq("court_id", courtId)
    .eq("status", "confirmed")
    .lt("starts_at", dayEnd.toISOString())
    .gt("ends_at", dayStart.toISOString());

  if (error) {
    return actionError("Nem sikerült betölteni a foglaltságot.");
  }

  return actionSuccess(
    (data ?? []).map((row) => ({
      startsAt: row.starts_at,
      endsAt: row.ends_at,
    })),
  );
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Érvénytelen foglalási adatok.");
  }

  const { courtId, dateKey, startLabel, endLabel, bookingType } = parsed.data;
  const start = startLabel as TimeLabel;
  const end = endLabel as TimeLabel;

  if (!isDateKeyBookable(dateKey)) {
    return actionError("Csak ma és a következő 30 nap foglalható.");
  }
  if (!isValidBookingRange(start, end)) {
    return actionError(
      "Az idősáv legalább 1 óra legyen, :00 vagy :30 határokkal, 8:00–20:00 között.",
    );
  }
  if (isSlotInPast(dateKey, start)) {
    return actionError("Elmúlt időpontot nem lehet foglalni.");
  }

  const { startsAt, endsAt } = buildWindow(dateKey, start, end);
  if (!isHalfHourAligned(startsAt) || !isHalfHourAligned(endsAt)) {
    return actionError("Az időpontoknak :00 vagy :30-ra kell esniük.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return actionError("A foglaláshoz be kell jelentkeznie.");
  }

  const insertRow: Database["public"]["Tables"]["bookings"]["Insert"] = {
    court_id: courtId,
    user_id: user.id,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    booking_type: bookingType,
    status: "confirmed",
    price_huf:
      bookingType === "one_time" ? calculateOneTimePriceHuf(start, end) : null,
  };

  const { data, error } = await supabase
    .from("bookings")
    .insert(insertRow)
    .select("id")
    .single();

  if (error) {
    if (
      error.code === "23P01" ||
      error.message.toLowerCase().includes("overlap")
    ) {
      return actionError("Ez az idősáv már foglalt. Válasszon másik időt.");
    }
    return actionError("Nem sikerült a foglalás. Próbálja újra.");
  }

  revalidatePath("/booking");
  return actionSuccess({ id: data.id });
}

export async function getBookingSession(): Promise<{
  isAuthenticated: boolean;
  todayKey: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    isAuthenticated: Boolean(user),
    todayKey: budapestDateKey(),
  };
}

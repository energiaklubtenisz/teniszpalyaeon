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

export type CourtAvailability = {
  courtId: string;
  available: boolean;
};

const timeLabelSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):(00|30)$/, "Érvénytelen időpont");

const guestNameSchema = z
  .string()
  .trim()
  .min(2, "Adja meg a játékos nevét")
  .max(80);

const createBookingSchema = z
  .object({
    courtId: z.string().uuid(),
    dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startLabel: timeLabelSchema,
    endLabel: timeLabelSchema,
    bookingType: z.enum(["season_pass", "one_time"]),
    playerCount: z.union([z.literal(2), z.literal(4)]),
    guestPlayerNames: z.array(guestNameSchema),
  })
  .superRefine((value, ctx) => {
    const expected = value.playerCount - 1;
    if (value.guestPlayerNames.length !== expected) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Pontosan ${expected} játékos nevét adja meg.`,
        path: ["guestPlayerNames"],
      });
    }
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

export async function getCourtsAvailabilityForWindow(
  dateKey: string,
  startLabel: string,
  endLabel: string,
): Promise<ActionResult<CourtAvailability[]>> {
  if (!isDateKeyBookable(dateKey)) {
    return actionError("Ez a nap nem foglalható.");
  }

  const start = startLabel as TimeLabel;
  const end = endLabel as TimeLabel;

  if (!isValidBookingRange(start, end)) {
    return actionError(
      "Az idősáv legalább 1 óra legyen, :00 vagy :30 határokkal, 8:00–20:00 között (késői kezdésnél legfeljebb 21:00).",
    );
  }
  if (isSlotInPast(dateKey, start)) {
    return actionError("Elmúlt időpontot nem lehet foglalni.");
  }

  const { startsAt, endsAt } = buildWindow(dateKey, start, end);
  const supabase = await createClient();

  const [{ data: courts, error: courtsError }, { data: busy, error: busyError }] =
    await Promise.all([
      supabase
        .from("courts")
        .select("id")
        .eq("is_active", true)
        .order("number", { ascending: true }),
      supabase
        .from("bookings")
        .select("court_id, starts_at, ends_at")
        .eq("status", "confirmed")
        .lt("starts_at", endsAt.toISOString())
        .gt("ends_at", startsAt.toISOString()),
    ]);

  if (courtsError || busyError) {
    return actionError("Nem sikerült betölteni a foglaltságot.");
  }

  const busyCourtIds = new Set((busy ?? []).map((row) => row.court_id));

  return actionSuccess(
    (courts ?? []).map((court) => ({
      courtId: court.id,
      available: !busyCourtIds.has(court.id),
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

  const {
    courtId,
    dateKey,
    startLabel,
    endLabel,
    bookingType,
    playerCount,
    guestPlayerNames,
  } = parsed.data;
  const start = startLabel as TimeLabel;
  const end = endLabel as TimeLabel;

  if (!isDateKeyBookable(dateKey)) {
    return actionError("Csak ma és a következő 30 nap foglalható.");
  }
  if (!isValidBookingRange(start, end)) {
    return actionError(
      "Az idősáv legalább 1 óra legyen, :00 vagy :30 határokkal, 8:00–20:00 között (késői kezdésnél legfeljebb 21:00).",
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
    player_count: playerCount,
    guest_player_names: guestPlayerNames,
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
  fullName: string | null;
  todayKey: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isAuthenticated: false,
      fullName: null,
      todayKey: budapestDateKey(),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    isAuthenticated: true,
    fullName: profile?.full_name?.trim() || null,
    todayKey: budapestDateKey(),
  };
}

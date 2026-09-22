"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCoach } from "@/lib/auth/require-coach";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  actionError,
  actionSuccess,
  type ActionResult,
} from "@/types/action-result";
import { createNotification } from "./notification";

// ==========================================
// COACH BOOKING (single)
// ==========================================

const coachBookingSchema = z.object({
  courtIds: z.array(z.string().uuid()).min(1, "Válasszon legalább egy pályát"),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  recurringSeriesId: z.string().uuid().optional(),
  playerIds: z.array(z.string().uuid()).default([]),
});

export type CoachBookingInput = z.infer<typeof coachBookingSchema>;

/**
 * Creates coach bookings on the specified courts.
 * Confirms each court is available before inserting.
 */
export async function createCoachBooking(
  input: CoachBookingInput,
): Promise<
  ActionResult<{
    createdIds: string[];
    displacedCount: number;
    failedCourtIds: string[];
  }>
> {
  let coachUser;
  try {
    const auth = await requireCoach();
    coachUser = auth.user;
  } catch {
    return actionError("Csak edzők használhatják ezt a funkciót.");
  }

  const parsed = coachBookingSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      parsed.error.issues[0]?.message ?? "Érvénytelen foglalási adatok.",
    );
  }

  const { courtIds, dateKey, startTime, endTime, recurringSeriesId, playerIds } =
    parsed.data;

  if (endTime <= startTime) {
    return actionError(
      "A befejezési időnek későbbinek kell lennie a kezdésnél.",
    );
  }

  const startsAt = `${dateKey} ${startTime}:00`;
  const endsAt = `${dateKey} ${endTime}:00`;

  const adminClient = createAdminClient();

  // Get all active courts
  const { data: allCourts } = await adminClient
    .from("courts")
    .select("id, number, name")
    .eq("is_active", true)
    .order("number", { ascending: true });

  if (!allCourts || allCourts.length === 0) {
    return actionError("Nincsenek elérhető pályák.");
  }

  // Find existing confirmed bookings that conflict with coach's desired time
  const { data: conflictingBookings } = await adminClient
    .from("bookings")
    .select("id, court_id, starts_at, ends_at")
    .eq("status", "confirmed")
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt);

  const conflicts = conflictingBookings ?? [];
  const busyCourtIds = new Set(conflicts.map((b) => b.court_id));

  // Also check active recurring series on this dateKey
  const [yearNum, monthNum, dayNum] = dateKey.split("-").map(Number);
  const dayOfWeek = new Date(yearNum, monthNum - 1, dayNum).getDay();

  const { data: otherSeries } = await adminClient
    .from("recurring_booking_series")
    .select("id, start_time, end_time, court_ids, effective_from, effective_until")
    .eq("is_active", true)
    .eq("day_of_week", dayOfWeek)
    .lte("effective_from", dateKey)
    .gte("effective_until", dateKey);

  const candidateSeries = (otherSeries ?? []).filter(
    (s) => !recurringSeriesId || s.id !== recurringSeriesId,
  );

  if (candidateSeries.length > 0) {
    const { data: excData } = await adminClient
      .from("recurring_booking_exceptions")
      .select("series_id")
      .eq("excluded_date", dateKey)
      .in(
        "series_id",
        candidateSeries.map((s) => s.id),
      );
    const excSeriesIds = new Set((excData ?? []).map((e) => e.series_id));

    for (const s of candidateSeries) {
      if (!excSeriesIds.has(s.id)) {
        const sStart = s.start_time.slice(0, 5);
        const sEnd = s.end_time.slice(0, 5);
        if (sStart < endTime && sEnd > startTime) {
          for (const cId of s.court_ids ?? []) {
            busyCourtIds.add(cId);
          }
        }
      }
    }
  }

  const createdIds: string[] = [];
  const failedCourtIds: string[] = [];

  for (const courtId of courtIds) {
    if (busyCourtIds.has(courtId)) {
      failedCourtIds.push(courtId);
      continue;
    }

    // Create the coach booking on this court
    const { data: newBooking, error: insertError } = await adminClient
      .from("bookings")
      .insert({
        court_id: courtId,
        user_id: coachUser.id,
        starts_at: startsAt,
        ends_at: endsAt,
        booking_type: "season_pass",
        status: "confirmed",
        player_count: 0,
        guest_player_names: [],
        price_huf: null,
        is_coach_booking: true,
        recurring_series_id: recurringSeriesId ?? null,
        player_ids: playerIds ?? [],
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[createCoachBooking] Insert error:", insertError);
      failedCourtIds.push(courtId);
      continue;
    }

    createdIds.push(newBooking.id);
  }

  revalidatePath("/booking");
  revalidatePath("/foglalasaim");
  revalidatePath("/coach");
  revalidatePath("/edzeseim");

  if (createdIds.length === 0) {
    return actionError(
      "Nem sikerült a pályákat lefoglalni. Lehetséges, hogy időközben foglaltak lettek.",
    );
  }

  return actionSuccess({
    createdIds,
    displacedCount: 0,
    failedCourtIds,
  });
}

// ==========================================
// RECURRING AVAILABILITY CHECK
// ==========================================

export type OccasionCourtAvailability = {
  dateKey: string;
  availableCourtIds: string[];
  busyCourtIds: string[];
};

export type CheckRecurringAvailabilityResult = {
  occasions: OccasionCourtAvailability[];
  allCourts: Array<{ id: string; number: number; name: string }>;
};

/**
 * Checks court availability for every occasion date in a recurring series.
 * Checks both materialized bookings and active recurring series.
 */
export async function checkRecurringAvailability(input: {
  dateKeys: string[];
  startTime: string;
  endTime: string;
}): Promise<ActionResult<CheckRecurringAvailabilityResult>> {
  try {
    await requireCoach();
  } catch {
    return actionError("Csak edzők használhatják ezt a funkciót.");
  }

  const { dateKeys, startTime, endTime } = input;
  if (!dateKeys || dateKeys.length === 0) {
    return actionSuccess({ occasions: [], allCourts: [] });
  }

  const adminClient = createAdminClient();

  // Get active courts
  const { data: allCourts, error: courtsError } = await adminClient
    .from("courts")
    .select("id, number, name")
    .eq("is_active", true)
    .order("number", { ascending: true });

  if (courtsError || !allCourts) {
    return actionError("Nem sikerült lekérdezni a pályákat.");
  }

  const sortedDates = [...dateKeys].sort();
  const minDate = sortedDates[0];
  const maxDate = sortedDates[sortedDates.length - 1];

  // 1. Query all confirmed bookings between minDate and maxDate
  const { data: bookings, error: bookingsError } = await adminClient
    .from("bookings")
    .select("id, court_id, starts_at, ends_at")
    .eq("status", "confirmed")
    .gte("starts_at", `${minDate} 00:00:00`)
    .lte("ends_at", `${maxDate} 23:59:59`);

  if (bookingsError) {
    console.error("[checkRecurringAvailability] Error:", bookingsError);
    return actionError("Nem sikerült ellenőrizni a pályák foglaltságát.");
  }

  // 2. Query all active recurring series spanning this date range
  const { data: activeSeries, error: seriesError } = await adminClient
    .from("recurring_booking_series")
    .select("id, day_of_week, start_time, end_time, court_ids, effective_from, effective_until")
    .eq("is_active", true)
    .lte("effective_from", maxDate)
    .gte("effective_until", minDate);

  if (seriesError) {
    console.error("[checkRecurringAvailability] Series error:", seriesError);
  }

  // 3. Query exceptions for these active series
  const activeSeriesIds = (activeSeries ?? []).map((s) => s.id);
  let seriesExceptions: Array<{ series_id: string; excluded_date: string }> = [];
  if (activeSeriesIds.length > 0) {
    const { data: excData } = await adminClient
      .from("recurring_booking_exceptions")
      .select("series_id, excluded_date")
      .in("series_id", activeSeriesIds);
    seriesExceptions = excData ?? [];
  }
  const seriesExceptionSet = new Set(
    seriesExceptions.map((e) => `${e.series_id}_${e.excluded_date}`),
  );

  const allCourtIds = allCourts.map((c) => c.id);
  const confirmedBookings = bookings ?? [];
  const seriesList = activeSeries ?? [];

  const occasions: OccasionCourtAvailability[] = dateKeys.map((dateKey) => {
    const slotStart = `${dateKey}T${startTime}:00`;
    const slotEnd = `${dateKey}T${endTime}:00`;

    // A court is busy if:
    // 1) Any confirmed booking on that court overlaps with this occasion slot
    const busyCourtSet = new Set<string>();
    for (const b of confirmedBookings) {
      const bStart = b.starts_at.replace(" ", "T");
      const bEnd = b.ends_at.replace(" ", "T");
      if (bStart < slotEnd && bEnd > slotStart) {
        busyCourtSet.add(b.court_id);
      }
    }

    // 2) Any active recurring series on that court overlaps with this occasion slot
    const [y, m, d] = dateKey.split("-").map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();

    for (const s of seriesList) {
      if (s.day_of_week === dayOfWeek) {
        if (s.effective_from <= dateKey && s.effective_until >= dateKey) {
          if (!seriesExceptionSet.has(`${s.id}_${dateKey}`)) {
            const sStart = s.start_time.slice(0, 5);
            const sEnd = s.end_time.slice(0, 5);
            if (sStart < endTime && sEnd > startTime) {
              for (const cId of s.court_ids ?? []) {
                busyCourtSet.add(cId);
              }
            }
          }
        }
      }
    }

    const availableCourtIds = allCourtIds.filter((id) => !busyCourtSet.has(id));
    const busyCourtIds = allCourtIds.filter((id) => busyCourtSet.has(id));

    return {
      dateKey,
      availableCourtIds,
      busyCourtIds,
    };
  });

  return actionSuccess({
    occasions,
    allCourts,
  });
}

// ==========================================
// MATERIALIZE RECURRING BOOKINGS
// ==========================================

/**
 * Generate individual booking rows from a recurring series for a date range.
 * Supports per-occasion court overrides and skipped dates.
 */
export async function materializeRecurringBookings(
  seriesId: string,
  fromDate: string,
  toDate: string,
  occasionCourtMap?: Record<string, string[]>,
  skippedDateKeys?: string[],
): Promise<
  ActionResult<{ createdCount: number; displacedCount: number; failedCount: number }>
> {
  let coachUser;
  try {
    const auth = await requireCoach();
    coachUser = auth.user;
  } catch {
    return actionError("Csak edzők használhatják ezt a funkciót.");
  }

  const supabase = await createClient();

  // Get the series
  const { data: series, error: seriesError } = await supabase
    .from("recurring_booking_series")
    .select("*")
    .eq("id", seriesId)
    .eq("coach_id", coachUser.id)
    .maybeSingle();

  if (seriesError || !series) {
    return actionError("Az ismétlődő foglalás nem található.");
  }

  if (!series.is_active) {
    return actionError("Az ismétlődő foglalás inaktív.");
  }

  // Record any explicitly skipped dates as exceptions
  if (skippedDateKeys && skippedDateKeys.length > 0) {
    const adminClient = createAdminClient();
    const exceptionsToInsert = skippedDateKeys.map((dateKey) => ({
      series_id: seriesId,
      excluded_date: dateKey,
      reason: "Ütközés miatt kihagyva",
    }));
    await adminClient.from("recurring_booking_exceptions").insert(exceptionsToInsert);
  }

  // Get existing exceptions
  const { data: exceptions } = await supabase
    .from("recurring_booking_exceptions")
    .select("excluded_date")
    .eq("series_id", seriesId);

  const excludedDates = new Set([
    ...(exceptions ?? []).map((e) => e.excluded_date),
    ...(skippedDateKeys ?? []),
  ]);

  // Generate dates matching the day of week within the range
  const [fy, fm, fd] = fromDate.split("-").map(Number);
  const [uy, um, ud] = toDate.split("-").map(Number);
  const [sfy, sfm, sfd] = series.effective_from.split("-").map(Number);
  const [suy, sum, sud] = series.effective_until.split("-").map(Number);

  const effectiveFromTime = Math.max(
    new Date(sfy, sfm - 1, sfd, 12, 0, 0).getTime(),
    new Date(fy, fm - 1, fd, 12, 0, 0).getTime(),
  );
  const effectiveUntilTime = Math.min(
    new Date(suy, sum - 1, sud, 12, 0, 0).getTime(),
    new Date(uy, um - 1, ud, 12, 0, 0).getTime(),
  );

  const datesToBook: string[] = [];
  const current = new Date(effectiveFromTime);
  const until = new Date(effectiveUntilTime);

  while (current <= until) {
    if (current.getDay() === series.day_of_week) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, "0");
      const d = String(current.getDate()).padStart(2, "0");
      const dateKey = `${y}-${m}-${d}`;
      if (!excludedDates.has(dateKey)) {
        datesToBook.push(dateKey);
      }
    }
    current.setDate(current.getDate() + 1);
  }

  let createdCount = 0;
  let failedCount = 0;

  for (const dateKey of datesToBook) {
    const courtIdsToBook = occasionCourtMap?.[dateKey] ?? series.court_ids;
    if (!courtIdsToBook || courtIdsToBook.length === 0) continue;

    const result = await createCoachBooking({
      courtIds: courtIdsToBook,
      dateKey,
      startTime: series.start_time.slice(0, 5), // "HH:mm:ss" → "HH:mm"
      endTime: series.end_time.slice(0, 5),
      recurringSeriesId: seriesId,
      playerIds: (series as { player_ids?: string[] }).player_ids ?? [],
    });

    if (result.success) {
      if (result.data.createdIds.length > 0) {
        createdCount++;
      }
      failedCount += result.data.failedCourtIds.length;
    } else {
      failedCount++;
    }
  }

  revalidatePath("/coach");
  revalidatePath("/booking");

  if (datesToBook.length > 0 && createdCount === 0 && failedCount > 0) {
    return actionError(
      "A foglalásokat nem sikerült létrehozni, mert az érintett pályák már foglaltak voltak.",
    );
  }

  return actionSuccess({ createdCount, displacedCount: 0, failedCount });
}

// ==========================================
// COACHED PLAYER PRACTICES VIEW
// ==========================================

export type CoachPractice = {
  id: string;
  startsAt: string;
  endsAt: string;
  courtName: string;
  courtNumber: number;
  coachName: string | null;
  coachTitle: string | null;
  seriesTitle: string | null;
};

export async function getMyPractices(): Promise<
  ActionResult<CoachPractice[]>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return actionError("Be kell jelentkeznie.");
  }

  // Find the user's coaches
  const { data: coachLinks } = await supabase
    .from("coach_players")
    .select("coach_id")
    .eq("player_id", user.id);

  if (!coachLinks || coachLinks.length === 0) {
    return actionSuccess([]);
  }

  const coachIds = coachLinks.map((link) => link.coach_id);

  // Get coach bookings from those coaches where this user is assigned
  const adminClient = createAdminClient();
  const nowNaive = new Date().toISOString().slice(0, 19);

  const { data: bookings, error: bookingsError } = await adminClient
    .from("bookings")
    .select(`
      id,
      starts_at,
      ends_at,
      user_id,
      recurring_series_id,
      court:courts(number, name)
    `)
    .eq("is_coach_booking", true)
    .eq("status", "confirmed")
    .contains("player_ids", [user.id])
    .gte("starts_at", nowNaive)
    .order("starts_at", { ascending: true })
    .limit(100);

  if (bookingsError) {
    return actionError("Nem sikerült lekérdezni az edzéseket.");
  }

  // Get coach profiles
  const { data: coachProfiles } = await adminClient
    .from("profiles")
    .select("id, full_name, coach_title")
    .in("id", coachIds);

  const coachMap = new Map(
    (coachProfiles ?? []).map((p) => [p.id, p]),
  );

  // Get series titles
  const seriesIds = [
    ...new Set(
      (bookings ?? [])
        .map((b) => b.recurring_series_id)
        .filter(Boolean) as string[],
    ),
  ];
  let seriesMap = new Map<string, string>();
  if (seriesIds.length > 0) {
    const { data: seriesData } = await adminClient
      .from("recurring_booking_series")
      .select("id, title")
      .in("id", seriesIds);
    seriesMap = new Map(
      (seriesData ?? []).map((s) => [s.id, s.title]),
    );
  }

  // Group practices that span multiple courts for the same occasion
  const practiceGroups = new Map<string, CoachPractice>();

  for (const b of bookings ?? []) {
    const court = b.court as unknown as { number: number; name: string } | null;
    if (!court) continue;

    const coach = coachMap.get(b.user_id);
    const key = `${b.user_id}_${b.starts_at}_${b.ends_at}`;
    const existing = practiceGroups.get(key);

    if (existing) {
      const courts = existing.courtName
        .split("., ")
        .map((s) => Number(s.replace(". pálya", "").trim()))
        .filter(Boolean);
      if (!courts.includes(court.number)) {
        courts.push(court.number);
        courts.sort((a, b) => a - b);
        existing.courtName = `${courts.join("., ")}. pálya`;
      }
    } else {
      practiceGroups.set(key, {
        id: b.id,
        startsAt: b.starts_at,
        endsAt: b.ends_at,
        courtName: `${court.number}. pálya`,
        courtNumber: court.number,
        coachName: coach?.full_name ?? null,
        coachTitle: coach?.coach_title ?? null,
        seriesTitle: b.recurring_series_id
          ? seriesMap.get(b.recurring_series_id) ?? null
          : null,
      });
    }
  }

  const practices: CoachPractice[] = Array.from(practiceGroups.values()).sort(
    (a, b) => a.startsAt.localeCompare(b.startsAt),
  );

  return actionSuccess(practices);
}

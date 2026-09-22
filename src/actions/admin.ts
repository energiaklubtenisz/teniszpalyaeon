"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { adminContent } from "@/content/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  actionError,
  actionSuccess,
  type ActionResult,
} from "@/types/action-result";
import type { Database } from "@/types/database.types";

export type SeasonPassHolder = {
  id: string;
  email: string;
  createdAt: string;
  userId: string | null;
  fullName: string | null;
  phone: string | null;
  isRegistered: boolean;
};

export type RegisteredUserCandidate = {
  id: string;
  email: string;
  fullName: string | null;
};

export type AdminUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  role: Database["public"]["Enums"]["user_role"];
  activeSeasonPass: boolean;
  coachTitle: string | null;
  createdAt: string;
  totalBookings: number;
};

export type AdminBooking = {
  id: string;
  bookingIds: string[];
  courtId: string;
  courtNumber: number;
  courtNumbers: number[];
  courtName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  startsAt: string;
  endsAt: string;
  bookingType: Database["public"]["Enums"]["booking_type"];
  status: Database["public"]["Enums"]["booking_status"];
  playerCount: number;
  guestPlayerNames: string[];
  priceHuf: number | null;
  createdAt: string;
  isCoachBooking: boolean;
  recurringSeriesId?: string | null;
};

export type CourtUtilization = {
  courtId: string;
  courtNumber: number;
  courtName: string;
  bookingCount: number;
  totalHours: number;
};

export type AdminDashboardMetrics = {
  totalBookings: number;
  activeBookings: number;
  totalMembers: number;
  activeSeasonPasses: number;
  totalRevenueHuf: number;
  seasonPassBookingCount: number;
  oneTimeBookingCount: number;
  courtUtilization: CourtUtilization[];
  peakHours: {
    morning: number; // 08:00 - 12:00
    afternoon: number; // 12:00 - 16:00
    evening: number; // 16:00 - 20:00+
  };
  recentBookings: AdminBooking[];
};

const emailSchema = z
  .string()
  .trim()
  .email(adminContent.seasonPass.addForm.errors.invalidEmail)
  .transform((val) => val.toLowerCase());

// ==========================================
// 1. BÉRLETESEK KEZELÉSE (SEASON PASSES)
// ==========================================

export async function getSeasonPassData(): Promise<
  ActionResult<{
    holders: SeasonPassHolder[];
    candidates: RegisteredUserCandidate[];
  }>
> {
  try {
    await requireAdmin();
  } catch {
    return actionError(adminContent.seasonPass.addForm.errors.unauthorized);
  }

  const supabase = createAdminClient();

  // Fetch whitelist rows
  const { data: whitelist, error: whitelistError } = await supabase
    .from("season_pass_whitelist")
    .select("id, email, created_at")
    .order("created_at", { ascending: false });

  if (whitelistError) {
    return actionError("Nem sikerült lekérdezni a bérleteseket.");
  }

  // Fetch all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role, active_season_pass");

  if (profilesError) {
    return actionError("Nem sikerült lekérdezni a profilokat.");
  }

  const profileMap = new Map<string, (typeof profiles)[number]>();
  for (const p of profiles ?? []) {
    if (p.email) {
      profileMap.set(p.email.toLowerCase(), p);
    }
  }

  const holders: SeasonPassHolder[] = (whitelist ?? []).map((w) => {
    const profile = profileMap.get(w.email.toLowerCase());
    return {
      id: w.id,
      email: w.email,
      createdAt: w.created_at,
      userId: profile?.id ?? null,
      fullName: profile?.full_name ?? null,
      phone: profile?.phone ?? null,
      isRegistered: Boolean(profile),
    };
  });

  const activeEmailSet = new Set((whitelist ?? []).map((w) => w.email.toLowerCase()));

  // Candidates: registered users who do NOT yet have an active season pass (and are not coaches)
  const candidates: RegisteredUserCandidate[] = (profiles ?? [])
    .filter(
      (p) =>
        p.email &&
        !activeEmailSet.has(p.email.toLowerCase()) &&
        p.role !== "coach",
    )
    .map((p) => ({
      id: p.id,
      email: p.email as string,
      fullName: p.full_name,
    }));

  return actionSuccess({ holders, candidates });
}

export async function addSeasonPass(
  rawEmail: string,
): Promise<ActionResult<{ email: string; isRegistered: boolean }>> {
  let adminUser;
  try {
    const auth = await requireAdmin();
    adminUser = auth.user;
  } catch {
    return actionError(adminContent.seasonPass.addForm.errors.unauthorized);
  }

  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) {
    return actionError(
      parsed.error.issues[0]?.message ??
        adminContent.seasonPass.addForm.errors.invalidEmail,
    );
  }

  const email = parsed.data;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("season_pass_whitelist")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (existing) {
    return actionError(adminContent.seasonPass.addForm.errors.alreadyExists);
  }

  const { error: insertError } = await supabase
    .from("season_pass_whitelist")
    .insert({
      email,
      created_by: adminUser.id,
    });

  if (insertError) {
    return actionError(adminContent.seasonPass.addForm.errors.generic);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  revalidatePath("/admin");
  revalidatePath("/admin/adatbazis");
  revalidatePath("/admin/riportok");
  revalidatePath("/", "layout");

  return actionSuccess({
    email,
    isRegistered: Boolean(profile),
  });
}

export async function revokeSeasonPass(
  whitelistId: string,
): Promise<ActionResult<{ email: string }>> {
  try {
    await requireAdmin();
  } catch {
    return actionError(adminContent.seasonPass.addForm.errors.unauthorized);
  }

  const supabase = createAdminClient();

  const { data: row, error: fetchError } = await supabase
    .from("season_pass_whitelist")
    .select("id, email")
    .eq("id", whitelistId)
    .maybeSingle();

  if (fetchError || !row) {
    return actionError("A bérletes bejegyzés nem található.");
  }

  const { error: deleteError } = await supabase
    .from("season_pass_whitelist")
    .delete()
    .eq("id", whitelistId);

  if (deleteError) {
    return actionError(adminContent.seasonPass.revokeError);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/adatbazis");
  revalidatePath("/admin/riportok");
  revalidatePath("/", "layout");

  return actionSuccess({ email: row.email });
}

// ==========================================
// 2. FELHASZNÁLÓK ADATBÁZISA (USERS)
// Cache whether the coach_title column exists in the database
let hasCoachTitleColumn: boolean | null = null;

export async function getAdminUsersData(): Promise<ActionResult<AdminUser[]>> {
  try {
    await requireAdmin();
  } catch {
    return actionError(adminContent.seasonPass.addForm.errors.unauthorized);
  }

  const supabase = createAdminClient();

  const fetchProfiles = async () => {
    // If we know coach_title exists (or we haven't checked yet), attempt full query
    if (hasCoachTitleColumn !== false) {
      const res = await supabase
        .from("profiles")
        .select("id, email, full_name, phone, role, active_season_pass, coach_title, created_at")
        .order("created_at", { ascending: false });

      if (!res.error) {
        hasCoachTitleColumn = true;
        return res.data;
      }

      // If column doesn't exist yet in the DB (Postgres code 42703), mark as false and fallback silently
      if (res.error.code === "42703" || res.error.message?.includes("coach_title")) {
        hasCoachTitleColumn = false;
      } else {
        console.error("[getAdminUsersData] Unexpected profiles query error:", res.error);
        return null;
      }
    }

    // Fallback: query without coach_title
    const fallbackRes = await supabase
      .from("profiles")
      .select("id, email, full_name, phone, role, active_season_pass, created_at")
      .order("created_at", { ascending: false });

    if (fallbackRes.error) {
      console.error("[getAdminUsersData] Fallback fetch failed:", fallbackRes.error);
      return null;
    }

    return (fallbackRes.data ?? []).map((p) => ({
      ...p,
      coach_title: null,
    }));
  };

  const [profiles, { data: bookings, error: bookingsError }] = await Promise.all([
    fetchProfiles(),
    supabase.from("bookings").select("user_id, starts_at, ends_at, is_coach_booking"),
  ]);

  if (!profiles) {
    return actionError("Nem sikerült lekérdezni a felhasználókat.");
  }

  // Count bookings per user (deduplicating multi-court coach interval bookings into 1 session per occasion)
  const bookingCountMap = new Map<string, number>();
  const coachSessionSeen = new Set<string>();

  if (!bookingsError && bookings) {
    for (const b of bookings) {
      if (b.is_coach_booking) {
        const sessionKey = `${b.user_id}_${b.starts_at}_${b.ends_at}`;
        if (coachSessionSeen.has(sessionKey)) {
          continue;
        }
        coachSessionSeen.add(sessionKey);
      }
      bookingCountMap.set(b.user_id, (bookingCountMap.get(b.user_id) ?? 0) + 1);
    }
  }

  const users: AdminUser[] = (profiles ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    phone: p.phone,
    role: p.role,
    activeSeasonPass: p.active_season_pass,
    coachTitle: p.coach_title ?? null,
    createdAt: p.created_at,
    totalBookings: bookingCountMap.get(p.id) ?? 0,
  }));

  return actionSuccess(users);
}

export async function updateUserRole(
  userId: string,
  newRole: "member" | "admin" | "coach",
): Promise<ActionResult<{ userId: string; role: "member" | "admin" | "coach" }>> {
  let adminUser;
  try {
    const auth = await requireAdmin();
    adminUser = auth.user;
  } catch {
    return actionError(adminContent.seasonPass.addForm.errors.unauthorized);
  }

  const supabase = createAdminClient();

  // If the admin is changing their own role to non-admin, ensure they aren't the only remaining admin
  if (adminUser.id === userId && newRole !== "admin") {
    const { count, error: countError } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (!countError && (count ?? 0) <= 1) {
      return actionError("Nem vonhatja meg a jogosultságot: Ön az egyetlen adminisztrátor a rendszerben.");
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    console.error("[updateUserRole] Supabase update error:", error);
    if (error.code === "22P02" || error.message?.toLowerCase().includes("coach")) {
      return actionError(
        "Az 'Edző' (coach) szerepkör még nem aktív az adatbázisban! Futtassa le a Supabase SQL Editorban: ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'coach';",
      );
    }
    return actionError("Nem sikerült módosítani a szerepkört: " + (error.message || "Hiba történt"));
  }

  revalidatePath("/admin/adatbazis");
  revalidatePath("/coach");
  revalidatePath("/", "layout");

  return actionSuccess({ userId, role: newRole });
}

export async function setCoachTitle(
  userId: string,
  title: string,
): Promise<ActionResult<{ userId: string; title: string }>> {
  try {
    await requireAdmin();
  } catch {
    return actionError(adminContent.seasonPass.addForm.errors.unauthorized);
  }

  const trimmedTitle = title.trim();
  if (trimmedTitle.length > 100) {
    return actionError("A cím maximum 100 karakter lehet.");
  }

  const supabase = createAdminClient();

  // Verify the user has coach role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "coach") {
    return actionError("Csak edzők kaphatnak edzői címet.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ coach_title: trimmedTitle || null })
    .eq("id", userId);

  if (error) {
    return actionError("Nem sikerült beállítani az edzői címet. Kérjük ellenőrizze, hogy lefutott-e az adatbázis migráció.");
  }

  hasCoachTitleColumn = true;

  revalidatePath("/admin/adatbazis");
  revalidatePath("/coach");
  revalidatePath("/", "layout");

  return actionSuccess({ userId, title: trimmedTitle });
}

export async function toggleUserSeasonPassByEmail(
  email: string,
  activate: boolean,
): Promise<ActionResult<{ email: string; active: boolean }>> {
  try {
    await requireAdmin();
  } catch {
    return actionError(adminContent.seasonPass.addForm.errors.unauthorized);
  }

  if (activate) {
    const res = await addSeasonPass(email);
    if (!res.success) return actionError(res.error);
    return actionSuccess({ email, active: true });
  } else {
    const supabase = createAdminClient();
    const { data: row } = await supabase
      .from("season_pass_whitelist")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (!row) {
      return actionError("A bérlet nem található a rendszerben.");
    }
    const res = await revokeSeasonPass(row.id);
    if (!res.success) return actionError(res.error);
    return actionSuccess({ email, active: false });
  }
}

// ==========================================
// 3. FOGLALÁSOK ADATBÁZISA (BOOKINGS)
// ==========================================

export async function getAdminBookingsData(): Promise<ActionResult<AdminBooking[]>> {
  try {
    await requireAdmin();
  } catch {
    return actionError(adminContent.seasonPass.addForm.errors.unauthorized);
  }

  const supabase = createAdminClient();

  const [
    { data: bookingsData, error: bookingsError },
    { data: profilesData, error: profilesError },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        `
        id,
        court_id,
        starts_at,
        ends_at,
        booking_type,
        status,
        player_count,
        guest_player_names,
        price_huf,
        created_at,
        user_id,
        is_coach_booking,
        recurring_series_id,
        court:courts(id, number, name)
      `,
      )
      .order("starts_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email, phone"),
  ]);

  if (bookingsError) {
    console.error("[getAdminBookingsData] Hiba a foglalások lekérésekor:", bookingsError);
    return actionError("Nem sikerült lekérdezni a foglalásokat.");
  }

  if (profilesError) {
    console.error("[getAdminBookingsData] Hiba a profilok lekérésekor:", profilesError);
  }

  const profileMap = new Map<
    string,
    { id: string; full_name: string | null; email: string | null; phone: string | null }
  >();
  if (profilesData) {
    for (const p of profilesData) {
      profileMap.set(p.id, p);
    }
  }

  // Group coach interval bookings for multiple courts into 1 occasion booking
  const coachGroups = new Map<string, AdminBooking>();
  const nonCoachBookings: AdminBooking[] = [];

  for (const row of bookingsData ?? []) {
    const court = row.court as unknown as { id: string; number: number; name: string } | null;
    const profile = profileMap.get(row.user_id);
    if (!court) continue;

    const isCoach = Boolean(row.is_coach_booking);

    if (isCoach) {
      const groupKey = `${row.user_id}_${row.starts_at}_${row.ends_at}_${row.status}`;
      const existing = coachGroups.get(groupKey);

      if (existing) {
        existing.bookingIds.push(row.id);
        if (!existing.courtNumbers.includes(court.number)) {
          existing.courtNumbers.push(court.number);
          existing.courtNumbers.sort((a, b) => a - b);
          existing.courtName = `${existing.courtNumbers.join("., ")}. pálya`;
        }
      } else {
        coachGroups.set(groupKey, {
          id: row.id,
          bookingIds: [row.id],
          courtId: row.court_id,
          courtNumber: court.number,
          courtNumbers: [court.number],
          courtName: `${court.number}. pálya`,
          userId: row.user_id,
          userName: profile?.full_name?.trim() || profile?.email || "Névtelen",
          userEmail: profile?.email || "Nincs email",
          userPhone: profile?.phone || null,
          startsAt: row.starts_at,
          endsAt: row.ends_at,
          bookingType: row.booking_type,
          status: row.status,
          playerCount: row.player_count,
          guestPlayerNames: row.guest_player_names ?? [],
          priceHuf: null,
          createdAt: row.created_at,
          isCoachBooking: true,
          recurringSeriesId: row.recurring_series_id ?? null,
        });
      }
    } else {
      nonCoachBookings.push({
        id: row.id,
        bookingIds: [row.id],
        courtId: row.court_id,
        courtNumber: court.number,
        courtNumbers: [court.number],
        courtName: court.name,
        userId: row.user_id,
        userName: profile?.full_name?.trim() || profile?.email || "Névtelen",
        userEmail: profile?.email || "Nincs email",
        userPhone: profile?.phone || null,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        bookingType: row.booking_type,
        status: row.status,
        playerCount: row.player_count,
        guestPlayerNames: row.guest_player_names ?? [],
        priceHuf: row.price_huf,
        createdAt: row.created_at,
        isCoachBooking: false,
        recurringSeriesId: row.recurring_series_id ?? null,
      });
    }
  }

  const bookings: AdminBooking[] = [
    ...Array.from(coachGroups.values()),
    ...nonCoachBookings,
  ].sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  return actionSuccess(bookings);
}

export async function adminCancelBooking(
  bookingId: string | string[],
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
  } catch {
    return actionError(adminContent.seasonPass.addForm.errors.unauthorized);
  }

  const supabase = createAdminClient();
  const ids = Array.isArray(bookingId) ? bookingId : [bookingId];

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .in("id", ids);

  if (error) {
    return actionError("Nem sikerült lemondani a foglalást.");
  }

  revalidatePath("/admin/adatbazis");
  revalidatePath("/admin/riportok");
  revalidatePath("/booking");
  revalidatePath("/foglalasaim");
  revalidatePath("/coach");

  return actionSuccess({ id: ids[0] });
}

// ==========================================
// 4. RIPORTOK ÉS DASHBOARD STATISZTIKÁK
// ==========================================

export async function getAdminDashboardMetrics(): Promise<
  ActionResult<AdminDashboardMetrics>
> {
  try {
    await requireAdmin();
  } catch {
    return actionError(adminContent.seasonPass.addForm.errors.unauthorized);
  }

  const supabase = createAdminClient();

  const [
    { data: courts, error: courtsError },
    { data: profiles, error: profilesError },
    { data: whitelist, error: whitelistError },
    { data: bookingsData, error: bookingsError },
  ] = await Promise.all([
    supabase.from("courts").select("id, number, name").eq("is_active", true).order("number"),
    supabase.from("profiles").select("id, full_name, email, phone"),
    supabase.from("season_pass_whitelist").select("id"),
    supabase
      .from("bookings")
      .select(
        `
        id,
        court_id,
        starts_at,
        ends_at,
        booking_type,
        status,
        player_count,
        guest_player_names,
        price_huf,
        created_at,
        user_id,
        is_coach_booking,
        recurring_series_id,
        court:courts(id, number, name)
      `,
      )
      .order("starts_at", { ascending: false }),
  ]);

  if (courtsError || profilesError || whitelistError || bookingsError) {
    console.error("[getAdminDashboardMetrics] Hiba:", {
      courtsError,
      profilesError,
      whitelistError,
      bookingsError,
    });
    return actionError("Nem sikerült lekérdezni a statisztikai adatokat.");
  }

  const profileMap = new Map<
    string,
    { id: string; full_name: string | null; email: string | null; phone: string | null }
  >();
  if (profiles) {
    for (const p of profiles) {
      profileMap.set(p.id, p);
    }
  }

  const totalMembers = profiles?.length ?? 0;
  const activeSeasonPasses = whitelist?.length ?? 0;

  // Format bookings
  const allBookings: AdminBooking[] = (bookingsData ?? []).flatMap((row) => {
    const court = row.court as unknown as { id: string; number: number; name: string } | null;
    const profile = profileMap.get(row.user_id);

    if (!court) return [];

    return [
      {
        id: row.id,
        bookingIds: [row.id],
        courtId: row.court_id,
        courtNumber: court.number,
        courtNumbers: [court.number],
        courtName: court.name,
        userId: row.user_id,
        userName: profile?.full_name?.trim() || profile?.email || "Névtelen",
        userEmail: profile?.email || "Nincs email",
        userPhone: profile?.phone || null,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        bookingType: row.booking_type,
        status: row.status,
        playerCount: row.player_count,
        guestPlayerNames: row.guest_player_names ?? [],
        priceHuf: row.price_huf,
        createdAt: row.created_at,
        isCoachBooking: Boolean(row.is_coach_booking),
        recurringSeriesId: row.recurring_series_id ?? null,
      },
    ];
  });

  const confirmedBookings = allBookings.filter((b) => b.status === "confirmed");
  const nowNaive = new Date().toISOString().slice(0, 19);

  const activeBookings = confirmedBookings.filter((b) => b.startsAt >= nowNaive).length;

  let totalRevenueHuf = 0;
  let seasonPassCount = 0;
  let oneTimeCount = 0;

  const courtUsageMap = new Map<string, { count: number; hours: number }>();
  for (const c of courts ?? []) {
    courtUsageMap.set(c.id, { count: 0, hours: 0 });
  }

  const peakHours = {
    morning: 0, // 08:00 - 11:59
    afternoon: 0, // 12:00 - 15:59
    evening: 0, // 16:00+
  };

  for (const b of confirmedBookings) {
    if (b.bookingType === "season_pass") {
      seasonPassCount++;
    } else {
      oneTimeCount++;
      totalRevenueHuf += b.priceHuf ?? 0;
    }

    // Court usage
    const usage = courtUsageMap.get(b.courtId) ?? { count: 0, hours: 0 };
    const startHour = parseInt(b.startsAt.slice(11, 13), 10) || 8;
    const startMin = parseInt(b.startsAt.slice(14, 16), 10) || 0;
    const endHour = parseInt(b.endsAt.slice(11, 13), 10) || 9;
    const endMin = parseInt(b.endsAt.slice(14, 16), 10) || 0;
    const durationHours = endHour - startHour + (endMin - startMin) / 60;

    usage.count += 1;
    usage.hours += durationHours > 0 ? durationHours : 1;
    courtUsageMap.set(b.courtId, usage);

    // Peak hours
    if (startHour < 12) {
      peakHours.morning++;
    } else if (startHour < 16) {
      peakHours.afternoon++;
    } else {
      peakHours.evening++;
    }
  }

  const courtUtilization: CourtUtilization[] = (courts ?? []).map((c) => {
    const u = courtUsageMap.get(c.id) ?? { count: 0, hours: 0 };
    return {
      courtId: c.id,
      courtNumber: c.number,
      courtName: c.name,
      bookingCount: u.count,
      totalHours: Math.round(u.hours * 10) / 10,
    };
  });

  return actionSuccess({
    totalBookings: allBookings.length,
    activeBookings,
    totalMembers,
    activeSeasonPasses,
    totalRevenueHuf,
    seasonPassBookingCount: seasonPassCount,
    oneTimeBookingCount: oneTimeCount,
    courtUtilization,
    peakHours,
    recentBookings: allBookings.slice(0, 6),
  });
}

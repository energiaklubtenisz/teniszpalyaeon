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
import {
  DAY_OF_WEEK_LABELS,
  type CoachDashboardData,
  type CoachPlayer,
  type CoachPlayerStatus,
  type PlayerCandidate,
  type RecurringBookingSeries,
  type RecurringBookingException,
  type PlayerStatistic,
  type DayOfWeek,
} from "@/types/coach";

// ==========================================
// COACH DASHBOARD
// ==========================================

export async function getCoachDashboard(): Promise<
  ActionResult<CoachDashboardData>
> {
  const supabase = await createClient();
  const {
    data: { user: coachUser },
  } = await supabase.auth.getUser();

  if (!coachUser) {
    return actionError("Nincs bejelentkezve.");
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", coachUser.id)
    .maybeSingle();

  if (callerProfile?.role !== "coach" && callerProfile?.role !== "admin") {
    return actionError("Csak edzők érhetik el ezt az oldalt.");
  }

  const adminClient = createAdminClient();

  const [
    { data: profile },
    { data: series, error: seriesError },
    playersRes,
    bookingsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("coach_title")
      .eq("id", coachUser.id)
      .maybeSingle(),
    supabase
      .from("recurring_booking_series")
      .select("*")
      .eq("coach_id", coachUser.id)
      .eq("is_active", true)
      .order("day_of_week", { ascending: true }),
    adminClient
      .from("coach_players")
      .select("id, coach_id, player_id, status, responded_at, created_at")
      .eq("coach_id", coachUser.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("bookings")
      .select("starts_at, ends_at")
      .eq("user_id", coachUser.id)
      .eq("is_coach_booking", true)
      .eq("status", "confirmed")
      .gte("starts_at", new Date().toISOString().slice(0, 19)),
  ]);

  if (seriesError) {
    return actionError("Nem sikerült betölteni az edzői adatokat.");
  }

  // Graceful fallback if status column is not yet present in coach_players
  let playersList = playersRes.data;
  if (playersRes.error || !playersList) {
    const fb = await adminClient
      .from("coach_players")
      .select("id, coach_id, player_id, created_at")
      .eq("coach_id", coachUser.id)
      .order("created_at", { ascending: false });
    playersList = (fb.data ?? []).map((p) => ({
      ...p,
      status: "pending",
      responded_at: null,
    }));
  }

  // Fetch player profiles for display names, phone, avatar
  const playerIds = (playersList ?? []).map((p) => p.player_id);
  let playerProfiles: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  }[] = [];
  if (playerIds.length > 0) {
    // Attempt with avatar_url, fallback without
    const pWithAvatar = await adminClient
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url")
      .in("id", playerIds);
    if (!pWithAvatar.error && pWithAvatar.data) {
      playerProfiles = pWithAvatar.data;
    } else {
      const pWithout = await adminClient
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", playerIds);
      playerProfiles = (pWithout.data ?? []).map((p) => ({
        ...p,
        avatar_url: null,
      }));
    }
  }

  const profileMap = new Map(playerProfiles.map((p) => [p.id, p]));

  const mappedPlayers: CoachPlayer[] = (playersList ?? []).map((p) => {
    const prof = profileMap.get(p.player_id);
    const rawStatus = (p as { status?: string }).status;
    const finalStatus: CoachPlayerStatus =
      rawStatus === "accepted" || rawStatus === "declined" ? rawStatus : "pending";

    return {
      id: p.id,
      coachId: p.coach_id,
      playerId: p.player_id,
      status: finalStatus,
      createdAt: p.created_at,
      respondedAt: (p as { responded_at?: string | null }).responded_at ?? null,
      playerName: prof?.full_name ?? null,
      playerEmail: prof?.email ?? null,
      playerPhone: prof?.phone ?? null,
      playerAvatarUrl: prof?.avatar_url ?? null,
    };
  });

  const mappedSeries: RecurringBookingSeries[] = (series ?? []).map((s) => ({
    id: s.id,
    coachId: s.coach_id,
    title: s.title,
    dayOfWeek: s.day_of_week as DayOfWeek,
    startTime: s.start_time,
    endTime: s.end_time,
    courtIds: s.court_ids,
    effectiveFrom: s.effective_from,
    effectiveUntil: s.effective_until,
    isActive: s.is_active,
    playerIds: (s as { player_ids?: string[] }).player_ids ?? [],
    createdAt: s.created_at,
  }));

  const distinctUpcomingSessions = new Set(
    (bookingsRes.data ?? []).map((b) => `${b.starts_at}_${b.ends_at}`),
  );

  return actionSuccess({
    series: mappedSeries,
    players: mappedPlayers,
    upcomingBookingCount: distinctUpcomingSessions.size,
    coachTitle: profile?.coach_title ?? null,
  });
}

// ==========================================
// RECURRING SERIES MANAGEMENT
// ==========================================

const createSeriesSchema = z.object({
  title: z.string().trim().min(1, "Adjon meg egy címet").max(100),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Érvénytelen időpont (HH:mm)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Érvénytelen időpont (HH:mm)"),
  courtIds: z.array(z.string().uuid()).min(1, "Válasszon legalább egy pályát"),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  effectiveUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  playerIds: z.array(z.string().uuid()).default([]),
});

export type CreateSeriesInput = z.infer<typeof createSeriesSchema>;

export async function createRecurringSeries(
  input: CreateSeriesInput,
): Promise<ActionResult<{ id: string }>> {
  let coachUser;
  try {
    const auth = await requireCoach();
    coachUser = auth.user;
  } catch {
    return actionError("Csak edzők hozhatnak létre ismétlődő foglalásokat.");
  }

  const parsed = createSeriesSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      parsed.error.issues[0]?.message ?? "Érvénytelen adatok.",
    );
  }

  const {
    title,
    dayOfWeek,
    startTime,
    endTime,
    courtIds,
    effectiveFrom,
    effectiveUntil,
    playerIds,
  } = parsed.data;

  // Validate end > start
  if (endTime <= startTime) {
    return actionError("A befejezési időnek későbbinek kell lennie a kezdésnél.");
  }

  // Validate date range
  if (effectiveUntil < effectiveFrom) {
    return actionError("A befejezési dátum nem lehet korábbi a kezdésnél.");
  }

  // Max 12 months ahead
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 12);
  if (new Date(effectiveUntil) > maxDate) {
    return actionError("Az ismétlődő foglalás legfeljebb 12 hónapra hozható létre.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_booking_series")
    .insert({
      coach_id: coachUser.id,
      title,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      court_ids: courtIds,
      effective_from: effectiveFrom,
      effective_until: effectiveUntil,
      player_ids: playerIds ?? [],
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createRecurringSeries] Error:", error);
    return actionError("Nem sikerült létrehozni az ismétlődő foglalást.");
  }

  // Notify assigned players about the newly scheduled practice
  if (playerIds && playerIds.length > 0) {
    try {
      const { createNotification } = await import("./notification");
      const { data: coachProfile } = await supabase
        .from("profiles")
        .select("full_name, coach_title")
        .eq("id", coachUser.id)
        .maybeSingle();

      const coachName = coachProfile?.full_name?.trim() || "Az edzője";
      const dayLabel = DAY_OF_WEEK_LABELS[dayOfWeek as DayOfWeek] ?? "";
      const timeRange = `${startTime.slice(0, 5)}–${endTime.slice(0, 5)}`;

      for (const playerId of playerIds) {
        await createNotification(
          playerId,
          "coach_assignment",
          "Új edzés rögzítve",
          `${coachName} új edzést rögzített számodra: „${title}” (Minden ${dayLabel}, ${timeRange}, időszak: ${effectiveFrom} – ${effectiveUntil}).`,
          {
            seriesId: data.id,
            coachId: coachUser.id,
            title,
            dayOfWeek,
            startTime,
            endTime,
            effectiveFrom,
            effectiveUntil,
          },
        );
      }
    } catch (notifErr) {
      console.warn("[createRecurringSeries] Notification dispatch warning:", notifErr);
    }
  }

  revalidatePath("/coach");
  revalidatePath("/edzeseim");
  return actionSuccess({ id: data.id });
}

export async function getSeriesExceptions(
  seriesId: string,
): Promise<ActionResult<RecurringBookingException[]>> {
  try {
    await requireCoach();
  } catch {
    return actionError("Csak edzők érhetik el ezt a funkciót.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_booking_exceptions")
    .select("*")
    .eq("series_id", seriesId)
    .order("excluded_date", { ascending: true });

  if (error) {
    return actionError("Nem sikerült lekérdezni a kivételeket.");
  }

  const exceptions: RecurringBookingException[] = (data ?? []).map((e) => ({
    id: e.id,
    seriesId: e.series_id,
    excludedDate: e.excluded_date,
    reason: e.reason,
    createdAt: e.created_at,
  }));

  return actionSuccess(exceptions);
}

export async function addSeriesException(
  seriesId: string,
  excludedDate: string,
  reason?: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireCoach();
  } catch {
    return actionError("Csak edzők kezelhetik az ismétlődő foglalásokat.");
  }

  const supabase = await createClient();

  // Verify the series belongs to this coach (RLS handles this too)
  const { data, error } = await supabase
    .from("recurring_booking_exceptions")
    .insert({
      series_id: seriesId,
      excluded_date: excludedDate,
      reason: reason ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return actionError("Ez a nap már ki van zárva.");
    }
    return actionError("Nem sikerült hozzáadni a kivételt.");
  }

  // Cancel any materialized booking for this date
  const adminClient = createAdminClient();
  const { data: series } = await supabase
    .from("recurring_booking_series")
    .select("coach_id, start_time, end_time, court_ids")
    .eq("id", seriesId)
    .maybeSingle();

  if (series) {
    // Cancel bookings on this date for the coach's series
    const dateStart = `${excludedDate} 00:00:00`;
    const dateEnd = `${excludedDate} 23:59:59`;

    await adminClient
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("recurring_series_id", seriesId)
      .eq("status", "confirmed")
      .gte("starts_at", dateStart)
      .lte("starts_at", dateEnd);
  }

  revalidatePath("/coach");
  revalidatePath("/booking");
  revalidatePath("/edzeseim");
  return actionSuccess({ id: data.id });
}

export async function removeSeriesException(
  exceptionId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireCoach();
  } catch {
    return actionError("Csak edzők kezelhetik az ismétlődő foglalásokat.");
  }

  const supabase = await createClient();

  // Find exception details before deleting to restore bookings
  const { data: exc } = await supabase
    .from("recurring_booking_exceptions")
    .select("series_id, excluded_date")
    .eq("id", exceptionId)
    .maybeSingle();

  const { error } = await supabase
    .from("recurring_booking_exceptions")
    .delete()
    .eq("id", exceptionId);

  if (error) {
    return actionError("Nem sikerült visszaállítani a napot.");
  }

  // Restore cancelled bookings for this series on that date
  if (exc) {
    const adminClient = createAdminClient();
    const dateStart = `${exc.excluded_date} 00:00:00`;
    const dateEnd = `${exc.excluded_date} 23:59:59`;

    await adminClient
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("recurring_series_id", exc.series_id)
      .eq("status", "cancelled")
      .gte("starts_at", dateStart)
      .lte("starts_at", dateEnd);
  }

  revalidatePath("/coach");
  revalidatePath("/booking");
  revalidatePath("/edzeseim");
  return actionSuccess({ id: exceptionId });
}

export async function deactivateSeries(
  seriesId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireCoach();
  } catch {
    return actionError("Csak edzők kezelhetik az ismétlődő foglalásokat.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_booking_series")
    .update({ is_active: false })
    .eq("id", seriesId);

  if (error) {
    return actionError("Nem sikerült deaktiválni az ismétlődő foglalást.");
  }

  // Cancel future materialized bookings for this series
  const adminClient = createAdminClient();
  const nowNaive = new Date().toISOString().slice(0, 19);
  await adminClient
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("recurring_series_id", seriesId)
    .eq("status", "confirmed")
    .gte("starts_at", nowNaive);

  revalidatePath("/coach");
  revalidatePath("/edzeseim");
  return actionSuccess({ id: seriesId });
}

// ==========================================
// PLAYER MANAGEMENT & INVITATIONS
// ==========================================

export type PendingInvitation = {
  id: string;
  coachId: string;
  coachName: string;
  coachTitle: string | null;
  coachAvatarUrl: string | null;
  createdAt: string;
};

export async function getAvailablePlayerCandidates(): Promise<ActionResult<PlayerCandidate[]>> {
  let coachUser;
  try {
    const auth = await requireCoach();
    coachUser = auth.user;
  } catch (err) {
    console.error("[getAvailablePlayerCandidates] requireCoach failed:", err);
    return actionError("Csak edzők vagy adminisztrátorok érhetik el a játékosjelölteket.");
  }

  const adminClient = createAdminClient();

  // 1. Fetch profiles safely with fallbacks
  let allProfiles: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url?: string | null;
  }[] = [];

  // Attempt 1: with avatar_url
  const profWithAvatar = await adminClient
    .from("profiles")
    .select("id, full_name, email, phone, avatar_url")
    .neq("id", coachUser.id)
    .order("full_name", { ascending: true });

  if (!profWithAvatar.error && profWithAvatar.data) {
    allProfiles = profWithAvatar.data;
  } else {
    // Attempt 2: fallback without avatar_url
    const profWithoutAvatar = await adminClient
      .from("profiles")
      .select("id, full_name, email, phone")
      .neq("id", coachUser.id)
      .order("full_name", { ascending: true });

    if (!profWithoutAvatar.error && profWithoutAvatar.data) {
      allProfiles = profWithoutAvatar.data.map((p) => ({
        ...p,
        avatar_url: null,
      }));
    } else {
      // Attempt 3: fallback with minimum columns
      const profMinimal = await adminClient
        .from("profiles")
        .select("id, full_name, email")
        .neq("id", coachUser.id);

      if (!profMinimal.error && profMinimal.data) {
        allProfiles = profMinimal.data.map((p) => ({
          ...p,
          phone: null,
          avatar_url: null,
        }));
      } else {
        console.error("[getAvailablePlayerCandidates] Profiles query error:", profMinimal.error);
        return actionError("Nem sikerült lekérdezni a felhasználókat az adatbázisból.");
      }
    }
  }

  // Enrich missing emails from auth if any profile lacks email
  const missingEmailUserIds = allProfiles.filter((p) => !p.email).map((p) => p.id);
  if (missingEmailUserIds.length > 0) {
    try {
      const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (authData?.users) {
        const authMap = new Map(authData.users.map((u) => [u.id, u.email ?? null]));
        for (const p of allProfiles) {
          if (!p.email && authMap.has(p.id)) {
            p.email = authMap.get(p.id) ?? null;
          }
        }
      }
    } catch (authErr) {
      console.warn("[getAvailablePlayerCandidates] Could not list auth users:", authErr);
    }
  }

  // 2. Fetch existing coach players safely with adminClient to avoid RLS mismatches
  let linkedPlayerIds = new Set<string>();
  try {
    const { data: cpData, error: cpErr } = await adminClient
      .from("coach_players")
      .select("player_id, status")
      .eq("coach_id", coachUser.id);

    if (!cpErr && cpData) {
      linkedPlayerIds = new Set(
        cpData
          .filter((cp) => (cp as { status?: string }).status !== "declined")
          .map((cp) => cp.player_id),
      );
    } else {
      // Fallback if status column doesn't exist
      const { data: fbData } = await adminClient
        .from("coach_players")
        .select("player_id")
        .eq("coach_id", coachUser.id);

      if (fbData) {
        linkedPlayerIds = new Set(fbData.map((cp) => cp.player_id));
      }
    }
  } catch (err) {
    console.warn("[getAvailablePlayerCandidates] coach_players query fallback:", err);
  }

  const candidates: PlayerCandidate[] = allProfiles
    .filter((p) => !linkedPlayerIds.has(p.id))
    .map((p) => ({
      id: p.id,
      fullName: p.full_name || (p.email ? p.email.split("@")[0] : "Felhasználó"),
      email: p.email,
      phone: p.phone,
      avatarUrl: p.avatar_url ?? null,
    }));

  return actionSuccess(candidates);
}

export async function invitePlayer(
  playerId: string,
): Promise<ActionResult<{ id: string; playerName: string | null }>> {
  let coachUser;
  try {
    const auth = await requireCoach();
    coachUser = auth.user;
  } catch {
    return actionError("Csak edzők vagy adminisztrátorok hívhatnak meg játékosokat.");
  }

  if (playerId === coachUser.id) {
    return actionError("Saját magát nem hívhatja meg játékosként.");
  }

  const adminClient = createAdminClient();
  const { data: playerProfile } = await adminClient
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", playerId)
    .maybeSingle();

  if (!playerProfile) {
    return actionError("A kiválasztott játékos nem található.");
  }

  // Check if existing record exists using adminClient
  const { data: existing } = await adminClient
    .from("coach_players")
    .select("id, status")
    .eq("coach_id", coachUser.id)
    .eq("player_id", playerId)
    .maybeSingle();

  let coachPlayerId: string;

  if (existing) {
    const currentStatus = (existing as { status?: string }).status;
    if (currentStatus === "accepted") {
      return actionError("Ez a játékos már az Ön aktív játékosa.");
    }
    if (currentStatus === "pending") {
      return actionError("A felkérés már el lett küldve ennek a játékosnak.");
    }

    // Try update with status and responded_at
    const { data: updated, error: updateError } = await adminClient
      .from("coach_players")
      .update({ status: "pending", responded_at: null })
      .eq("id", existing.id)
      .select("id")
      .single();

    if (updateError) {
      // Fallback update without status if column not yet present
      const { data: fbUpdated, error: fbUpdateError } = await adminClient
        .from("coach_players")
        .update({ created_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select("id")
        .single();

      if (fbUpdateError || !fbUpdated) {
        return actionError("Nem sikerült újra elküldeni a meghívást.");
      }
      coachPlayerId = fbUpdated.id;
    } else {
      coachPlayerId = updated.id;
    }
  } else {
    // Try insert with status
    const { data, error } = await adminClient
      .from("coach_players")
      .insert({
        coach_id: coachUser.id,
        player_id: playerId,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      // Fallback insert without status if column not yet present
      const fbInsert = await adminClient
        .from("coach_players")
        .insert({
          coach_id: coachUser.id,
          player_id: playerId,
        })
        .select("id")
        .single();

      if (fbInsert.error || !fbInsert.data) {
        console.error("[invitePlayer] Insert error:", fbInsert.error || error);
        return actionError("Nem sikerült elküldeni a meghívást az adatbázisba.");
      }
      coachPlayerId = fbInsert.data.id;
    } else {
      coachPlayerId = data.id;
    }
  }

  // Send notification to player safely
  try {
    const { createNotification } = await import("./notification");
    const { data: coachProfile } = await adminClient
      .from("profiles")
      .select("full_name, coach_title")
      .eq("id", coachUser.id)
      .maybeSingle();

    const coachName = coachProfile?.full_name ?? "Edző";
    const coachTitle = coachProfile?.coach_title ?? "Edző";

    await createNotification(
      playerProfile.id,
      "coach_invitation",
      "Edzői felkérés érkezett",
      `${coachName} (${coachTitle}) felkérte Önt a játékosai közé. Fogadja el a felkérést a felületen!`,
      { coachId: coachUser.id, coachName, coachTitle, coachPlayerId },
    );
  } catch (notifErr) {
    console.warn("[invitePlayer] Notification dispatch warning:", notifErr);
  }

  revalidatePath("/coach");
  revalidatePath("/edzeseim");
  return actionSuccess({ id: coachPlayerId, playerName: playerProfile.full_name });
}

export async function addCoachedPlayer(
  playerEmail: string,
): Promise<ActionResult<{ id: string; playerName: string | null }>> {
  let coachUser;
  try {
    const auth = await requireCoach();
    coachUser = auth.user;
  } catch {
    return actionError("Csak edzők vagy adminisztrátorok adhatnak hozzá játékosokat.");
  }

  const email = playerEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return actionError("Érvénytelen e-mail cím.");
  }

  const adminClient = createAdminClient();
  const { data: playerProfile } = await adminClient
    .from("profiles")
    .select("id, full_name, email")
    .ilike("email", email)
    .maybeSingle();

  if (playerProfile) {
    return invitePlayer(playerProfile.id);
  }

  // Check auth.users if not found in profiles email
  try {
    const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const match = authData?.users?.find((u) => u.email?.toLowerCase() === email);
    if (match) {
      return invitePlayer(match.id);
    }
  } catch {
    // ignore
  }

  return actionError(
    "Nem található regisztrált felhasználó ezzel az e-mail címmel.",
  );
}

export async function respondToCoachInvitation(
  coachPlayerId: string,
  accept: boolean,
): Promise<ActionResult<{ success: boolean; status: "accepted" | "declined" }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return actionError("Bejelentkezés szükséges.");
  }

  const adminClient = createAdminClient();

  const { data: invitation, error: fetchError } = await adminClient
    .from("coach_players")
    .select("id, coach_id, player_id")
    .eq("id", coachPlayerId)
    .eq("player_id", user.id)
    .maybeSingle();

  if (fetchError || !invitation) {
    return actionError("A meghívás nem található vagy nincs hozzá jogosultsága.");
  }

  const newStatus = accept ? "accepted" : "declined";
  const now = new Date().toISOString();

  const { error: updateError } = await adminClient
    .from("coach_players")
    .update({ status: newStatus, responded_at: now })
    .eq("id", coachPlayerId);

  if (updateError) {
    console.error("[respondToCoachInvitation] Update error:", updateError);
    return actionError("Nem sikerült rögzíteni a választ.");
  }

  // Fetch player name and notify coach
  const { data: playerProfile } = await adminClient
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const playerName = playerProfile?.full_name || "A játékos";
  try {
    const { createNotification } = await import("./notification");

    await createNotification(
      invitation.coach_id,
      "coach_assignment",
      accept ? "Meghívás elfogadva!" : "Meghívás elutasítva",
      `${playerName} ${accept ? "elfogadta" : "elutasította"} az Ön edzői felkérését.`,
      { playerId: user.id, status: newStatus },
    );
  } catch (notifErr) {
    console.warn("[respondToCoachInvitation] Notification dispatch warning:", notifErr);
  }

  revalidatePath("/edzeseim");
  revalidatePath("/coach");
  return actionSuccess({ success: true, status: newStatus });
}

export async function getPendingInvitationsForPlayer(): Promise<
  ActionResult<PendingInvitation[]>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return actionSuccess([]);
  }

  const adminClient = createAdminClient();

  const { data: invitations, error } = await adminClient
    .from("coach_players")
    .select("id, coach_id, created_at")
    .eq("player_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !invitations || invitations.length === 0) {
    return actionSuccess([]);
  }

  const coachIds = Array.from(new Set(invitations.map((i) => i.coach_id)));
  let coachProfiles: {
    id: string;
    full_name: string | null;
    coach_title: string | null;
    avatar_url?: string | null;
  }[] = [];

  const cWithAvatar = await adminClient
    .from("profiles")
    .select("id, full_name, coach_title, avatar_url")
    .in("id", coachIds);

  if (!cWithAvatar.error && cWithAvatar.data) {
    coachProfiles = cWithAvatar.data;
  } else {
    const cWithout = await adminClient
      .from("profiles")
      .select("id, full_name, coach_title")
      .in("id", coachIds);
    coachProfiles = (cWithout.data ?? []).map((c) => ({
      ...c,
      avatar_url: null,
    }));
  }

  const coachMap = new Map((coachProfiles ?? []).map((c) => [c.id, c]));

  const result: PendingInvitation[] = invitations.map((inv) => {
    const coach = coachMap.get(inv.coach_id);
    return {
      id: inv.id,
      coachId: inv.coach_id,
      coachName: coach?.full_name || "Edző",
      coachTitle: coach?.coach_title ?? null,
      coachAvatarUrl: coach?.avatar_url ?? null,
      createdAt: inv.created_at,
    };
  });

  return actionSuccess(result);
}

export async function removeCoachedPlayer(
  coachPlayerId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireCoach();
  } catch {
    return actionError("Csak edzők kezelhetik a játékosaikat.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("coach_players")
    .delete()
    .eq("id", coachPlayerId);

  if (error) {
    return actionError("Nem sikerült eltávolítani a játékost.");
  }

  revalidatePath("/coach");
  revalidatePath("/edzeseim");
  return actionSuccess({ id: coachPlayerId });
}

export async function getCoachPlayers(): Promise<ActionResult<CoachPlayer[]>> {
  let coachUser;
  try {
    const auth = await requireCoach();
    coachUser = auth.user;
  } catch {
    return actionError("Csak edzők érhetik el ezt a funkciót.");
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("coach_players")
    .select("id, coach_id, player_id, status, responded_at, created_at")
    .eq("coach_id", coachUser.id)
    .order("created_at", { ascending: false });

  let playersData = data;
  if (error || !playersData) {
    // Fallback if status column not yet present
    const fb = await adminClient
      .from("coach_players")
      .select("id, coach_id, player_id, created_at")
      .eq("coach_id", coachUser.id)
      .order("created_at", { ascending: false });
    playersData = (fb.data ?? []).map((p) => ({
      ...p,
      status: "pending",
      responded_at: null,
    }));
  }

  const playerIds = (playersData ?? []).map((p) => p.player_id);
  let playerProfiles: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  }[] = [];
  if (playerIds.length > 0) {
    const pWithAvatar = await adminClient
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url")
      .in("id", playerIds);
    if (!pWithAvatar.error && pWithAvatar.data) {
      playerProfiles = pWithAvatar.data;
    } else {
      const pWithout = await adminClient
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", playerIds);
      playerProfiles = (pWithout.data ?? []).map((p) => ({
        ...p,
        avatar_url: null,
      }));
    }
  }

  const profileMap = new Map(playerProfiles.map((p) => [p.id, p]));

  const players: CoachPlayer[] = (playersData ?? []).map((p) => {
    const prof = profileMap.get(p.player_id);
    const rawStatus = (p as { status?: string }).status;
    const finalStatus: CoachPlayerStatus =
      rawStatus === "accepted" || rawStatus === "declined" ? rawStatus : "pending";

    return {
      id: p.id,
      coachId: p.coach_id,
      playerId: p.player_id,
      status: finalStatus,
      createdAt: p.created_at,
      respondedAt: (p as { responded_at?: string | null }).responded_at ?? null,
      playerName: prof?.full_name ?? null,
      playerEmail: prof?.email ?? null,
      playerPhone: prof?.phone ?? null,
      playerAvatarUrl: prof?.avatar_url ?? null,
    };
  });

  return actionSuccess(players);
}

// ==========================================
// PLAYER STATISTICS
// ==========================================

const addStatSchema = z.object({
  playerId: z.string().uuid(),
  statType: z.string().trim().min(1),
  statValue: z.string().trim().min(1),
  notes: z.string().trim().optional(),
  recordedAt: z.string().optional(),
});

export type AddStatInput = z.infer<typeof addStatSchema>;

export async function getPlayerStatistics(
  playerId: string,
): Promise<ActionResult<PlayerStatistic[]>> {
  let coachUser;
  try {
    const auth = await requireCoach();
    coachUser = auth.user;
  } catch {
    return actionError("Csak edzők érhetik el a statisztikákat.");
  }

  // Verify this player belongs to the coach
  const supabase = await createClient();
  const { data: link } = await supabase
    .from("coach_players")
    .select("id")
    .eq("coach_id", coachUser.id)
    .eq("player_id", playerId)
    .maybeSingle();

  if (!link) {
    return actionError("Ez a játékos nem tartozik Önhöz.");
  }

  const { data, error } = await supabase
    .from("player_statistics")
    .select("*")
    .eq("coach_id", coachUser.id)
    .eq("player_id", playerId)
    .order("recorded_at", { ascending: false });

  if (error) {
    return actionError("Nem sikerült lekérdezni a statisztikákat.");
  }

  const stats: PlayerStatistic[] = (data ?? []).map((s) => ({
    id: s.id,
    coachId: s.coach_id,
    playerId: s.player_id,
    statType: s.stat_type,
    statValue: s.stat_value,
    notes: s.notes,
    recordedAt: s.recorded_at,
    createdAt: s.created_at,
  }));

  return actionSuccess(stats);
}

export async function addPlayerStatistic(
  input: AddStatInput,
): Promise<ActionResult<{ id: string }>> {
  let coachUser;
  try {
    const auth = await requireCoach();
    coachUser = auth.user;
  } catch {
    return actionError("Csak edzők rögzíthetnek statisztikát.");
  }

  const parsed = addStatSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      parsed.error.issues[0]?.message ?? "Érvénytelen adatok.",
    );
  }

  // Verify player belongs to coach
  const supabase = await createClient();
  const { data: link } = await supabase
    .from("coach_players")
    .select("id")
    .eq("coach_id", coachUser.id)
    .eq("player_id", parsed.data.playerId)
    .maybeSingle();

  if (!link) {
    return actionError("Ez a játékos nem tartozik Önhöz.");
  }

  const { data, error } = await supabase
    .from("player_statistics")
    .insert({
      coach_id: coachUser.id,
      player_id: parsed.data.playerId,
      stat_type: parsed.data.statType,
      stat_value: parsed.data.statValue,
      notes: parsed.data.notes ?? null,
      recorded_at: parsed.data.recordedAt ?? new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    return actionError("Nem sikerült rögzíteni a statisztikát.");
  }

  revalidatePath("/coach");
  return actionSuccess({ id: data.id });
}

export async function deletePlayerStatistic(
  statId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireCoach();
  } catch {
    return actionError("Csak edzők törölhetnek statisztikát.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("player_statistics")
    .delete()
    .eq("id", statId);

  if (error) {
    return actionError("Nem sikerült törölni a statisztikát.");
  }

  revalidatePath("/coach");
  return actionSuccess({ id: statId });
}

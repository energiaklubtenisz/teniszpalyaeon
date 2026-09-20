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

const emailSchema = z
  .string()
  .trim()
  .email(adminContent.seasonPass.addForm.errors.invalidEmail)
  .transform((val) => val.toLowerCase());

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
    .select("id, email, full_name, phone, active_season_pass");

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

  // Candidates: registered users who do NOT yet have an active season pass
  const candidates: RegisteredUserCandidate[] = (profiles ?? [])
    .filter((p) => p.email && !activeEmailSet.has(p.email.toLowerCase()))
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
    return actionError(parsed.error.issues[0]?.message ?? adminContent.seasonPass.addForm.errors.invalidEmail);
  }

  const email = parsed.data;
  const supabase = createAdminClient();

  // Check if email already exists in whitelist
  const { data: existing } = await supabase
    .from("season_pass_whitelist")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (existing) {
    return actionError(adminContent.seasonPass.addForm.errors.alreadyExists);
  }

  // Insert into whitelist (trigger will automatically activate active_season_pass on profiles if exists)
  const { error: insertError } = await supabase
    .from("season_pass_whitelist")
    .insert({
      email,
      created_by: adminUser.id,
    });

  if (insertError) {
    return actionError(adminContent.seasonPass.addForm.errors.generic);
  }

  // Check if profile exists for user feedback
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  revalidatePath("/admin");
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

  // Delete from whitelist (trigger will automatically set active_season_pass = false on profiles)
  const { error: deleteError } = await supabase
    .from("season_pass_whitelist")
    .delete()
    .eq("id", whitelistId);

  if (deleteError) {
    return actionError(adminContent.seasonPass.revokeError);
  }

  revalidatePath("/admin");
  revalidatePath("/", "layout");

  return actionSuccess({ email: row.email });
}

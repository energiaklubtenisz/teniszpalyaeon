"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  actionError,
  actionSuccess,
  type ActionResult,
} from "@/types/action-result";
import type { Notification } from "@/types/coach";

// ==========================================
// NOTIFICATION ACTIONS
// ==========================================

export async function getUnreadNotificationCount(): Promise<
  ActionResult<number>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return actionSuccess(0);
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) {
    return actionError("Nem sikerült lekérdezni az értesítéseket.");
  }

  return actionSuccess(count ?? 0);
}

export async function getNotifications(): Promise<
  ActionResult<Notification[]>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return actionError("Az értesítések megtekintéséhez be kell jelentkeznie.");
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return actionError("Nem sikerült lekérdezni az értesítéseket.");
  }

  const notifications: Notification[] = (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: (row.data ?? {}) as Record<string, unknown>,
    read: row.read,
    createdAt: row.created_at,
  }));

  return actionSuccess(notifications);
}

export async function markNotificationRead(
  notificationId: string,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return actionError("Nincs bejelentkezve.");
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    return actionError("Nem sikerült olvasottnak jelölni az értesítést.");
  }

  revalidatePath("/", "layout");
  return actionSuccess({ id: notificationId });
}

export async function markAllNotificationsRead(): Promise<
  ActionResult<{ count: number }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return actionError("Nincs bejelentkezve.");
  }

  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false)
    .select("id");

  if (error) {
    return actionError("Nem sikerült olvasottnak jelölni az értesítéseket.");
  }

  revalidatePath("/", "layout");
  return actionSuccess({ count: data?.length ?? 0 });
}

/**
 * Creates a notification for a user. Uses admin client to bypass RLS INSERT
 * restriction (only service_role can insert notifications).
 */
export async function createNotification(
  userId: string,
  type: import("@/types/coach").NotificationType,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
): Promise<ActionResult<{ id: string }>> {
  const supabase = createAdminClient();

  const { data: row, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type,
      title,
      body,
      data,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createNotification] Error:", error);
    return actionError("Nem sikerült létrehozni az értesítést.");
  }

  revalidatePath("/", "layout");
  return actionSuccess({ id: row.id });
}

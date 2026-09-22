import { Suspense } from "react";

import { AuthToast } from "@/components/feature/chrome/AuthToast";
import { SiteFooter } from "@/components/feature/chrome/SiteFooter";
import { SiteHeader } from "@/components/feature/chrome/SiteHeader";
import { createClient } from "@/lib/supabase/server";

export default async function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let isCoach = false;
  let isCoachedPlayer = false;
  let userName: string | null = null;
  let userEmail: string | null = null;
  let avatarUrl: string | null = null;
  let unreadNotificationCount = 0;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    isAdmin = profile?.role === "admin";
    isCoach = profile?.role === "coach";
    userName =
      profile?.full_name?.trim() ||
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      (user.email ? user.email.split("@")[0] : null);
    userEmail = user.email ?? null;
    avatarUrl =
      (user.user_metadata?.avatar_url as string | undefined) ?? null;

    // Check if user is a coached player
    const { count: coachCount } = await supabase
      .from("coach_players")
      .select("*", { count: "exact", head: true })
      .eq("player_id", user.id);

    isCoachedPlayer = (coachCount ?? 0) > 0;

    // Get unread notification count
    const { count: notifCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    unreadNotificationCount = notifCount ?? 0;
  }

  return (
    <>
      <SiteHeader
        isAuthenticated={Boolean(user)}
        isAdmin={isAdmin}
        isCoach={isCoach}
        isCoachedPlayer={isCoachedPlayer}
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        unreadNotificationCount={unreadNotificationCount}
      />
      <Suspense fallback={null}>
        <AuthToast />
      </Suspense>
      {children}
      <SiteFooter />
    </>
  );
}

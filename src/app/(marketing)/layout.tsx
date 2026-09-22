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
  let userName: string | null = null;
  let userEmail: string | null = null;
  let avatarUrl: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    isAdmin = profile?.role === "admin";
    userName =
      profile?.full_name?.trim() ||
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      (user.email ? user.email.split("@")[0] : null);
    userEmail = user.email ?? null;
    avatarUrl =
      (user.user_metadata?.avatar_url as string | undefined) ?? null;
  }

  return (
    <>
      <SiteHeader
        isAuthenticated={Boolean(user)}
        isAdmin={isAdmin}
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
      />
      <Suspense fallback={null}>
        <AuthToast />
      </Suspense>
      {children}
      <SiteFooter />
    </>
  );
}

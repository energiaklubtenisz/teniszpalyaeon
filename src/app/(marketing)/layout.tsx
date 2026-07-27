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

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    isAdmin = profile?.role === "admin";
  }

  return (
    <>
      <SiteHeader isAuthenticated={Boolean(user)} isAdmin={isAdmin} />
      <Suspense fallback={null}>
        <AuthToast />
      </Suspense>
      {children}
      <SiteFooter />
    </>
  );
}

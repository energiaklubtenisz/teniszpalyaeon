import { Suspense } from "react";

import { AuthToast } from "@/components/feature/chrome/AuthToast";
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

  return (
    <>
      <SiteHeader isAuthenticated={Boolean(user)} />
      <Suspense fallback={null}>
        <AuthToast />
      </Suspense>
      {children}
    </>
  );
}

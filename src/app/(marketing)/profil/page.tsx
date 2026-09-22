import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfilePage } from "@/components/feature/profile/ProfilePage";
import { profile } from "@/content/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: profile.title,
  description: profile.support,
};

export default async function ProfileRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: row } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  const fullName =
    row?.full_name?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    "";

  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <ProfilePage
      email={user.email ?? ""}
      fullName={fullName}
      phone={row?.phone ?? ""}
      avatarUrl={avatarUrl}
    />
  );
}

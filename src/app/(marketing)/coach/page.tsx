import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CoachDashboard } from "@/components/feature/coach/CoachDashboard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Edzői felület",
  description: "Edzői dashboard — ismétlődő foglalások, játékosok és statisztikák kezelése.",
};

export default async function CoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "coach" && profile?.role !== "admin") {
    redirect("/");
  }

  return <CoachDashboard />;
}

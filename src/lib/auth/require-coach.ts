import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export async function requireCoach(): Promise<{ user: User }> {
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

  return { user };
}

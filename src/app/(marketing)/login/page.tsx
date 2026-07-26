import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginPage } from "@/components/feature/login/LoginPage";
import { login } from "@/content/login";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: login.title,
  description: login.support,
};

export default async function LoginRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/booking");
  }

  return <LoginPage />;
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RegisterPage } from "@/components/feature/register/RegisterPage";
import { register } from "@/content/register";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: register.title,
  description: register.support,
};

export default async function RegisterRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/booking");
  }

  return <RegisterPage />;
}

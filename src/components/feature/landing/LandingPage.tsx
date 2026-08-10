import { LandingHero } from "@/components/feature/landing/LandingHero";
import { LandingSections } from "@/components/feature/landing/LandingSections";
import { createClient } from "@/lib/supabase/server";

import styles from "./landing.module.css";

export async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className={styles.page}>
      <LandingHero isAuthenticated={Boolean(user)} />
      <LandingSections />
    </main>
  );
}

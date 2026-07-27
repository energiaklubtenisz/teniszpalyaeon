import { LandingHero } from "@/components/feature/landing/LandingHero";
import { LandingSections } from "@/components/feature/landing/LandingSections";

import styles from "./landing.module.css";

export function LandingPage() {
  return (
    <main className={styles.page}>
      <LandingHero />
      <LandingSections />
    </main>
  );
}

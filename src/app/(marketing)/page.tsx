import type { Metadata } from "next";

import { LandingPage } from "@/components/feature/landing/LandingPage";
import { landing } from "@/content/landing";

export const metadata: Metadata = {
  title: landing.hero.brand,
  description: landing.hero.support,
};

export default function Home() {
  return <LandingPage />;
}

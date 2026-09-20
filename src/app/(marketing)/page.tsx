import type { Metadata } from "next";

import { LandingPage } from "@/components/feature/landing/LandingPage";
import { landing } from "@/content/landing";

export const metadata: Metadata = {
  title: {
    absolute:
      "Energia Szabadidősport Klub — Nagykanizsa | 8 Salakos Teniszpálya",
  },
  description:
    "Nagykanizsa legnagyobb szabadtéri teniszklubja 8 minőségi salakpályával. Online pályafoglalás, kedvező bérletárak és sportközösség az E.ON támogatásával.",
};

export default function Home() {
  return <LandingPage />;
}

import type { Metadata } from "next";

import { MyPracticesPage } from "@/components/feature/practices/MyPracticesPage";

export const metadata: Metadata = {
  title: "Edzéseim",
  description: "Edzéseim — közelgő edzések és gyakorlatok megtekintése.",
};

export default function PracticesPage() {
  return <MyPracticesPage />;
}

import type { Metadata } from "next";

import { PrivacyPage } from "@/components/feature/privacy/PrivacyPage";
import { privacy } from "@/content/privacy";

export const metadata: Metadata = {
  title: privacy.title,
  description: privacy.lead,
};

export default function PrivacyRoute() {
  return <PrivacyPage />;
}

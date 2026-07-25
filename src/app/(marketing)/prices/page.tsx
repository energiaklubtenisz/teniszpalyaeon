import type { Metadata } from "next";

import { PricesPage } from "@/components/feature/prices/PricesPage";
import { prices } from "@/content/prices";

export const metadata: Metadata = {
  title: prices.title,
  description: prices.lead,
};

export default function PricesRoute() {
  return <PricesPage />;
}

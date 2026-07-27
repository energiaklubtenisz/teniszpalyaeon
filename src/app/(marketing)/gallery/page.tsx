import type { Metadata } from "next";

import { GalleryPage } from "@/components/feature/gallery/GalleryPage";
import { gallery } from "@/content/gallery";

export const metadata: Metadata = {
  title: gallery.title,
  description: gallery.lead,
};

export default function GalleryRoute() {
  return <GalleryPage />;
}

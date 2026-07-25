import { PageBanner } from "@/components/feature/chrome/PageBanner";
import { gallery } from "@/content/gallery";

import styles from "./gallery.module.css";

export function GalleryPage() {
  return (
    <main className={styles.page}>
      <PageBanner title={gallery.title} lead={gallery.lead} />
    </main>
  );
}

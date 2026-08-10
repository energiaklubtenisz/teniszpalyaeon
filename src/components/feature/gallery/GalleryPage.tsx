import { PageBanner } from "@/components/feature/chrome/PageBanner";
import { gallery } from "@/content/gallery";

import styles from "./gallery.module.css";

export function GalleryPage() {
  const placeholders = Array.from(
    { length: gallery.placeholderCount },
    (_, index) => index,
  );

  return (
    <main className={styles.page}>
      <PageBanner title={gallery.title} lead={gallery.lead} />

      <section className={styles.gridSection} aria-label={gallery.title}>
        <ul className={styles.grid}>
          {placeholders.map((index) => (
            <li
              key={index}
              className={styles.item}
              style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
            >
              <div
                className={styles.frame}
                role="img"
                aria-label={gallery.placeholderLabel}
              >
                <span className={styles.placeholderMark} aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

import Image from "next/image";

import { PageBanner } from "@/components/feature/chrome/PageBanner";
import { gallery } from "@/content/gallery";
import { assets } from "@/lib/assets";

import styles from "./gallery.module.css";

export function GalleryPage() {
  return (
    <main className={styles.page}>
      <PageBanner
        title={gallery.title}
        lead={gallery.lead}
        imageSrc={assets.pages.gallery}
        imageAlt="Galéria hangulatkép — salakpálya"
      />

      <section className={styles.gridSection} aria-label={gallery.title}>
        <ul className={styles.grid}>
          {assets.gallery.map((item, index) => (
            <li
              key={item.src}
              className={styles.item}
              style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
            >
              <div className={styles.frame}>
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className={styles.image}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

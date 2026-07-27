import Image from "next/image";
import Link from "next/link";

import { contact } from "@/content/contact";
import { site } from "@/content/site";
import { assets } from "@/lib/assets";

import styles from "./site-footer.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logoLink}>
            <Image
              src={assets.brand.logo}
              alt={site.name}
              fill
              className={styles.logoImage}
              sizes="8rem"
            />
          </Link>
          <p className={styles.brandName}>{site.name}</p>
          <p className={styles.address}>{contact.address.lines[0]}</p>
        </div>

        <nav className={styles.nav} aria-label="Lábléc navigáció">
          {site.nav.primary.map((item) => (
            <Link key={item.href} href={item.href} className={styles.link}>
              {item.label}
            </Link>
          ))}
        </nav>

        <nav className={styles.legalNav} aria-label="Jogi információk">
          {site.nav.legal.map((item) => (
            <Link key={item.href} href={item.href} className={styles.legalLink}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

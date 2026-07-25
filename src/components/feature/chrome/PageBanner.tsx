import Image from "next/image";

import { cn } from "@/lib/utils";

import styles from "./page-banner.module.css";

type PageBannerProps = {
  title: string;
  lead: string;
  imageSrc?: string;
  imageAlt?: string;
  className?: string;
};

export function PageBanner({
  title,
  lead,
  imageSrc,
  imageAlt,
  className,
}: PageBannerProps) {
  return (
    <header
      className={cn(styles.banner, !imageSrc && styles.bannerPlain, className)}
    >
      {imageSrc ? (
        <>
          <div className={styles.media} aria-hidden>
            <Image
              src={imageSrc}
              alt=""
              fill
              priority
              className={styles.mediaImage}
              sizes="100vw"
            />
          </div>
          <div className={styles.scrim} aria-hidden />
        </>
      ) : null}
      <div className={styles.copy}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.lead}>{lead}</p>
        {imageAlt ? (
          <span className={styles.srOnly}>{imageAlt}</span>
        ) : null}
      </div>
    </header>
  );
}

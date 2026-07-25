import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { landing } from "@/content/landing";
import { assets } from "@/lib/assets";
import { cn } from "@/lib/utils";

import styles from "./landing.module.css";

export function LandingHero() {
  const { hero } = landing;

  return (
    <section className={styles.hero} aria-labelledby="hero-brand">
      <div className={styles.media} aria-hidden>
        <Image
          src={assets.landing.hero}
          alt=""
          fill
          priority
          className={styles.mediaImage}
          sizes="100vw"
        />
      </div>
      <div className={styles.scrim} aria-hidden />

      <div className={styles.copy}>
        <p id="hero-brand" className={styles.brand}>
          {hero.brand}
        </p>
        <h1 className={styles.headline}>{hero.headline}</h1>
        <p className={styles.support}>{hero.support}</p>
        <div className={styles.actions}>
          <Link
            href={hero.primaryCta.href}
            className={cn(buttonVariants({ size: "lg" }), styles.primaryCta)}
          >
            {hero.primaryCta.label}
          </Link>
          <Link
            href={hero.secondaryCta.href}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              styles.secondaryCta,
            )}
          >
            {hero.secondaryCta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

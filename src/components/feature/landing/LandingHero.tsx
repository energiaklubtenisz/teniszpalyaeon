import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { landing } from "@/content/landing";
import { assets } from "@/lib/assets";
import { cn } from "@/lib/utils";

import styles from "./landing.module.css";

type LandingHeroProps = {
  isAuthenticated?: boolean;
};

export function LandingHero({ isAuthenticated = false }: LandingHeroProps) {
  const { hero } = landing;

  return (
    <section className={styles.hero} aria-labelledby="hero-brand">
      <div className={styles.heroMedia} aria-hidden>
        <Image
          src={assets.landing.hero}
          alt=""
          fill
          priority
          className={styles.heroImage}
          sizes="100vw"
        />
        <div className={styles.heroScrim} />
      </div>

      <div className={styles.heroPanel}>
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
          {!isAuthenticated ? (
            <Link
              href={hero.secondaryCta.href}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                styles.secondaryCta,
              )}
            >
              {hero.secondaryCta.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

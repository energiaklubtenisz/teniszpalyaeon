import { PageBanner } from "@/components/feature/chrome/PageBanner";
import { prices } from "@/content/prices";
import { assets } from "@/lib/assets";

import styles from "./prices.module.css";

export function PricesPage() {
  const { intro, passes, hourly } = prices;

  return (
    <main className={styles.page}>
      <PageBanner
        title={prices.title}
        lead={prices.lead}
        imageSrc={assets.pages.prices}
        imageAlt="Árak — teniszpálya"
      />

      <section className={styles.bandIntro} aria-labelledby="intro-heading">
        <div className={styles.inner}>
          <h2 id="intro-heading" className={styles.sectionTitle}>
            {intro.title}
          </h2>
          {intro.paragraphs.map((paragraph) => (
            <p key={paragraph} className={styles.body}>
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section className={styles.bandPasses} aria-labelledby="passes-heading">
        <div className={styles.innerWide}>
          <h2 id="passes-heading" className={styles.sectionTitle}>
            {passes.title}
          </h2>
          <ul className={styles.priceList}>
            {passes.items.map((item) => (
              <li key={item.name} className={styles.priceRow}>
                <div className={styles.priceCopy}>
                  <p className={styles.priceName}>{item.name}</p>
                  {"note" in item && item.note ? (
                    <p className={styles.priceNote}>{item.note}</p>
                  ) : null}
                </div>
                <p className={styles.priceValue}>
                  <span className={styles.priceAmount}>{item.price}</span>
                  <span className={styles.priceUnit}>{item.unit}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.bandHourly} aria-labelledby="hourly-heading">
        <div className={styles.innerWide}>
          <div className={styles.hourlyPanel}>
            <h2 id="hourly-heading" className={styles.sectionTitle}>
              {hourly.title}
            </h2>
            <p className={styles.sectionLead}>{hourly.lead}</p>
            <div className={styles.priceRow}>
              <p className={styles.priceName}>{hourly.name}</p>
              <p className={styles.priceValue}>
                <span className={styles.priceAmount}>{hourly.price}</span>
                <span className={styles.priceUnit}>{hourly.unit}</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

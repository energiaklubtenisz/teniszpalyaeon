import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { landing } from "@/content/landing";
import { assets } from "@/lib/assets";

import styles from "./landing.module.css";

export function LandingSections() {
  const { court, mission, leadership } = landing;

  return (
    <div className={styles.sections}>
      <section
        className={styles.bandCourt}
        aria-labelledby="court-heading"
      >
        <div className={styles.sectionInner}>
          <h2 id="court-heading" className={styles.sectionTitle}>
            {court.title}
          </h2>
          <p className={styles.sectionLead}>{court.lead}</p>
          <div className={styles.courtPhoto}>
            <Image
              src={assets.gallery[0].src}
              alt={assets.gallery[0].alt}
              fill
              className={styles.courtPhotoImage}
              sizes="(max-width: 768px) 100vw, 40rem"
            />
          </div>
          <div className={styles.prose}>
            {court.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <Link
            href={court.map.href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapLink}
          >
            <span>{court.map.label}</span>
            <ArrowUpRight className={styles.mapIcon} aria-hidden />
          </Link>
        </div>
      </section>

      <section
        className={styles.bandMission}
        aria-labelledby="mission-heading"
      >
        <div className={styles.sectionInner}>
          <h2 id="mission-heading" className={styles.sectionTitle}>
            {mission.title}
          </h2>
          <p className={styles.sectionLead}>{mission.lead}</p>
          <div className={styles.prose}>
            {mission.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <p className={styles.closing}>{mission.closing}</p>
        </div>
      </section>

      <section
        className={styles.bandLeadership}
        aria-labelledby="leadership-heading"
      >
        <div className={styles.sectionInner}>
          <h2 id="leadership-heading" className={styles.sectionTitle}>
            {leadership.title}
          </h2>
          <p className={styles.sectionLead}>{leadership.intro}</p>

          <dl className={styles.people}>
            <div className={styles.personRow}>
              <dt>{leadership.president.role}</dt>
              <dd>{leadership.president.name}</dd>
            </div>

            <div className={styles.boardBlock}>
              <dt>{leadership.boardTitle}</dt>
              <dd>
                <ul className={styles.boardList}>
                  {leadership.board.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </dd>
            </div>

            <div className={styles.personRow}>
              <dt>{leadership.caretaker.role}</dt>
              <dd>{leadership.caretaker.name}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}

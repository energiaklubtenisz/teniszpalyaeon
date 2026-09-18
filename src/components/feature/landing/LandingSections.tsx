import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { landing } from "@/content/landing";

import styles from "./landing.module.css";

export function LandingSections() {
  const { court, mission, leadership } = landing;

  return (
    <div className={styles.sections}>
      <section
        className={styles.courtSection}
        aria-labelledby="court-heading"
      >
        <div className={styles.courtShell}>
          <div
            className={styles.courtPhoto}
            role="img"
            aria-label="Fotó helye"
          >
            <span className={styles.courtIndex} aria-hidden>
              01
            </span>
          </div>

          <div className={styles.courtCopy}>
            <p className={styles.sectionKicker}>Helyszín</p>
            <h2 id="court-heading" className={styles.sectionTitle}>
              {court.title}
            </h2>
            <p className={styles.sectionLead}>{court.lead}</p>
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
        </div>
      </section>

      <section
        className={styles.missionSection}
        aria-labelledby="mission-heading"
      >
        <div className={styles.missionFrame}>
          <span className={styles.missionCorner} aria-hidden />
          <span className={styles.missionCornerB} aria-hidden />
          <p className={styles.sectionKicker}>Küldetés</p>
          <h2 id="mission-heading" className={styles.sectionTitle}>
            {mission.title}
          </h2>
          <p className={styles.missionLead}>{mission.lead}</p>
          <div className={styles.missionGrid}>
            {mission.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <p className={styles.closing}>{mission.closing}</p>
        </div>
      </section>

      <section
        className={styles.leadershipSection}
        aria-labelledby="leadership-heading"
      >
        <div className={styles.leadershipHead}>
          <p className={styles.sectionKicker}>Vezetőség</p>
          <h2 id="leadership-heading" className={styles.sectionTitle}>
            {leadership.title}
          </h2>
          <p className={styles.sectionLead}>{leadership.intro}</p>
        </div>

        <div className={styles.peopleGrid}>
          <article className={styles.personCard}>
            <p className={styles.personRole}>{leadership.president.role}</p>
            <p className={styles.personName}>{leadership.president.name}</p>
          </article>

          <article className={styles.boardCard}>
            <p className={styles.personRole}>{leadership.boardTitle}</p>
            <ul className={styles.boardList}>
              {leadership.board.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </article>

          <article className={styles.personCard}>
            <p className={styles.personRole}>{leadership.caretaker.role}</p>
            <p className={styles.personName}>{leadership.caretaker.name}</p>
          </article>
        </div>
      </section>
    </div>
  );
}

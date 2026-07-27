import { privacy } from "@/content/privacy";

import styles from "./privacy.module.css";

export function PrivacyPage() {
  return (
    <main className={styles.page}>
      <article className={styles.article}>
        <header className={styles.header}>
          <h1 className={styles.title}>{privacy.title}</h1>
          <p className={styles.lead}>{privacy.lead}</p>
          <p className={styles.updated}>
            Hatálybalépés: {privacy.lastUpdated}
          </p>
        </header>

        <div className={styles.body}>
          {privacy.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className={styles.section}
              aria-labelledby={`${section.id}-heading`}
            >
              <h2 id={`${section.id}-heading`} className={styles.sectionTitle}>
                {section.title}
              </h2>

              {"paragraphs" in section && section.paragraphs
                ? section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className={styles.paragraph}>
                      {paragraph}
                    </p>
                  ))
                : null}

              {"subsections" in section && section.subsections
                ? section.subsections.map((subsection) => (
                    <div key={subsection.title} className={styles.subsection}>
                      <h3 className={styles.subsectionTitle}>
                        {subsection.title}
                      </h3>
                      {"paragraphs" in subsection && subsection.paragraphs
                        ? subsection.paragraphs.map((paragraph) => (
                            <p key={paragraph} className={styles.paragraph}>
                              {paragraph}
                            </p>
                          ))
                        : null}
                      {"items" in subsection && subsection.items ? (
                        <ul className={styles.list}>
                          {subsection.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : null}
                      {"note" in subsection && subsection.note ? (
                        <p className={styles.note}>{subsection.note}</p>
                      ) : null}
                    </div>
                  ))
                : null}

              {"processors" in section && section.processors ? (
                <ul className={styles.processorList}>
                  {section.processors.map((processor) => (
                    <li key={processor.name} className={styles.processorItem}>
                      <strong>{processor.name}</strong>
                      <span>{processor.purpose}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {"closing" in section && section.closing ? (
                <p className={styles.paragraph}>{section.closing}</p>
              ) : null}

              {"items" in section && section.items ? (
                <ul className={styles.list}>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}

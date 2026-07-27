import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { PageBanner } from "@/components/feature/chrome/PageBanner";
import { ContactForm } from "@/components/feature/contact/ContactForm";
import { contact } from "@/content/contact";
import { assets } from "@/lib/assets";

import styles from "./contact.module.css";

type ContactPageProps = {
  helpTopic?: string | null;
};

export function ContactPage({ helpTopic = null }: ContactPageProps) {
  const { address, people, access, form, map } = contact;

  return (
    <main className={styles.page}>
      <PageBanner
        title={contact.title}
        lead={contact.lead}
        imageSrc={assets.pages.contact}
        imageAlt="Salakpálya hangulatkép — kapcsolat"
      />

      <section className={styles.bandAddress} aria-labelledby="address-heading">
        <div className={styles.inner}>
          <h2 id="address-heading" className={styles.sectionTitle}>
            {address.title}
          </h2>

          <div className={styles.addressGrid}>
            <div>
              <p className={styles.label}>{address.label}</p>
              {address.lines.map((line) => (
                <p key={line} className={styles.addressLine}>
                  {line}
                </p>
              ))}
              <p className={styles.body}>{address.directions}</p>
            </div>
            <div className={styles.addressSide}>
              <p className={styles.label}>{address.parking.title}</p>
              <p className={styles.body}>{address.parking.body}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.bandSplit} aria-labelledby="people-heading">
        <div className={styles.innerWide}>
          <div className={styles.splitGrid}>
            <div className={styles.splitCol}>
              <h2 id="people-heading" className={styles.sectionTitle}>
                {people.title}
              </h2>

              <div className={styles.peopleList}>
                {people.contacts.map((person) => (
                  <div key={person.name} className={styles.person}>
                    <p className={styles.label}>{person.role}</p>
                    <p className={styles.personName}>{person.name}</p>
                    <ul className={styles.contactLinks}>
                      {person.phones.map((phone) => (
                        <li key={phone.href}>
                          <a href={phone.href} className={styles.contactLink}>
                            {phone.label}
                          </a>
                        </li>
                      ))}
                      {person.emails.map((email) => (
                        <li key={email.href}>
                          <a href={email.href} className={styles.contactLink}>
                            {email.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <dl className={styles.lines}>
                {people.lines.map((line) => (
                  <div key={line.role} className={styles.lineRow}>
                    <dt>{line.role}</dt>
                    <dd>
                      <a href={line.href} className={styles.contactLink}>
                        {line.detail}
                      </a>
                      {line.note ? (
                        <span className={styles.note}> — {line.note}</span>
                      ) : null}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className={styles.splitCol} aria-labelledby="access-heading">
              <h2 id="access-heading" className={styles.sectionTitle}>
                {access.title}
              </h2>

              <div className={styles.accessBlock}>
                <h3 className={styles.subTitle}>{access.gate.title}</h3>
                {access.gate.paragraphs.map((paragraph) => (
                  <p key={paragraph} className={styles.body}>
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className={styles.accessBlock}>
                <h3 className={styles.subTitle}>{access.seasonPass.title}</h3>
                {access.seasonPass.paragraphs.map((paragraph) => (
                  <p key={paragraph} className={styles.body}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.bandForm} aria-labelledby="form-heading">
        <div className={styles.inner}>
          <h2 id="form-heading" className={styles.sectionTitle}>
            {form.title}
          </h2>
          <p className={styles.sectionLead}>{form.lead}</p>
          <ContactForm defaultMessage={""} />
        </div>
      </section>

      <section className={styles.mapSection} aria-labelledby="map-heading">
        <div className={styles.mapHeader}>
          <h2 id="map-heading" className={styles.mapTitle}>
            {map.title}
          </h2>
          <Link
            href={map.href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapOpen}
          >
            <span>{map.openLabel}</span>
            <ArrowUpRight className={styles.mapIcon} aria-hidden />
          </Link>
        </div>
        <div className={styles.mapFrame}>
          <iframe
            title={map.iframeTitle}
            src={map.embedSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className={styles.mapIframe}
          />
        </div>
      </section>
    </main>
  );
}

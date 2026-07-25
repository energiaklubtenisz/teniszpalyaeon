import { register } from "@/content/register";

import styles from "./register.module.css";

export function RegisterPage() {
  return (
    <main className={styles.page}>
      <section className={styles.section}>
        <h1 className={styles.title}>{register.title}</h1>
        <p className={styles.support}>{register.support}</p>
      </section>
    </main>
  );
}

import { login } from "@/content/login";

import styles from "./login.module.css";

export function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.section}>
        <h1 className={styles.title}>{login.title}</h1>
        <p className={styles.support}>{login.support}</p>
      </section>
    </main>
  );
}

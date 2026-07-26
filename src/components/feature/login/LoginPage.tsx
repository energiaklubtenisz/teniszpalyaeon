import Link from "next/link";

import { LoginForm } from "@/components/feature/login/LoginForm";
import { login } from "@/content/login";

import styles from "./login.module.css";

export function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.section}>
        <h1 className={styles.title}>{login.title}</h1>
        <p className={styles.support}>{login.support}</p>
        <LoginForm />
        <p className={styles.footer}>
          {login.registerPrompt}{" "}
          <Link href="/register" className={styles.footerLink}>
            {login.registerLink}
          </Link>
        </p>
      </section>
    </main>
  );
}
